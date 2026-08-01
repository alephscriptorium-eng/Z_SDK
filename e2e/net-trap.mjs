/**
 * Trampa de red para el paso 2 del CA local-first (WP-U206).
 *
 * ── EL PREDICADO «SIN RED», ESCRITO (decisión ⑧-bis.1 del custodio) ──────
 *
 *   «Sin red» = CERO conexiones salientes a destino NO-LOOPBACK.
 *
 * NO es «cero sockets»: los servicios bindean loopback al arrancar, y leer
 * el predicado como «cero sockets» haría el paso IMPOSIBLE en vez de
 * FALSABLE. Bindear (`server.listen`) no es salir; conectar sí.
 *
 * Se instrumentan las puertas por las que se sale:
 *   · `net.Socket.prototype.connect` — la puerta de abajo. `http`, `https`,
 *     `tls` y el conector de `undici` acaban todos aquí.
 *   · `dns.lookup` / `dns.promises.lookup` **y toda la familia `resolve*` +
 *     `reverse`**, también sobre `dns.Resolver` y `dns.promises.Resolver`:
 *     resolver un nombre no-loopback ES intención de red, y se caza aunque la
 *     conexión no llegue a abrirse.
 *   · `globalThis.fetch` — se instrumenta aparte para poder nombrar la URL
 *     entera en el hallazgo, no sólo el host.
 *
 * ⚠ LA FORMA DE LOS ARGUMENTOS ES PARTE DEL PREDICADO (corrección U206·D1).
 * La primera versión de esta trampa daba por buena la premisa «todo acaba en
 * `Socket.prototype.connect`» —que es CIERTA— y sacaba de ella una conclusión
 * FALSA: que bastaba leer `args[0].host`. `net.connect()/createConnection()`
 * normaliza sus argumentos y llama a `connect(normalized)` con un **Array**
 * `[options, cb]`. Como `typeof [] === 'object'`, el parche leía `host` de un
 * Array, obtenía `undefined`, lo trataba como «host omitido → localhost» y
 * anotaba la salida como PERMITIDA. Medido contra una IP externa:
 *
 *     new net.Socket().connect({host,port})  → 1 violación   cazado
 *     net.createConnection({host,port})      → 0             EVADÍA
 *     http.request({host: IP})               → 0             EVADÍA
 *     https.request({host: IP})              → 1             cazado
 *     dns.resolve4 / new dns.Resolver()      → 0             EVADÍA
 *
 * O sea que la vía más común de salida —`http` sobre IP literal— pasaba
 * limpia. Ahora se normaliza el Array y se instrumenta la familia `resolve*`.
 * El vector rojo de la puerta `connect` existe y se ejercita en el runner: sin
 * él, un verde de «0 violaciones» no distingue «no salió» de «salió y no lo vi».
 *
 * DESTINO LOOPBACK = `localhost`, `127.0.0.0/8`, `::1`, `0.0.0.0`, `::`, o
 * host omitido (Node resuelve a `localhost`). Un socket IPC (named pipe de
 * Windows o unix socket, `options.path`) no es red y se permite, declarado.
 *
 * La trampa **registra y bloquea**: al violarse el predicado lanza. Bloquear
 * es lo honesto — deja el arranque determinista y offline de verdad — y hace
 * que el fallo sea ruidoso en vez de una salida real a internet dentro de un
 * CA.
 *
 * ⚠ ORDEN OBLIGATORIO: hay que ARMAR ANTES de importar el código bajo prueba.
 * Un módulo que ya hizo `import { lookup } from 'node:dns'` se quedó con la
 * referencia vieja y la trampa no lo vería. Por eso el runner arma primero y
 * hace `await import(...)` después. Ese orden es parte del predicado.
 *
 * `namedModule` de cada hallazgo = primer marco de la pila que no es interno
 * de Node ni de esta trampa: es «el módulo que tocó la red».
 */

import net from 'node:net';
import dns from 'node:dns';

/** @param {string|null|undefined} host */
export function isLoopbackHost(host) {
  if (host == null || host === '') return true; // Node por defecto: localhost
  const h = String(host).trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '::1' || h === '::' || h === '0:0:0:0:0:0:0:1') return true;
  if (h === '0.0.0.0') return true;
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/** Primer marco de pila ajeno a Node interno y a esta trampa. */
function namedModule() {
  const stack = new Error().stack || '';
  for (const line of stack.split('\n').slice(1)) {
    if (!line.includes('(') && !line.includes('file:')) continue;
    if (line.includes('node:internal')) continue;
    if (line.includes('net-trap.mjs')) continue;
    return line.trim();
  }
  return '<desconocido>';
}

/**
 * Arma la trampa. Devuelve el registro de violaciones y el desarmado.
 *
 * @param {{ block?: boolean }} [opts] — `block:false` sólo registra (se usa
 *   para el vector rojo, donde se quiere observar el registro sin que la
 *   excepción se confunda con la del propio vector).
 * @returns {{ violations: object[], disarm: () => void, allowed: object[] }}
 */
export function armNetTrap(opts = {}) {
  const block = opts.block !== false;
  /** @type {object[]} */
  const violations = [];
  /** @type {object[]} */
  const allowed = [];

  const record = (gate, target, extra = {}) => {
    const hit = { gate, target, module: namedModule(), ...extra };
    violations.push(hit);
    if (block) {
      const err = new Error(
        `SIN RED violado — salida a destino no-loopback «${target}» por ${gate} desde ${hit.module}`
      );
      // @ts-ignore — evidencia adjunta
      err.netTrapHit = hit;
      throw err;
    }
    return hit;
  };

  // ── net.Socket.prototype.connect ───────────────────────────────────────
  const originalConnect = net.Socket.prototype.connect;
  /** @this {import('node:net').Socket} */
  net.Socket.prototype.connect = function patchedConnect(...args) {
    let host = null;
    let port = null;
    let ipc = false;
    // `net.connect()`/`createConnection()` llaman con el Array normalizado
    // [options, cb]; el resto llama con la forma cruda. Se desenvuelve PRIMERO,
    // antes de mirar `typeof`, porque `typeof [] === 'object'` y leer `.host`
    // de un Array da `undefined` — que es exactamente cómo se evadía.
    let first = args[0];
    if (Array.isArray(first)) first = first[0];
    if (first && typeof first === 'object') {
      if (first.path) ipc = true;
      host = first.host ?? first.hostname ?? null;
      port = first.port ?? null;
    } else if (typeof first === 'number' || /^\d+$/.test(String(first ?? ''))) {
      port = first;
      host = typeof args[1] === 'string' ? args[1] : null;
    } else if (typeof first === 'string') {
      ipc = true; // connect(path[, cb]) — socket IPC, no es red
    }
    if (ipc) {
      allowed.push({ gate: 'net.Socket.connect', target: 'ipc', port: null });
    } else if (!isLoopbackHost(host)) {
      record('net.Socket.connect', `${host}:${port}`, { host, port });
    } else {
      allowed.push({ gate: 'net.Socket.connect', target: `${host ?? 'localhost'}:${port}` });
    }
    return originalConnect.apply(this, /** @type {any} */ (args));
  };

  // ── dns: lookup + TODA la familia resolve*/reverse, en los cuatro sitios
  // donde vive (módulo, promises, y las dos clases Resolver). `dns.resolve4`
  // y `new dns.Resolver().resolve4` no pasan por `lookup`: evadían enteras.
  const DNS_METHODS = [
    'lookup',
    'resolve',
    'resolve4',
    'resolve6',
    'resolveAny',
    'resolveCname',
    'resolveCaa',
    'resolveMx',
    'resolveNaptr',
    'resolveNs',
    'resolvePtr',
    'resolveSoa',
    'resolveSrv',
    'resolveTxt',
    'reverse'
  ];
  /** @type {{ target: object, key: string, original: Function }[]} */
  const dnsPatches = [];
  /** @param {object} target @param {string} label */
  function patchDnsSurface(target, label) {
    if (!target) return;
    for (const key of DNS_METHODS) {
      const original = target[key];
      if (typeof original !== 'function') continue;
      dnsPatches.push({ target, key, original });
      target[key] = function patchedDns(hostname, ...rest) {
        const gate = `${label}.${key}`;
        if (!isLoopbackHost(hostname)) {
          record(gate, String(hostname), { host: hostname });
        } else {
          allowed.push({ gate, target: String(hostname) });
        }
        return original.call(this === undefined ? target : this, hostname, ...rest);
      };
    }
  }
  patchDnsSurface(dns, 'dns');
  patchDnsSurface(dns.promises, 'dns.promises');
  patchDnsSurface(dns.Resolver?.prototype, 'dns.Resolver');
  patchDnsSurface(dns.promises?.Resolver?.prototype, 'dns.promises.Resolver');

  // ── globalThis.fetch ───────────────────────────────────────────────────
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch === 'function') {
    globalThis.fetch = function patchedFetch(input, init) {
      const raw = typeof input === 'string' ? input : (input?.url ?? String(input));
      /** @type {URL|null} */
      let parsed = null;
      try {
        parsed = new URL(raw);
      } catch {
        parsed = null;
      }
      if (!parsed || !isLoopbackHost(parsed.hostname)) {
        record('fetch', raw, { host: parsed?.hostname ?? null });
      } else {
        allowed.push({ gate: 'fetch', target: raw });
      }
      return originalFetch.call(globalThis, /** @type {any} */ (input), init);
    };
  }

  return {
    violations,
    allowed,
    disarm() {
      net.Socket.prototype.connect = originalConnect;
      for (const { target, key, original } of dnsPatches) target[key] = original;
      if (typeof originalFetch === 'function') globalThis.fetch = originalFetch;
    }
  };
}
