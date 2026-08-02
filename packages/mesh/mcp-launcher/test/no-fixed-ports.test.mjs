/**
 * WP-U267 — guardia contra la reincidencia del intermitente de puertos fijos.
 *
 * El intermitente de esta suite no se arregló porque la lógica fuera frágil:
 * se arregló porque los puertos dejaron de estar escritos a mano. Eso lo puede
 * deshacer cualquiera en una línea, y sin guardia el coste lo paga alguien en
 * CI a las tres de la mañana, no quien lo escribió. Esto es la guardia.
 *
 * ✎ ALCANCE HONESTO (declarado, no supuesto — mismo criterio que la CA-9 de
 * orchestrator.test.mjs): esto analiza TEXTO, no AST. Caza la forma en que
 * llega una regresión de verdad —un literal numérico escrito en el sitio donde
 * el puerto viaja al proceso hijo o al bind— y NO caza a quien lo construya
 * indirecto (`String(19000 + 121)`, un puerto que llegue en una variable desde
 * otro módulo, un `.env`). Modelo de amenaza: defiende contra la REGRESIÓN
 * distraída, no contra un contribuyente hostil; quien edita estos tests edita
 * también este fichero. Cerrarlo del todo exige AST, y el precio no compensa.
 *
 * Verificado enrojeciendo: cada aserción de abajo se comprobó plantando su
 * regresión concreta y viendo caer ESTE test y sólo la aserción que le toca.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reservePort, reservePorts } from './helpers/ports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SELF = path.basename(fileURLToPath(import.meta.url));

/** Ficheros vigilados: los tests del paquete (menos éste) y sus fixtures. */
function watched() {
  const testDir = __dirname;
  const fixturesDir = path.join(__dirname, '../fixtures');
  const out = [];
  for (const f of fs.readdirSync(testDir)) {
    if (f.endsWith('.mjs') && f !== SELF) out.push(path.join(testDir, f));
  }
  const helpers = path.join(testDir, 'helpers');
  if (fs.existsSync(helpers)) {
    for (const f of fs.readdirSync(helpers)) {
      if (f.endsWith('.mjs')) out.push(path.join(helpers, f));
    }
  }
  if (fs.existsSync(fixturesDir)) {
    for (const f of fs.readdirSync(fixturesDir)) {
      if (f.endsWith('.mjs')) out.push(path.join(fixturesDir, f));
    }
  }
  return out;
}

/** Texto del fichero sin comentarios: las cicatrices documentadas citan los
 *  puertos viejos a propósito, y no deben disparar la guardia. */
function code(file) {
  return fs
    .readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('U267 CA-1: ningún puerto literal viaja a una fixture spawneada', () => {
  const offenders = [];
  for (const file of watched()) {
    const src = code(file);
    // `spawnArgs: [fixture, String(19121), …]` — la vía por la que el puerto
    // llegaba al hijo. Un literal aquí ES el intermitente.
    for (const m of src.matchAll(/spawnArgs\s*:\s*\[[^\]]*?\b(\d{4,5})\b[^\]]*?\]/g)) {
      offenders.push(`${path.basename(file)} → spawnArgs con literal ${m[1]}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `puerto fijo de vuelta en spawnArgs: usa reservePorts() de test/helpers/ports.mjs\n${offenders.join('\n')}`
  );
});

test('U267 CA-1: ninguna fixture tiene puerto por defecto', () => {
  const offenders = [];
  const fixturesDir = path.join(__dirname, '../fixtures');
  for (const f of fs.readdirSync(fixturesDir).filter((x) => x.endsWith('.mjs'))) {
    const src = code(path.join(fixturesDir, f));
    // `Number(process.argv[2] || 19111)` — el default fijo que se ata solo
    // cuando alguien invoca la fixture a mano.
    for (const m of src.matchAll(/process\.argv\[\d+\]\s*(?:\|\||\?\?)\s*(\d{4,5})/g)) {
      offenders.push(`${f} → default fijo ${m[1]}`);
    }
    // y ningún listen(<literal>) directo
    for (const m of src.matchAll(/\.listen\(\s*(\d{4,5})\b/g)) {
      offenders.push(`${f} → listen(${m[1]}) literal`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `fixture con puerto fijo: el puerto lo reserva quien spawnea\n${offenders.join('\n')}`
  );
});

test('U267 CA-1: ningún servidor en proceso se ata a un puerto literal', () => {
  const offenders = [];
  for (const file of watched()) {
    const src = code(file);
    // `createServer({ port: 13050 })` / `bundle.start()` sobre literal.
    for (const m of src.matchAll(/createServer\(\s*\{[^}]*?\bport\s*:\s*(\d{4,5})\b/g)) {
      offenders.push(`${path.basename(file)} → createServer({ port: ${m[1]} })`);
    }
    // `listen(19121, …)` a pelo en un test.
    for (const m of src.matchAll(/\.listen\(\s*(\d{4,5})\b/g)) {
      offenders.push(`${path.basename(file)} → listen(${m[1]})`);
    }
    // `connectMcp(13051)` — el cliente que asume el puerto del servidor.
    for (const m of src.matchAll(/connectMcp\(\s*(\d{4,5})\b/g)) {
      offenders.push(`${path.basename(file)} → connectMcp(${m[1]})`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `bind a puerto literal: usa port 0 y lee handle.port\n${offenders.join('\n')}`
  );
});

/**
 * «Arranca de verdad» = levanta un proceso cuyo puerto elige este test.
 * Las tres señales son deliberadamente estrechas para no pillar a quien sólo
 * mira el catálogo: `catalog.test.mjs` hace `() => manager.launch('no-existe')`
 * dentro de un `assert.rejects` (nunca spawnea) y `launcher-server.test.mjs`
 * construye un ProcessManager que jamás lanza. Ninguno de los dos entra aquí,
 * y así debe ser: exigirles reservar puertos sería ruido, no guardia.
 */
function arrancaProcesos(src) {
  return (
    /spawnCommand\s*:\s*process\.execPath/.test(src) ||
    /runStart\(/.test(src) ||
    /await\s+manager\.launch\(/.test(src)
  );
}

test('U267 CA-1: todo test que arranca algo importa el reservador', () => {
  const offenders = [];
  for (const file of watched()) {
    if (!file.endsWith('.test.mjs')) continue;
    const src = code(file);
    if (!arrancaProcesos(src)) continue;
    if (!/from\s+'\.\/helpers\/ports\.mjs'/.test(src)) {
      offenders.push(`${path.basename(file)} arranca procesos y no reserva puertos`);
    }
  }
  assert.deepEqual(offenders, [], offenders.join('\n'));
});

test('U267 CA-1: ninguna constante con nombre de puerto guarda un literal', () => {
  // Ésta es la forma EXACTA en que estaban escritos los seis ficheros: no un
  // `listen(19121)` visible, sino `const PORT_A = 19121` / `const TEST_PORTS =
  // { espana: 14121, wp: 14122 }` a cien líneas del bind. Sólo se exige en los
  // ficheros que arrancan procesos; los que sólo afirman sobre la tabla de
  // puertos del catálogo (catalog.test.mjs) siguen pudiendo nombrar números.
  const offenders = [];
  for (const file of watched()) {
    if (!file.endsWith('.test.mjs')) continue;
    const src = code(file);
    if (!arrancaProcesos(src)) continue;
    const re = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*(?:PORT|Port|PORTS|Ports)[\w$]*)\s*=\s*[^;]*?\b(\d{4,5})\b/g;
    for (const m of src.matchAll(re)) {
      offenders.push(`${path.basename(file)} → ${m[1]} = … ${m[2]}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `constante de puerto con literal: pídeselo al SO con reservePorts()\n${offenders.join('\n')}`
  );
});

test('U267: el reservador entrega puertos distintos, en rango y libres', async () => {
  const ports = await reservePorts(4);
  assert.equal(ports.length, 4);
  assert.equal(new Set(ports).size, 4, `puertos repetidos: ${ports.join(',')}`);
  for (const p of ports) {
    assert.ok(Number.isInteger(p) && p > 1024 && p <= 65535, `fuera de rango: ${p}`);
  }
  // y de verdad están libres: se pueden atar ahora mismo
  const srv = net.createServer();
  await new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(ports[0], '127.0.0.1', resolve);
  });
  await new Promise((r) => srv.close(r));

  // familia IPv6 también, que es la que U234-B1 dejó por escrito
  const v6 = await reservePort('::1');
  assert.ok(Number.isInteger(v6) && v6 > 1024, `::1 sin puerto: ${v6}`);
});
