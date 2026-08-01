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
 * Se instrumentan las tres puertas por las que se sale:
 *   · `net.Socket.prototype.connect` — la puerta de abajo. `http`, `https`,
 *     `tls` y el conector de `undici` acaban todos aquí (`net.createConnection`
 *     construye un `Socket` y llama a este mismo método; `TLSSocket` hereda de
 *     `net.Socket` y no lo sobreescribe).
 *   · `dns.lookup` y `dns.promises.lookup` — resolver un nombre no-loopback
 *     ES intención de red, y se caza aunque la conexión no llegue a abrirse.
 *   · `globalThis.fetch` — se instrumenta aparte para poder nombrar la URL
 *     entera en el hallazgo, no sólo el host.
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
    const first = args[0];
    if (first && typeof first === 'object') {
      if (first.path) ipc = true;
      host = first.host ?? null;
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

  // ── dns.lookup / dns.promises.lookup ───────────────────────────────────
  const originalLookup = dns.lookup;
  // @ts-ignore — firma variádica
  dns.lookup = function patchedLookup(hostname, ...rest) {
    if (!isLoopbackHost(hostname)) {
      record('dns.lookup', String(hostname), { host: hostname });
    } else {
      allowed.push({ gate: 'dns.lookup', target: String(hostname) });
    }
    return originalLookup.call(dns, hostname, ...rest);
  };
  const originalPromisesLookup = dns.promises.lookup;
  // @ts-ignore — firma variádica
  dns.promises.lookup = function patchedPromisesLookup(hostname, ...rest) {
    if (!isLoopbackHost(hostname)) {
      record('dns.promises.lookup', String(hostname), { host: hostname });
    } else {
      allowed.push({ gate: 'dns.promises.lookup', target: String(hostname) });
    }
    return originalPromisesLookup.call(dns.promises, hostname, ...rest);
  };

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
      dns.lookup = originalLookup;
      dns.promises.lookup = originalPromisesLookup;
      if (typeof originalFetch === 'function') globalThis.fetch = originalFetch;
    }
  };
}
