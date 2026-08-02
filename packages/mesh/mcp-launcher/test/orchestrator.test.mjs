/**
 * Orchestrator v1 (U234): profile expansion + dep order + real
 * start→health→stop e2e over the dual-peer fixture (detached spawn,
 * Windows tree-kill, IPv4 re-bind proof).
 *
 * U234-B1: that e2e binds 127.0.0.1 — the family that never failed. The block
 * at the bottom exercises the one that did: `::1` and the `::` wildcard, over
 * fixtures/ipv6-peer.mjs. Each promise the two headers make is backed there by
 * a named assert (CA-1 enumeración · CA-2 status · CA-3 huérfano · CA-4 sonda).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  PROFILES,
  expandProfile,
  planGroups,
  runStart,
  runStop,
  runStatus,
  runHealth,
  listenerPids,
  portFree,
  portReleased,
  killTree,
  enumerationStdout
} from '../src/orchestrator.mjs';
import { resolveCatalog } from '../src/catalog.mjs';
import { reservePort, reservePorts } from './helpers/ports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

// WP-U267: aquí vivían `PORT_A = 19131` / `PORT_B = 19132`, y más abajo el
// bloque 19861-19866 de U234-B1. Todos fijos, todos atados. Ahora cada prueba
// pide los suyos al SO — y los pide EN LA FAMILIA QUE VA A ATAR, que en este
// fichero no siempre es IPv4: hay '::1' y hay el comodín '::'.

function entry(id, port, extra = {}) {
  const host = '127.0.0.1';
  return {
    id,
    name: id,
    port,
    host,
    deps: [],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    url: `http://${host}:${port}/mcp`,
    healthUrl: `http://${host}:${port}/mcp/health`,
    ...extra
  };
}

function fixtureCatalog(portA, portB) {
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(portA), String(portB)],
    cwd: path.dirname(fixture),
    spawnGroup: 'fixture-dual'
  };
  return [
    entry('fixture-uno', portA, spawn),
    entry('fixture-dos', portB, spawn)
  ];
}

test('expandProfile: minimo is a declared catalog subset; unknown rejects', () => {
  const catalog = resolveCatalog();
  const minimo = expandProfile('minimo', catalog);
  assert.deepEqual(
    minimo.map((e) => e.id).sort(),
    ['launcher', 'solar-sun'].sort()
  );
  assert.deepEqual(PROFILES['v1-zeus'], [
    'socket-server',
    'console-monitor',
    'cache-browser',
    'firehose-browser'
  ]);
  assert.throws(() => expandProfile('no-existe', catalog), /Perfil o id desconocido/);
});

test('planGroups: declared deps order groups topologically (stable ties)', () => {
  // catalog listed in reverse dep order on purpose
  const catalog = [
    entry('c', 19343, { spawnGroup: 'c', deps: ['b'] }),
    entry('b', 19342, { spawnGroup: 'b', deps: ['a'] }),
    entry('a', 19341, { spawnGroup: 'a' })
  ];
  const plan = planGroups(expandProfile('c', catalog), catalog);
  assert.deepEqual(plan.map((g) => g.group), ['a', 'b', 'c']);
});

test('planGroups: dep cycle is rejected', () => {
  const catalog = [
    entry('a', 19351, { spawnGroup: 'a', deps: ['b'] }),
    entry('b', 19352, { spawnGroup: 'b', deps: ['a'] })
  ];
  assert.throws(() => planGroups(expandProfile('a', catalog), catalog), /Ciclo de deps/);
});

test('e2e: start → health → status → stop leaves ports re-bindable', async (t) => {
  const [PORT_A, PORT_B] = await reservePorts(2);
  const catalog = fixtureCatalog(PORT_A, PORT_B);
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq-u234-'));
  const profiles = { fixture: ['fixture-uno'] };
  const prevProfiles = { ...PROFILES };
  Object.assign(PROFILES, profiles);
  const opts = { catalog, stateDir, timeoutMs: 15_000, pollMs: 200, log: () => {} };

  t.after(async () => {
    for (const k of Object.keys(PROFILES)) delete PROFILES[k];
    Object.assign(PROFILES, prevProfiles);
    try {
      await runStop('fixture', opts);
    } catch {
      /* already stopped */
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const started = await runStart('fixture', opts);
  assert.equal(started.ok, true, JSON.stringify(started));
  // one spawnGroup serves both catalog ports; health per entry
  assert.equal(started.groups.length, 1);
  assert.equal(started.groups[0].adopted, false);
  assert.deepEqual(started.groups[0].ids.sort(), ['fixture-dos', 'fixture-uno']);
  assert.ok(started.groups[0].health.every((h) => h.ok));
  assert.ok(fs.existsSync(path.join(stateDir, 'state-fixture.json')));

  const health = await runHealth('fixture', opts);
  assert.equal(health.ok, true);
  assert.equal(health.rows.length, 2);

  const status = await runStatus('fixture', opts);
  assert.ok(status.rows.every((r) => r.status === 'running'));
  assert.equal(status.rows[0].managedPid, started.groups[0].pid);

  const stopped = await runStop('fixture', opts);
  assert.equal(stopped.ok, true, JSON.stringify(stopped));
  assert.equal(stopped.residues.length, 0);
  assert.ok(stopped.ports.every((p) => p.free), JSON.stringify(stopped.ports));

  // hard evidence: no listener pids left; ports really re-bindable
  assert.deepEqual(listenerPids(PORT_A), []);
  assert.deepEqual(listenerPids(PORT_B), []);
  assert.equal(await portFree(PORT_A, '127.0.0.1'), true);
  assert.equal(await portFree(PORT_B, '127.0.0.1'), true);
  // state cleared after clean stop
  assert.equal(fs.existsSync(path.join(stateDir, 'state-fixture.json')), false);
});

// ─────────────────────────────────────────────────────────────────────────
// U234-B1 — the IPv6 blind spot.
//
// The e2e above proves the sweep over an IPv4 fixture, which is precisely the
// family that never failed. Everything below binds `::1` (or the `::`
// wildcard) instead, because that is what socket-server, cache-browser and
// firehose-browser actually bind when they resolve host `localhost`.
//
// Entry `host` stays 'localhost', NOT '::1': catalog.mjs builds
// `http://${host}:${port}` with no brackets, so a literal '::1' host yields
// ERR_INVALID_URL. Under Node's default `verbatim` DNS order 'localhost'
// resolves to ::1 first, which is exactly the field shape.
// ─────────────────────────────────────────────────────────────────────────

const ipv6Fixture = path.join(__dirname, '../fixtures/ipv6-peer.mjs');

// WP-U267: el bloque 19861-19866 era fijo. Cada CA de abajo reserva ahora el
// suyo, y lo reserva en su familia: '::1' para lo que ata ipv6-peer, '::' para
// el comodín, '127.0.0.1' para el espejo IPv4. Reservar en la familia
// equivocada dejaría el hueco justo que U234-B1 vino a cerrar.

function v6Entry(id, port) {
  const host = 'localhost';
  return {
    id,
    name: id,
    port,
    host,
    deps: [],
    spawnGroup: id,
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    url: `http://${host}:${port}/mcp`,
    healthUrl: `http://${host}:${port}/mcp/health`
  };
}

/** Start the ::1 fixture OUTSIDE the orchestrator; resolve once health answers. */
async function spawnIpv6Peer(port) {
  const child = spawn(process.execPath, [ipv6Fixture, String(port)], {
    stdio: 'ignore',
    windowsHide: true
  });
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`ipv6-peer murió (exit ${child.exitCode})`);
    try {
      const r = await fetch(`http://localhost:${port}/mcp/health`, {
        signal: AbortSignal.timeout(1000)
      });
      if (r.ok) return child;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`ipv6-peer no respondió health en ${port}`);
}

/**
 * Death proof that does NOT go through the orchestrator's own verdict:
 * a raw TCP connect to [::1]:port.
 */
function connectProbe(port, host) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host });
    s.once('connect', () => {
      s.destroy();
      resolve('CONNECT');
    });
    s.once('error', (e) => resolve(e.code));
    s.setTimeout(3_000, () => {
      s.destroy();
      resolve('TIMEOUT');
    });
  });
}

function listen(port, host) {
  const srv = net.createServer();
  return new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(port, host, () => resolve(srv));
  });
}

test('U234-B1 CA-1: listenerPids enumera un listener atado sólo a ::1', async (t) => {
  const PORT_V6_ENUM = await reservePort('::1');
  const child = await spawnIpv6Peer(PORT_V6_ENUM);
  t.after(async () => {
    await killTree(child.pid);
  });
  // Rojo antes del arreglo: `netstat -ano -p tcp` es familia IPv4 en Windows,
  // así que esto devolvía [] con el proceso vivo y sano.
  assert.deepEqual(listenerPids(PORT_V6_ENUM), [child.pid]);
});

test('U234-B1 CA-2: status no miente sobre un listener ::1 (healthy Y listening)', async (t) => {
  const PORT_V6_STATUS = await reservePort('::1');
  const catalog = [v6Entry('fixture-v6-status', PORT_V6_STATUS)];
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq-u234b1-st-'));
  const child = await spawnIpv6Peer(PORT_V6_STATUS);
  t.after(async () => {
    await killTree(child.pid);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const status = await runStatus('fixture-v6-status', { catalog, stateDir });
  const row = status.rows.find((r) => r.id === 'fixture-v6-status');
  assert.ok(row, JSON.stringify(status));
  // La cabecera enumera las claves de la fila; que las enumere BIEN.
  assert.deepEqual(
    Object.keys(row).sort(),
    ['group', 'healthy', 'id', 'listening', 'managedPid', 'pids', 'port', 'status', 'url'],
    'la fila de status ya no casa con las nueve claves que promete la cabecera'
  );
  // Esta mitad ya pasaba: el health viaja por localhost → ::1.
  assert.equal(row.healthy, true, JSON.stringify(row));
  // Estas dos son el vector rojo: antes salían false / [] con el proceso vivo.
  assert.equal(row.listening, true, JSON.stringify(row));
  assert.deepEqual(row.pids, [child.pid], JSON.stringify(row));
});

test('U234-B1 CA-3: stop mata un ::1 que el orquestador NO arrancó (sin pid en estado)', async (t) => {
  const PORT_V6_ORPHAN = await reservePort('::1');
  const catalog = [v6Entry('fixture-v6-orphan', PORT_V6_ORPHAN)];
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq-u234b1-or-'));
  const child = await spawnIpv6Peer(PORT_V6_ORPHAN);
  let exited = false;
  child.once('exit', () => {
    exited = true;
  });
  t.after(async () => {
    await killTree(child.pid);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  // La ruta del huérfano: sin state-*.json no hay `rec.pid` que matar
  // (runStart sólo persiste lo que él spawneó), así que `stop` depende
  // EXCLUSIVAMENTE de la enumeración de listeners.
  assert.equal(
    fs.existsSync(path.join(stateDir, 'state-fixture-v6-orphan.json')),
    false,
    'el estado debe estar vacío: si stop tuviera el pid, la CA no discriminaría nada'
  );

  const stopped = await runStop('fixture-v6-orphan', { catalog, stateDir, log: () => {} });
  assert.equal(stopped.exitCode, 0, JSON.stringify(stopped));
  assert.deepEqual(stopped.residues, [], JSON.stringify(stopped));
  assert.ok(
    stopped.killed.some((k) => k.pid === child.pid && k.ok),
    JSON.stringify(stopped.killed)
  );

  // Prueba de muerte independiente del veredicto del orquestador.
  assert.equal(await connectProbe(PORT_V6_ORPHAN, '::1'), 'ECONNREFUSED');
  for (let i = 0; i < 30 && !exited; i++) await new Promise((r) => setTimeout(r, 100));
  assert.equal(exited, true, 'el proceso hijo sigue vivo tras stop');
});

test('U234-B1 CA-4: la sonda de ocupación ve lo que un bind de un solo host no ve', async (t) => {
  // (a) comodín '::' — la forma que ata TODO MCP de presets-sdk
  //     (create-app.mjs → stateless-route.mjs `app.listen(port)`, sin host).
  const PORT_WILDCARD = await reservePort('::');
  const wild = await listen(PORT_WILDCARD, '::');
  t.after(() => new Promise((r) => wild.close(r)));

  // (b) espejo, y es el que muerde hoy: ocupante IPv4 llano con el host real
  //     del catálogo ('localhost' → ::1 primero), o sea la sonda de :509.
  //     Se reserva DESPUÉS de atar el comodín, a propósito: el comodín es
  //     dual-stack, así que si pidiéramos los dos números antes de atar ninguno
  //     el SO podría darnos el mismo dos veces y este bind moriría EADDRINUSE.
  const PORT_V4_PLAIN = await reservePort('127.0.0.1');
  const plain = await listen(PORT_V4_PLAIN, '127.0.0.1');
  t.after(() => new Promise((r) => plain.close(r)));

  // Lo que la sonda sola mide — documentado, no deseado. Estos cuatro pasaban
  // ya antes del arreglo: son la MEDIDA del agujero, no el vector.
  assert.equal(await portFree(PORT_WILDCARD, 'localhost'), true);
  assert.equal(await portFree(PORT_WILDCARD, '127.0.0.1'), true);
  assert.equal(await portFree(PORT_V4_PLAIN, 'localhost'), true);
  assert.equal(await portFree(PORT_V4_PLAIN, '::1'), true);

  // El vector: el oráculo del orquestador debe declarar OCUPADOS ambos puertos
  // con el mismo host que usa runStop. Antes del arreglo no había oráculo: el
  // veredicto era portFree a secas, y decía «libre» en los cuatro casos.
  assert.equal(await portReleased(PORT_WILDCARD, 'localhost'), false);
  assert.equal(await portReleased(PORT_V4_PLAIN, 'localhost'), false);

  // Y no es un «siempre falso»: un puerto de verdad libre sigue saliendo libre.
  // WP-U267: antes era `PORT_WILDCARD + 100`, o sea «supongo que 19964 está
  // libre». Ahora se pide uno al SO con los dos ocupantes ya atados, así que
  // está libre por construcción y no por fe.
  const PORT_LIBRE = await reservePort('::');
  assert.equal(await portReleased(PORT_LIBRE, 'localhost'), true);
});

test('U234-B1 CA-5: la guardia puerto_ocupado_sin_health despierta ante un ocupante ::1', async (t) => {
  // Efecto colateral declarado en la cabecera, aquí con aserto: antes del
  // arreglo `occupied` salía vacío (listenerPids ciego) y start spawneaba
  // encima de un puerto ya tomado.
  const PORT_V6_GUARD = await reservePort('::1');
  const host = 'localhost';
  const catalog = [
    {
      id: 'fixture-v6-guard',
      name: 'fixture-v6-guard',
      port: PORT_V6_GUARD,
      host,
      deps: [],
      spawnGroup: 'fixture-v6-guard',
      healthPath: '/no-existe',
      mcpPath: '/mcp',
      url: `http://${host}:${PORT_V6_GUARD}/mcp`,
      // health que NO responde ok: el ocupante está enfermo, no adoptable
      healthUrl: `http://${host}:${PORT_V6_GUARD}/no-existe`,
      spawnCommand: process.execPath,
      spawnArgs: [ipv6Fixture, String(PORT_V6_GUARD)],
      cwd: path.dirname(ipv6Fixture)
    }
  ];
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq-u234b1-gd-'));
  const child = await spawnIpv6Peer(PORT_V6_GUARD);
  t.after(async () => {
    await killTree(child.pid);
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const started = await runStart('fixture-v6-guard', {
    catalog,
    stateDir,
    timeoutMs: 3_000,
    pollMs: 200,
    log: () => {}
  });
  assert.equal(started.ok, false, JSON.stringify(started));
  assert.equal(started.error, 'puerto_ocupado_sin_health', JSON.stringify(started));
  assert.deepEqual(started.occupied, [
    { id: 'fixture-v6-guard', port: PORT_V6_GUARD, pids: [child.pid] }
  ]);
  // no spawneó nada encima: sin estado escrito
  assert.equal(fs.existsSync(path.join(stateDir, 'state-fixture-v6-guard.json')), false);
});

test('U234-B1 CA-9 (invariante con guardia): un solo punto de enumeración', () => {
  // El invariante «un solo netstat» era cierto pero NO tenía guardia: se
  // afirmaba en prosa y nada se ponía rojo al añadir un segundo punto. Esto
  // es la guardia: si mañana alguien enumera puertos desde otro sitio, el
  // arreglo de familia de U234-B1 deja de alcanzarlo y este test cae.
  //
  // ✎ ALCANCE HONESTO (medido por el orquestador al aceptar, 2026-08-01, no
  // deducido): esta guardia caza el enumerador que nombra el binario con un
  // LITERAL —que es la forma en que llega una regresión real— y NO caza el
  // que lo construye: un `spawnSync(['net','stat'].join(''), …)` la deja
  // verde. Comprobado plantando ambos y aplicando las seis aserciones.
  // Es la misma ceguera que ya nos costó un probe en este repo (una ruta que
  // viajaba en una variable), así que queda escrita en vez de suponerse
  // cerrada. Modelo de amenaza declarado: defiende contra la REGRESIÓN en
  // `src/`, no contra un contribuyente hostil —quien edita `src/` edita este
  // test—. Cerrarlo del todo exige analizar por AST, no por texto.
  const src = fs.readFileSync(path.join(__dirname, '../src/orchestrator.mjs'), 'utf8');

  const count = (re) => (src.match(re) || []).length;

  // 1 · exactamente una invocación por herramienta, y ninguna que se salte la
  //     primitiva llamando a spawnSync a pelo.
  assert.equal(
    count(/enumerationStdout\(\s*['"`]netstat['"`]/g),
    1,
    'más de una invocación de netstat: la ceguera de familia puede volver por la vía nueva'
  );
  assert.equal(count(/enumerationStdout\(\s*['"`]lsof['"`]/g), 1, 'más de una invocación de lsof');
  assert.equal(
    count(/spawnSync\(\s*['"`](?:netstat|lsof|ss|netstat\.exe)['"`]/g),
    0,
    'alguien enumera con spawnSync directo y se salta el guard de «no pude mirar»'
  );

  // 2 · toda la enumeración entra por enumerationStdout, y sólo desde
  //     listenerPids: eso es lo que hace que start, stop, status y rollback
  //     hereden cualquier arreglo gratis.
  const bodyOf = (decl) => {
    const start = src.indexOf(decl);
    assert.ok(start > 0, `no encuentro «${decl}»`);
    const rest = src.slice(start + 1);
    const next = rest.search(/\n(?:export |function |const |async function )/);
    return next === -1 ? rest : rest.slice(0, next);
  };
  const listenerBody = bodyOf('export function listenerPids(');
  assert.equal(
    (listenerBody.match(/enumerationStdout\(/g) || []).length,
    2,
    'listenerPids ya no contiene las dos ramas de enumeración'
  );
  assert.equal(
    count(/enumerationStdout\(/g) - 1, // −1: la propia declaración
    2,
    'enumerationStdout se llama desde algún sitio que no es listenerPids'
  );

  // 3 · y la primitiva sigue teniendo un único spawnSync dentro.
  assert.equal(
    (bodyOf('export function enumerationStdout(').match(/spawnSync\(/g) || []).length,
    1
  );
});

test('U234-B1 CA-10: «no pude mirar» no sale por la puerta de «no hay listeners»', () => {
  // Antes, un `lsof` ausente (Alpine, Debian slim, casi cualquier contenedor)
  // daba ENOENT, `r.stdout` null y listenerPids devolvía [] sin señal alguna:
  // el oráculo degradaba en silencio al experimento B de la matriz de
  // falsación, el que este WP demostró insuficiente.
  assert.throws(
    () =>
      enumerationStdout('zeus-binario-que-no-existe', ['-ano'], {
        windowsHide: true,
        encoding: 'utf8'
      }),
    (err) => {
      assert.equal(err.code, 'ENUM_NO_DISPONIBLE');
      assert.match(err.message, /no se pudo ejecutar/);
      assert.equal(err.tool, 'zeus-binario-que-no-existe');
      return true;
    }
  );

  // Y NO confunde «salida vacía» con «fallo»: un binario que existe y no
  // encuentra nada devuelve string, no excepción. (`lsof` sale con 1 cuando no
  // hay socket: ese es el caso legítimo de lista vacía.)
  const out = enumerationStdout('netstat', ['-ano'], { windowsHide: true, encoding: 'utf8' });
  assert.equal(typeof out, 'string');
  assert.ok(out.length > 0);
});

