/**
 * WP-U233 — autoprueba del gate matriz 51/51.
 * CA: verde en el árbol real (51 filas derivadas, contraste coincide,
 * 10 declaradas-sin-pieza visibles); rojo reproducible con:
 *   (a) pieza fantasma 52 añadida temporalmente → exit ≠ 0,
 *   (b) pieza ocultada (manifest renombrado) → exit ≠ 0,
 *   (c) celda sin evidencia ni ⏳ → falla, no advierte,
 *   (c-bis/D3) valor vacío con evidencia → falla salvo ⏳,
 *   (d) entrada de catálogo sin pieza NI marca explícita → falla.
 * Vectores permanentes de contrarrevisión (D1/D2): comillas dobles no
 * invisibilizan (V1), workspace en dobles no se degrada a null (V2),
 * comentario no satisface la marca (V4), workspace no parseable y bloque
 * spread → parse ruidoso, duplicado en la MATRIZ de contraste → fallo.
 *
 * WP-U252 — las probes (a) y (b) YA NO mutan el árbol de trabajo. Mutaban el
 * repo real dentro de try/finally: plantaban una pieza fantasma bajo
 * `packages/mesh/` y **renombraban fuera de sitio** el manifiesto rastreado
 * `packages/mesh/blob-sync-harness/package.json`. `node --test` corre los
 * ficheros de test EN PARALELO, así que durante ~1 s ese manifiesto estaba
 * ausente del disco y cualquier otra suite que lo mirase medía una carrera, no
 * un hecho (`test/gates/gates.test.mjs:34` lo veía ausente y fallaba).
 * Ahora ambas probes se montan sobre un árbol temporal materializado desde el
 * índice de git y el estado commiteado — que además es lo que viaja a una
 * instalación. Precedente: `test/gates/licencia.test.mjs:106-138`.
 * Guardián permanente: `test/gates/arbol-inmutable.test.mjs`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  conjuntoDeLectura,
  PATHSPECS_LECTURA,
  DIRS_IGNORADOS
} from './conjunto-lectura.mjs';
import {
  CELDAS_RANCIAS,
  CADUCAS,
  SIN_ANOTAR,
  ORIGEN as ORIGEN_U265
} from './fixtures/matriz-51-catalogo-u265.mjs';
import {
  REPO_ROOT,
  EXPECTED_TOTAL,
  CONTRASTE_PATH,
  KIND_DEFAULT,
  HEALTH_PATH_DEFAULT,
  runMatriz51,
  buildJson,
  validarCeldas,
  parseSeedEntries,
  parseCatalogo,
  parseContraste,
  compararCatalogo,
  compararContrasteCatalogo,
  compararCeldasConKind,
  clasificarClaimCatalogo,
  healthDe
} from '../../scripts/gates/matriz-51.mjs';

const GATE = path.join(REPO_ROOT, 'scripts', 'gates', 'matriz-51.mjs');

/**
 * `sha256` de los DATOS del vector U265 (`JSON.stringify(CELDAS_RANCIAS)`), no
 * del fichero: así la prosa del fixture puede corregirse sin tocar esto, y las
 * 16 celdas literales de `0a441d1` no pueden moverse en silencio.
 */
const HUELLA_VECTOR_U265 = 'c2123825347292ee9f3995354ac7b4c6d14eb9bab4f671615520837b07f068f1';

/** @param {string[]} [args] */
function runCli(args = []) {
  return spawnSync(process.execPath, [GATE, ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 120_000
  });
}

// ---------------------------------------------------------------------------
// Árbol commiteado desechable — el arnés de las fail-probes (WP-U252)
// ---------------------------------------------------------------------------

/**
 * Materializa un árbol temporal con el conjunto EXACTO de rutas que
 * `runMatriz51` lee, enumeradas desde el índice de git y volcadas desde el
 * estado commiteado con un solo `git cat-file --batch`.
 *
 * Tres clases de ruta, todas derivadas —ninguna transcrita a mano:
 *   1. todo `package.json` rastreado (el denominador y el walk anidado);
 *   2. los `src/server.mjs`, `src/mcp-server.mjs` y `src/start.mjs` rastreados
 *      de cada pieza (`mcpFileSignal`, matriz-51.mjs:428-436, decide con ellos
 *      si el tipo de una pieza es MCP);
 *   3. LECTURAS_FIJAS.
 * Las tres salen de `conjuntoDeLectura` (`./conjunto-lectura.mjs`), que es la
 * MISMA fuente que censa el guardián dinámico: dos definiciones del conjunto de
 * lectura es una de más, y la de más fue justo la que se quedó a un cuarto.
 * Más el esqueleto de directorios de nivel 1 bajo cada glob de `workspaces`:
 * un directorio rastreado SIN package.json (hoy `examples/external-consumer` y
 * `examples/ts-registry-consumer`) es un «excluido con motivo» del gate, y sin
 * el esqueleto se volvería invisible.
 *
 * Equivalencia medida, no supuesta: con estas cuatro clases el JSON de
 * `buildJson(runMatriz51(...))` sobre el árbol materializado es byte-idéntico
 * al del árbol vivo — lo aseveran los dos CA verdes de más abajo, uno por
 * árbol, que sólo pueden coincidir si la materialización está completa.
 *
 * @returns {string} raíz temporal (responsabilidad del llamante borrarla)
 */
function materializarCommiteado() {
  const { rutas, bases, rastreados } = conjuntoDeLectura(REPO_ROOT);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u252-matriz51-head-'));
  for (const p of rastreados) {
    for (const base of bases) {
      if (!p.startsWith(`${base}/`)) continue;
      const seg = p.slice(base.length + 1).split('/')[0];
      if (seg) fs.mkdirSync(path.join(dir, base, seg), { recursive: true });
    }
  }

  const blobs = execFileSync('git', ['cat-file', '--batch'], {
    cwd: REPO_ROOT,
    input: `${rutas.map((p) => `HEAD:${p}`).join('\n')}\n`,
    maxBuffer: 256 * 1024 * 1024
  });
  let off = 0;
  for (const rel of rutas) {
    const nl = blobs.indexOf(0x0a, off);
    const cabecera = blobs.subarray(off, nl).toString('utf8');
    // fail-closed: una ruta del índice que HEAD no resuelve (p. ej. `git add`
    // sin commit) para el arnés en seco, no lo degrada en silencio.
    assert.ok(!/ (missing|ambiguous)$/.test(cabecera), `git no resuelve HEAD:${rel} (${cabecera})`);
    const size = Number(cabecera.split(' ')[2]);
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, blobs.subarray(nl + 1, nl + 1 + size));
    off = nl + 1 + size + 1;
  }
  return dir;
}

/**
 * Ejecuta el cuerpo sobre un árbol commiteado RECIÉN materializado y lo borra.
 * Cada probe recibe el suyo: no hay estado compartido que revertir, así que la
 * corrección de la probe no depende de que su `finally` acierte.
 * @param {(root: string) => void} fn
 */
function conArbolCommiteado(fn) {
  const root = materializarCommiteado();
  try {
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** CLI del gate COPIADO dentro del árbol temporal — scanea `root`, no el repo.
 * @param {string} root @param {string[]} [args] */
function runCliEn(root, args = []) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'gates', 'matriz-51.mjs'), ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000
  });
}

test('CA verde: 51 filas derivadas, contraste coincide, exit 0', { timeout: 120_000 }, () => {
  const result = runMatriz51({ repoRoot: REPO_ROOT });
  assert.equal(result.ok, true, JSON.stringify(result.fallos, null, 2));
  assert.equal(result.filas.length, EXPECTED_TOTAL);
  assert.equal(result.contraste.coincide, true);

  const cli = runCli();
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.match(cli.stdout, /matriz-51: OK/);
});

test('CA verde: JSON estable consumible (--json)', { timeout: 120_000 }, () => {
  const cli = runCli(['--json']);
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  const json = JSON.parse(cli.stdout);
  assert.equal(json.gate, 'matriz-51');
  assert.equal(json.version, 1);
  assert.equal(json.ok, true);
  assert.equal(json.piezas.length, EXPECTED_TOTAL);
  for (const fila of json.piezas) {
    for (const nombre of ['tipo', 'capacidad', 'canal', 'consumidor', 'start', 'health']) {
      const celda = fila.celdas[nombre];
      assert.ok(celda, `${fila.pieza}: celda ${nombre} ausente`);
      assert.ok(
        (celda.evidencia && celda.evidencia.trim() !== '') ||
          String(celda.valor).includes('⏳'),
        `${fila.pieza}: celda ${nombre} sin evidencia ni ⏳`
      );
    }
  }
});

test('cero invisibles: las 10 entradas declaradas-sin-pieza listadas con estado', { timeout: 120_000 }, () => {
  const result = runMatriz51({ repoRoot: REPO_ROOT });
  const ids = result.declaradasSinPieza.map((d) => d.id).sort();
  assert.deepEqual(ids, [
    'aaia-backend',
    'aaia-mcp-server',
    'arg-player-dos',
    'arg-player-uno',
    'pozo-player',
    'prolog-backend',
    'prolog-mcp',
    'prolog-ui',
    'solve-player',
    'state-machine-server'
  ]);
  for (const d of result.declaradasSinPieza) {
    assert.match(d.estado, /⏳/);
    assert.ok(d.fuente, `${d.id} sin fuente`);
  }
});

test('CA verde: el árbol COMMITEADO también da 51/51 — control de las probes', { timeout: 120_000 }, () => {
  conArbolCommiteado((root) => {
    const result = runMatriz51({ repoRoot: root });
    assert.equal(result.ok, true, JSON.stringify(result.fallos, null, 2));
    assert.equal(result.filas.length, EXPECTED_TOTAL);
    assert.equal(result.contraste.coincide, true);
    // Sin este verde las probes (a)/(b) no probarían nada: un rojo podría
    // venir de una materialización incompleta y no de la mutación sintética.
    const cli = runCliEn(root);
    assert.equal(cli.status, 0, cli.stdout + cli.stderr);
    assert.match(cli.stdout, /matriz-51: OK/);
  });
});

/**
 * Rutas del conjunto de lectura del gate que difieren entre disco e índice
 * (modificadas, en conflicto o SIN RASTREAR). Es exactamente lo que el árbol
 * commiteado no puede ver: la medida del estrechamiento, no una estimación.
 * @returns {string[]}
 */
function lecturasDivergentes() {
  const porGit = execFileSync(
    'git',
    ['status', '--porcelain', '-z', '--untracked-files=all', '--', ...PATHSPECS_LECTURA],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
    .split('\0')
    .filter(Boolean)
    .filter((e) => e.length > 3);

  // Los pathspecs de arriba sólo ven FICHEROS del conjunto de lectura. Pero el
  // gate hace `readdir` de las bases de `workspaces`, así que un directorio sin
  // rastrear y SIN manifiesto —un borrador cualquiera bajo `examples/`— cambia
  // la lista de «excluidos con motivo» del árbol vivo y no la del commiteado.
  // Sin esta segunda mitad el test no se omitía: caía en rojo acusando a la
  // materialización de quedarse corta, que es exactamente la confusión que este
  // detector existe para evitar, sólo que al revés — culpando al arnés del
  // borrador del desarrollador y mandando a depurar al sitio equivocado.
  const { rastreados, bases } = conjuntoDeLectura(REPO_ROOT);
  const divergencias = [...porGit];
  for (const base of bases) {
    const enIndice = new Set(
      rastreados
        .filter((p) => p.startsWith(`${base}/`))
        .map((p) => p.slice(base.length + 1).split('/')[0])
        .filter(Boolean)
    );
    let enDisco = [];
    try {
      enDisco = fs
        .readdirSync(path.join(REPO_ROOT, base), { withFileTypes: true })
        .filter((e) => e.isDirectory() && !DIRS_IGNORADOS.has(e.name))
        .map((e) => e.name);
    } catch {
      divergencias.push(`?? ${base}/ (base de workspaces ausente del disco)`);
      continue;
    }
    for (const nombre of enDisco) {
      if (!enIndice.has(nombre)) {
        divergencias.push(`?? ${base}/${nombre}/ (directorio sin rastrear bajo un glob de workspaces)`);
      }
    }
  }
  return divergencias;
}

test('equivalencia árbol vivo ↔ árbol commiteado: mismo JSON, byte a byte', { timeout: 120_000 }, (t) => {
  // Qué se pierde al aseverar contra el índice: SOLO lo que el índice no ve.
  // Con el conjunto de lectura limpio, ambos árboles son indistinguibles para
  // el gate — y este test lo aparea byte a byte en vez de suponerlo. Con
  // trabajo sin commitear encima, la divergencia es del desarrollador, no de
  // la materialización: se nombra y no se finge que se ha medido.
  const sucias = lecturasDivergentes();
  if (sucias.length > 0) {
    t.skip(
      `conjunto de lectura del gate con cambios sin commitear (${sucias.length}): ` +
        `${sucias.join(' · ')} — el árbol commiteado no los ve, por definición`
    );
    return;
  }
  conArbolCommiteado((root) => {
    assert.equal(
      JSON.stringify(buildJson(runMatriz51({ repoRoot: root })), null, 2),
      JSON.stringify(buildJson(runMatriz51({ repoRoot: REPO_ROOT })), null, 2),
      'la materialización desde el índice se quedó corta'
    );
  });
});

test('fail-probe (a): pieza fantasma 52 → exit ≠ 0 (sin tocar el repo)', { timeout: 120_000 }, () => {
  conArbolCommiteado((root) => {
    const fantasmaDir = path.join(root, 'packages', 'mesh', 'zz-pieza-fantasma-u233');
    fs.mkdirSync(fantasmaDir, { recursive: true });
    fs.writeFileSync(
      path.join(fantasmaDir, 'package.json'),
      JSON.stringify(
        {
          name: '@zeus/zz-pieza-fantasma-u233',
          version: '0.0.0',
          private: true,
          description: 'pieza fantasma sintética de la fail-probe U233'
        },
        null,
        2
      )
    );
    const result = runMatriz51({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.ok(
      result.fallos.some((f) => f.codigo === 'denominador-total'),
      JSON.stringify(result.fallos)
    );
    assert.ok(
      result.fallos.some(
        (f) => f.codigo === 'contraste-solo-arbol' && f.detalle.includes('@zeus/zz-pieza-fantasma-u233')
      ),
      JSON.stringify(result.fallos)
    );
    const cli = runCliEn(root);
    assert.notEqual(cli.status, 0, 'el CLI debe salir ≠ 0 con la pieza fantasma presente');
    assert.match(cli.stdout, /matriz-51: FAIL/);
  });
});

test('fail-probe (b): pieza ocultada → exit ≠ 0 (sin tocar el repo)', { timeout: 120_000 }, () => {
  conArbolCommiteado((root) => {
    const manifest = path.join(root, 'packages', 'mesh', 'blob-sync-harness', 'package.json');
    // Renombrar, no borrar: además de ocultar la pieza deja un vecino de
    // nombre parecido que el walk NO debe confundir con un manifiesto.
    fs.renameSync(manifest, `${manifest}.oculta-u233`);
    const result = runMatriz51({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.ok(
      result.fallos.some(
        (f) => f.codigo === 'contraste-solo-matriz' && f.detalle.includes('@zeus/blob-sync-harness')
      ),
      JSON.stringify(result.fallos)
    );
    assert.ok(result.fallos.some((f) => f.codigo === 'denominador-total'));
    const cli = runCliEn(root);
    assert.notEqual(cli.status, 0, 'el CLI debe salir ≠ 0 con la pieza ocultada');
    // Igual que la probe (a): el código de salida sin el mensaje deja pasar un
    // rojo por cualquier otra razón. Las dos probes exigen lo mismo.
    assert.match(cli.stdout, /matriz-51: FAIL/);
  });
});

test('fail-probe (c): celda sin evidencia ni ⏳ falla, no advierte', () => {
  const result = runMatriz51({ repoRoot: REPO_ROOT });
  const fila = structuredClone(result.filas[0]);
  fila.celdas.canal = { valor: 'npm', evidencia: '' };
  const fallos = validarCeldas([fila]);
  assert.equal(fallos.length, 1);
  assert.equal(fallos[0].codigo, 'celda-sin-evidencia');
  assert.match(fallos[0].detalle, /canal/);
  // control: la misma fila con ⏳ explícito no falla
  fila.celdas.canal = { valor: '⏳ hasta U236', evidencia: '' };
  assert.deepEqual(validarCeldas([fila]), []);
});

test('fail-probe (c-bis, D3): valor vacío con evidencia no basta — falla salvo ⏳', () => {
  const result = runMatriz51({ repoRoot: REPO_ROOT });
  const fila = structuredClone(result.filas[0]);
  fila.celdas.start = { valor: '', evidencia: 'alguna/ruta/package.json' };
  const fallos = validarCeldas([fila]);
  assert.equal(fallos.length, 1);
  assert.equal(fallos[0].codigo, 'celda-sin-valor');
  assert.match(fallos[0].detalle, /start/);
  // control: valor vacío con ⏳ en evidencia pasa
  fila.celdas.start = { valor: '', evidencia: '⏳ hasta U236' };
  assert.deepEqual(validarCeldas([fila]), []);
});

test('fail-probe (d): entrada de catálogo sin marca explícita o con workspace fantasma', () => {
  const sintetico = [
    "export const CATALOG_SEED = [",
    "  {",
    "    id: 'sin-marca',",
    "    name: 'sin-marca'",
    "  },",
    "  {",
    "    id: 'huerfana',",
    "    name: 'huerfana',",
    "    workspace: '@zeus/no-existe-en-el-arbol'",
    "  },",
    "  {",
    "    id: 'declarada',",
    "    name: 'declarada',",
    "    workspace: null",
    "  }",
    "\n];"
  ].join('\n');
  const { entradas, fallos: fallosParse } = parseSeedEntries(sintetico, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallosParse, []);
  assert.equal(entradas.length, 3);
  const cmp = compararCatalogo(entradas, new Set(['@zeus/existente']));
  assert.ok(cmp.fallos.some((f) => f.codigo === 'catalogo-sin-marca' && f.detalle.includes('sin-marca')));
  assert.ok(
    cmp.fallos.some(
      (f) => f.codigo === 'catalogo-workspace-fantasma' && f.detalle.includes('@zeus/no-existe-en-el-arbol')
    )
  );
  assert.deepEqual(
    cmp.declaradasSinPieza.map((d) => d.id),
    ['declarada']
  );
});

// ---------------------------------------------------------------------------
// Vectores de contrarrevisión D1 (permanentes — cazan regresiones del parser)
// ---------------------------------------------------------------------------

test('D1-V1: entrada con comillas DOBLES no es invisible — workspace fantasma falla', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    '    id: "cr-dobles",',
    '    name: "cr-dobles",',
    '    workspace: "@zeus/no-existe-jamas"',
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallos, []);
  assert.equal(entradas.length, 1, 'la entrada en comillas dobles debe ser visible');
  assert.equal(entradas[0].id, 'cr-dobles');
  assert.equal(entradas[0].workspace, '@zeus/no-existe-jamas');
  const cmp = compararCatalogo(entradas, new Set(['@zeus/existente']));
  assert.ok(
    cmp.fallos.some(
      (f) => f.codigo === 'catalogo-workspace-fantasma' && f.detalle.includes('@zeus/no-existe-jamas')
    ),
    JSON.stringify(cmp.fallos)
  );
  assert.deepEqual(cmp.declaradasSinPieza, []);
});

test('D1-V2: id simple + workspace en dobles no se degrada a null — falla como fantasma', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    "    id: 'cr-mixta',",
    "    name: 'cr-mixta',",
    '    workspace: "@zeus/tampoco-existe"',
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallos, []);
  assert.equal(entradas[0].workspace, '@zeus/tampoco-existe', 'no debe fabricarse null');
  const cmp = compararCatalogo(entradas, new Set(['@zeus/existente']));
  assert.ok(cmp.fallos.some((f) => f.codigo === 'catalogo-workspace-fantasma'));
  assert.deepEqual(cmp.declaradasSinPieza, [], 'no debe listarse como ⏳ declarada');
});

test('D1-V4: comentario "workspace: null" NO cuenta como marca — falla sin-marca', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    "    id: 'cr-comentario',",
    "    name: 'cr-comentario' // TODO decidir workspace: null o real",
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallos, []);
  assert.equal(entradas.length, 1);
  assert.equal(entradas[0].hasWorkspaceKey, false, 'el comentario no debe satisfacer la marca');
  const cmp = compararCatalogo(entradas, new Set());
  assert.ok(
    cmp.fallos.some((f) => f.codigo === 'catalogo-sin-marca' && f.detalle.includes('cr-comentario')),
    JSON.stringify(cmp.fallos)
  );
  assert.deepEqual(cmp.declaradasSinPieza, []);
});

test('D1: workspace presente pero no parseable = fallo de parse ruidoso, no null', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    "    id: 'cr-const',",
    '    workspace: ALGUNA_CONSTANTE',
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.ok(
    fallos.some((f) => f.codigo === 'catalogo-parse' && f.detalle.includes('cr-const')),
    JSON.stringify(fallos)
  );
  assert.deepEqual(entradas, [], 'no debe emitirse entrada con dato fabricado');
});

test('D1: bloque sin id literal (spread) = fallo ruidoso, falla cerrada', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  { ...BASE, spawnGroup: "x" }',
    '\n];'
  ].join('\n');
  const { fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.ok(
    fallos.some((f) => f.codigo === 'catalogo-parse' && /sin id parseable/.test(f.detalle)),
    JSON.stringify(fallos)
  );
});

// ---------------------------------------------------------------------------
// WP-U265 · `tipo` y `health` derivados del `kind` del catálogo, no de la
// presencia de la entrada. Y el gate deja de ser ciego a su propia salida.
// ---------------------------------------------------------------------------

/** Entradas de catálogo del árbol vivo, indexadas por workspace. */
function entradasPorPieza() {
  const { entradas } = parseCatalogo({ repoRoot: REPO_ROOT });
  const m = new Map();
  for (const e of entradas) {
    if (!e.workspace) continue;
    if (!m.has(e.workspace)) m.set(e.workspace, []);
    m.get(e.workspace).push(e);
  }
  return m;
}

test('U265 CA1: `kind: service` NO se publica como tipo MCP, y el health sale de healthPath', { timeout: 120_000 }, () => {
  const result = runMatriz51({ repoRoot: REPO_ROOT });
  const porPieza = entradasPorPieza();
  const servicios = [...porPieza].filter(([, es]) => es.every((e) => e.kind === 'service'));
  assert.ok(
    servicios.length > 0,
    'el catálogo debe declarar al menos una entrada kind:service, o este CA no prueba nada'
  );
  for (const [pieza, es] of servicios) {
    const fila = result.filas.find((f) => f.pieza === pieza);
    assert.ok(fila, `${pieza} sin fila en la matriz`);
    assert.notEqual(
      fila.celdas.tipo.valor,
      'MCP',
      `${pieza} declara kind:'service' (sin superficie MCP) y la matriz la publica como MCP`
    );
    // el health es el declarado, no el literal /mcp/health de antes de U265
    const esperado = es[0].healthPath ?? HEALTH_PATH_DEFAULT;
    assert.ok(
      fila.celdas.health.valor.startsWith(`${esperado} `),
      `${pieza}: health "${fila.celdas.health.valor}" no arranca por el healthPath declarado "${esperado}"`
    );
  }
  // Control por el otro lado: las entradas kind mcp SÍ son MCP.
  for (const [pieza, es] of porPieza) {
    if (!es.every((e) => e.kind === 'mcp')) continue;
    const fila = result.filas.find((f) => f.pieza === pieza);
    assert.equal(fila.celdas.tipo.valor, 'MCP', `${pieza} declara kind:'mcp' y no se publica como MCP`);
  }
  // Y el denominador no se mueve por nada de esto.
  assert.equal(result.filas.length, EXPECTED_TOTAL);
  assert.equal(result.ok, true, JSON.stringify(result.fallos, null, 2));
});

test('U265: parseSeedEntries lee kind y healthPath, y falla cerrada si no puede', () => {
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    "    id: 'con-kind',",
    "    workspace: '@zeus/x',",
    "    kind: 'service',",
    "    healthPath: '/health'",
    '  },',
    '  {',
    "    id: 'sin-kind',",
    "    workspace: '@zeus/y'",
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallos, []);
  assert.deepEqual(
    entradas.map((e) => [e.id, e.kind, e.healthPath]),
    [
      ['con-kind', 'service', '/health'],
      // ausente ⇒ default del typedef del catálogo, y `healthPath` queda en
      // null para que quien lo use pueda decir que es default, no declaración
      ['sin-kind', KIND_DEFAULT, null]
    ]
  );

  // kind fuera del typedef: NO se degrada al default, que es el valor mentiroso
  const raro = parseSeedEntries(
    ["export const CATALOG_SEED = [", '  {', "    id: 'raro',", "    kind: 'mcpp'", '  }', '\n];'].join('\n'),
    'CATALOG_SEED',
    'sintetico.mjs'
  );
  assert.ok(
    raro.fallos.some((f) => f.codigo === 'catalogo-parse' && /kind "mcpp"/.test(f.detalle)),
    JSON.stringify(raro.fallos)
  );
  assert.deepEqual(raro.entradas, []);

  // kind/healthPath presentes pero no literales: ruidoso, no fabricado
  for (const [campo, linea] of [
    ['kind', '    kind: ALGUNA_CONSTANTE'],
    ['healthPath', '    healthPath: RUTA']
  ]) {
    const r = parseSeedEntries(
      ['export const CATALOG_SEED = [', '  {', "    id: 'cr',", linea, '  }', '\n];'].join('\n'),
      'CATALOG_SEED',
      'sintetico.mjs'
    );
    assert.ok(
      r.fallos.some((f) => f.codigo === 'catalogo-parse' && f.detalle.includes(campo)),
      `${campo}: ${JSON.stringify(r.fallos)}`
    );
    assert.deepEqual(r.entradas, [], `${campo}: no debe emitirse entrada con dato fabricado`);
  }
});

test('U265: un claim de catálogo ilegible NO se toma por negativo', () => {
  assert.equal(clasificarClaimCatalogo('**sí**: entrada `x`'), 'sí');
  assert.equal(clasificarClaimCatalogo('no · grep → 0'), 'no');
  assert.equal(clasificarClaimCatalogo('sin entrada de catálogo'), 'no');
  assert.equal(clasificarClaimCatalogo('pendiente de mirar'), null);
  const fallos = compararContrasteCatalogo(
    [{ nombre: '@zeus/x', linea: 7, catalogo: { texto: 'pendiente de mirar', claim: null, citados: [], kind: null, healthPath: null } }],
    []
  );
  assert.ok(
    fallos.some((f) => f.codigo === 'contraste-catalogo-ilegible'),
    JSON.stringify(fallos)
  );
});

/**
 * Monta un contraste sintético con las celdas «catálogo» que se le den.
 * @param {{ pieza: string, celda: string }[]} celdas
 * @param {(dir: string) => void} fn
 */
function conContrasteSintetico(celdas, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'u265-contraste-'));
  try {
    fs.mkdirSync(path.join(tmp, 'plan'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, ...CONTRASTE_PATH.split('/')),
      [
        '| Pieza | tipo | catálogo | comando |',
        '|---|---|---|---|',
        ...celdas.map((c) => `| ${c.pieza} | ⏳ | ${c.celda} | ⏳ |`)
      ].join('\n')
    );
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Entrada de catálogo sintética con la forma completa de `CatalogoEntrada`.
 * En una sola fábrica: añadir un campo al parser no debe obligar a tocar seis
 * tests, que es como se acaba con vectores que dejan de representar el dato.
 * @param {Partial<import('../../scripts/gates/matriz-51.mjs').CatalogoEntrada>} over
 */
function entradaSintetica(over) {
  return {
    id: 'x',
    workspace: '@zeus/x',
    hasWorkspaceKey: true,
    kind: 'mcp',
    hasKindKey: false,
    healthPath: null,
    hasHealthPathKey: false,
    fuente: 'sintetico.mjs',
    ...over
  };
}

/**
 * Corre `compararContrasteCatalogo` sobre una celda de contraste REAL (escrita
 * a fichero y leída por `parseContraste`, no un objeto a mano: así el vector
 * ejercita también `leerCeldaCatalogo`).
 * @param {string} celda @param {object[]} entradas
 */
function contrastarCelda(celda, entradas, pieza = '@zeus/x') {
  let fallos;
  conContrasteSintetico([{ pieza, celda }], (tmp) => {
    const r = parseContraste({ repoRoot: tmp });
    assert.deepEqual(r.fallos, []);
    fallos = compararContrasteCatalogo(r.filas, entradas);
  });
  return fallos;
}

const CITA = '`packages/mesh/mcp-launcher/src/catalog.mjs:10-20`';

// --- B1 · las ramas que ningún vector tocaba. Cuatro rojos de unidad sobre
// --- `compararContrasteCatalogo`, que ya estaba exportada: ni una línea del
// --- gate se mueve por ellos, así que no mueven ninguna cifra.

test('U265 rojo · afirma entrada y NO hay: es la rama que sostiene «la ceguera está cerrada»', () => {
  // Sin esta rama, mover el catálogo hacia atrás (el escenario del reporte §1.c)
  // vuelve a pasar en verde. La suite entera pasaba con estas seis líneas
  // borradas, así que el vector va aquí y no en la prosa.
  const fallos = contrastarCelda(
    `**sí**: \`x\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`,
    [] // catálogo sin ninguna entrada para @zeus/x
  );
  assert.deepEqual(
    fallos.map((f) => f.codigo),
    ['contraste-catalogo-caduco']
  );
  assert.match(fallos[0].detalle, /afirma entrada de catálogo, pero hoy 0 entradas/);
  // control: con la entrada presente, verde
  assert.deepEqual(
    contrastarCelda(`**sí**: \`x\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`, [entradaSintetica({})]),
    []
  );
});

test('U265 rojo · afirma entrada pero no nombra todos los ids', () => {
  const entradas = [entradaSintetica({ id: 'uno' }), entradaSintetica({ id: 'dos' })];
  const fallos = contrastarCelda(
    `**sí**: \`uno\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`,
    entradas
  );
  assert.ok(
    fallos.some((f) => f.codigo === 'contraste-catalogo-incompleto' && f.detalle.includes('`dos`')),
    JSON.stringify(fallos)
  );
  // control: nombrando los dos, verde
  assert.deepEqual(
    contrastarCelda(`**sí**: \`uno\` + \`dos\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`, entradas),
    []
  );
});

test('U265 rojo · `-mixto` SÍ se puede fabricar: dos entradas de una pieza con kind distinto', () => {
  const entradas = [
    entradaSintetica({ id: 'uno', kind: 'mcp' }),
    entradaSintetica({ id: 'dos', kind: 'service', healthPath: '/health', hasKindKey: true, hasHealthPathKey: true })
  ];
  const fallos = contrastarCelda(
    `**sí**: \`uno\` + \`dos\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`,
    entradas
  );
  // El orden de los kinds en el mensaje lo fija el orden por id de las
  // entradas, no el de este vector: se asevera que los nombra a los dos.
  assert.ok(
    fallos.some(
      (f) =>
        f.codigo === 'contraste-catalogo-mixto' &&
        f.detalle.includes('mcp') &&
        f.detalle.includes('service') &&
        f.detalle.includes('/health')
    ),
    JSON.stringify(fallos)
  );
  // control: dos entradas que SÍ coinciden no disparan -mixto
  assert.deepEqual(
    contrastarCelda(`**sí**: \`uno\` + \`dos\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`, [
      entradaSintetica({ id: 'uno' }),
      entradaSintetica({ id: 'dos' })
    ]),
    []
  );
});

test('U265 rojo · el kind o el health ANOTADOS ya no son los declarados', () => {
  const servicio = [
    entradaSintetica({ kind: 'service', hasKindKey: true, healthPath: '/health', hasHealthPathKey: true })
  ];
  const porKind = contrastarCelda(`**sí**: \`x\` · kind \`mcp\` · health \`/health\` · ${CITA}`, servicio);
  assert.ok(
    porKind.some((f) => f.codigo === 'contraste-catalogo-caduco' && /anota kind `mcp`/.test(f.detalle)),
    JSON.stringify(porKind)
  );
  const porHealth = contrastarCelda(
    `**sí**: \`x\` · kind \`service\` · health \`/mcp/health\` · ${CITA}`,
    servicio
  );
  assert.ok(
    porHealth.some((f) => f.codigo === 'contraste-catalogo-caduco' && /anota health `\/mcp\/health`/.test(f.detalle)),
    JSON.stringify(porHealth)
  );
  // control: anotando lo declarado, verde
  assert.deepEqual(
    contrastarCelda(`**sí**: \`x\` · kind \`service\` · health \`/health\` · ${CITA}`, servicio),
    []
  );
});

test('U265 rojo · celda afirmativa SIN cita `ruta:línea` (la forma, no el número)', () => {
  const fallos = contrastarCelda('**sí**: `x` · kind `mcp` · health `/mcp/health`', [entradaSintetica({})]);
  assert.ok(
    fallos.some((f) => f.codigo === 'contraste-catalogo-incompleto' && /sin ninguna cita/.test(f.detalle)),
    JSON.stringify(fallos)
  );
  // Una cita SUELTA (`:288`, sin ruta) no basta; con ruta y línea, verde.
  assert.ok(
    contrastarCelda('**sí**: `x` · kind `mcp` · health `/mcp/health` · `:288`', [entradaSintetica({})]).some(
      (f) => /sin ninguna cita/.test(f.detalle)
    )
  );
  assert.deepEqual(
    contrastarCelda(`**sí**: \`x\` · kind \`mcp\` · health \`/mcp/health\` · ${CITA}`, [entradaSintetica({})]),
    []
  );
});

test('U265 · pieza mixta: la celda publicada se denuncia SIEMPRE, diga lo que diga el contraste', () => {
  const entradas = [
    entradaSintetica({ id: 'uno', kind: 'mcp' }),
    entradaSintetica({ id: 'dos', kind: 'service', healthPath: '/health', hasKindKey: true, hasHealthPathKey: true })
  ];
  const fila = {
    pieza: '@zeus/x',
    celdas: { tipo: { valor: 'MCP', evidencia: 'x' }, health: { valor: '/mcp/health vía catálogo', evidencia: 'x' } }
  };
  const fallos = compararCeldasConKind([fila], entradas);
  assert.deepEqual(fallos.map((f) => f.codigo), ['catalogo-kind-mixto']);
  assert.match(fallos[0].detalle, /elegida por orden/);
});

test('U265 · `healthPath: \'\'` vale el default en el VALOR y no miente en la evidencia', () => {
  // Trampa evitada a propósito: NO se endurece el parse. El runtime hace
  // `entry.healthPath || '/mcp/health'`, así que el valor debe ser el default;
  // lo que no puede es decir «sin healthPath» cuando el campo está declarado.
  const seed = [
    'export const CATALOG_SEED = [',
    '  {',
    "    id: 'vacio',",
    "    workspace: '@zeus/x',",
    "    healthPath: ''",
    '  }',
    '\n];'
  ].join('\n');
  const { entradas, fallos } = parseSeedEntries(seed, 'CATALOG_SEED', 'sintetico.mjs');
  assert.deepEqual(fallos, [], 'la cadena vacía es válida para el runtime: no se endurece el parse');
  assert.equal(entradas[0].healthPath, '');
  assert.equal(entradas[0].hasHealthPathKey, true);
  const h = healthDe(entradas[0]);
  assert.equal(h.path, HEALTH_PATH_DEFAULT, 'mismo valor que el runtime');
  assert.equal(h.declarado, true, 'el campo SÍ estaba declarado');
  assert.match(h.motivo, /declarado VACÍO/);
  assert.doesNotMatch(h.motivo, /sin healthPath/, 'la evidencia no puede decir que el campo falta');
  // control: campo ausente de verdad
  const ausente = healthDe(entradaSintetica({}));
  assert.equal(ausente.declarado, false);
  assert.match(ausente.motivo, /sin healthPath/);
});

test('U265 CA2 · VECTOR GUARDADO: la columna «catálogo» de 0a441d1 pone el gate ROJO', () => {
  assert.equal(CELDAS_RANCIAS.length, 16, 'el vector vendorizado debe traer las 16 celdas');
  assert.equal(ORIGEN_U265.commit, '0a441d1');
  // Suelo de los dos grupos: sin esto, un vector degradado a 0 celdas de un
  // tipo deja su bucle corriendo cero veces con el test en verde.
  assert.equal(CADUCAS.length, 9, 'el vector debe traer las 9 celdas que negaban tener entrada');
  assert.equal(SIN_ANOTAR.length, 7, 'y las 7 que afirmaban sin anotar kind/health');
  // Fidelidad del contenido vendorizado contra SÍ MISMO: con `fetch-depth: 1`
  // no se puede contrastar con el blob de git (U260), pero una huella clavada
  // aquí sí viaja. Si esta huella cambia, alguien editó el vector: o fue a
  // propósito y se actualiza con el porqué, o el vector dejó de ser el de
  // 0a441d1 y no prueba lo que dice probar.
  assert.equal(
    createHash('sha256').update(JSON.stringify(CELDAS_RANCIAS)).digest('hex'),
    HUELLA_VECTOR_U265
  );
  const porPieza = entradasPorPieza();

  conContrasteSintetico(CELDAS_RANCIAS, (tmp) => {
    const { filas, fallos: fallosParse } = parseContraste({ repoRoot: tmp });
    assert.deepEqual(fallosParse, []);
    assert.equal(filas.length, CELDAS_RANCIAS.length);

    const { entradas } = parseCatalogo({ repoRoot: REPO_ROOT });
    const fallos = compararContrasteCatalogo(filas, entradas);

    // Las que negaban tener entrada y hoy la tienen: una a una, por nombre.
    const esperadasCaducas = CADUCAS.filter((p) => porPieza.has(p)).sort();
    assert.ok(esperadasCaducas.length > 0, 'el vector debe seguir teniendo caducidad que denunciar');
    const caducas = [
      ...new Set(
        fallos
          .filter((f) => f.codigo === 'contraste-catalogo-caduco' && /dice «sin entrada/.test(f.detalle))
          .map((f) => f.detalle.match(/\((@zeus\/[^)]+)\)/)[1])
      )
    ].sort();
    assert.deepEqual(caducas, esperadasCaducas);

    // Y las que afirmaban sin anotar kind/health: incompletas, las dos mitades.
    for (const pieza of SIN_ANOTAR.filter((p) => porPieza.has(p))) {
      for (const que of ['el kind', 'el health']) {
        assert.ok(
          fallos.some(
            (f) =>
              f.codigo === 'contraste-catalogo-incompleto' &&
              f.detalle.includes(pieza) &&
              f.detalle.includes(`sin anotar ${que}`)
          ),
          `${pieza}: falta el fallo por «sin anotar ${que}» — ${JSON.stringify(fallos)}`
        );
      }
    }
  });
});

test('U265 CA2 · el mismo vector, de punta a punta: el CLI sale ≠ 0', { timeout: 120_000 }, () => {
  conArbolCommiteado((root) => {
    // control: el árbol commiteado, intacto, está verde
    assert.equal(runCliEn(root).status, 0, 'sin el vector el árbol debe estar verde');

    // se replanta SÓLO la columna «catálogo» de las 16 filas, con el texto
    // literal de 0a441d1: el resto de la matriz sigue siendo la de hoy.
    const md = path.join(root, ...CONTRASTE_PATH.split('/'));
    const rancias = new Map(CELDAS_RANCIAS.map((c) => [c.pieza, c.celda]));
    let col = -1;
    let replantadas = 0;
    const lineas = fs.readFileSync(md, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lineas.length; i++) {
      if (/^\|\s*Pieza\s*\|/i.test(lineas[i])) {
        col = lineas[i].split('|').findIndex((c) => c.trim().toLowerCase() === 'catálogo');
        continue;
      }
      const m = lineas[i].match(/^\|\s*(@zeus\/[A-Za-z0-9._-]+)\s*\|/);
      if (!m || col < 1 || !rancias.has(m[1])) continue;
      const celdas = lineas[i].split('|');
      celdas[col] = ` ${rancias.get(m[1])} `;
      lineas[i] = celdas.join('|');
      replantadas++;
    }
    assert.equal(replantadas, CELDAS_RANCIAS.length, 'el vector no se replantó entero: la probe sería vacua');
    fs.writeFileSync(md, lineas.join('\n'));

    const cli = runCliEn(root);
    assert.notEqual(cli.status, 0, 'con la columna de 0a441d1 el gate DEBE salir ≠ 0');
    assert.match(cli.stdout, /matriz-51: FAIL/);
    assert.match(cli.stdout, /contraste-catalogo-caduco/);
    assert.match(cli.stdout, /contraste-catalogo-incompleto/);
  });
});

// ---------------------------------------------------------------------------
// WP-U265 · CENSO DE MUTACIÓN. Se desactiva la derivación por `kind` en el
// gate COPIADO al árbol temporal y se exige rojo. Sin esto, las comprobaciones
// de arriba podrían ser tautologías que no giran nunca.
// ---------------------------------------------------------------------------

/**
 * @param {string} root raíz temporal con el gate copiado dentro
 * @param {string} antes fragmento literal del gate
 * @param {string} despues con qué se sustituye
 */
function mutarGate(root, antes, despues) {
  const abs = path.join(root, 'scripts', 'gates', 'matriz-51.mjs');
  const fuente = fs.readFileSync(abs, 'utf8');
  const veces = fuente.split(antes).length - 1;
  // Una mutación que no se aplica deja la probe en verde por la razón
  // equivocada — es el «hijo vacuo» de U252, pero en el mutador. El ancla se
  // busca en el gate COMMITEADO: si acabas de tocar la derivación y aún no has
  // commiteado, este rojo dice eso y no otra cosa.
  assert.equal(
    veces,
    1,
    `la mutación no ancla en el gate commiteado (${veces} coincidencias de ` +
      `${JSON.stringify(antes)}). Si acabas de reescribir esa línea, commitea ` +
      `y actualiza MUTANTES: un ancla muerta deja el censo de mutación vacuo.`
  );
  fs.writeFileSync(abs, fuente.replace(antes, despues));
}

const MUTANTES = [
  {
    nombre: 'M1 · el parser deja de leer `kind` (todo pasa a "mcp")',
    antes: 'const kind = kindMatch ? (kindMatch[1] ?? kindMatch[2]) : KIND_DEFAULT;',
    despues: 'const kind = KIND_DEFAULT;',
    codigo: 'contraste-catalogo-caduco',
    porque:
      'lo caza SÓLO el contraste: derivación y comprobación de celdas se mueven ' +
      'juntas con el parser, el texto commiteado de la matriz no'
  },
  {
    nombre: 'M2 · el defecto histórico literal: `if (entrada) tipo = MCP`',
    antes: "if (entrada && entrada.kind === 'mcp') {",
    despues: 'if (entrada) {',
    codigo: 'tipo-vs-kind',
    porque: 'lo caza SÓLO la comprobación de celdas: el contraste y el parser siguen sanos'
  },
  {
    nombre: 'M3 · el health vuelve al literal /mcp/health',
    antes: 'valor: `${h.path} vía catálogo`,',
    despues: 'valor: `/mcp/health vía catálogo`,',
    codigo: 'health-vs-healthpath',
    porque: 'la otra mitad del mismo `if`, y también sólo la ve la comprobación de celdas'
  }
];

for (const m of MUTANTES) {
  test(`U265 CA5 · censo de mutación — ${m.nombre} ⇒ ROJO (${m.porque})`, { timeout: 120_000 }, () => {
    conArbolCommiteado((root) => {
      assert.equal(runCliEn(root).status, 0, 'control: el árbol sin mutar debe estar verde');
      mutarGate(root, m.antes, m.despues);
      const cli = runCliEn(root);
      assert.notEqual(cli.status, 0, `${m.nombre}: el gate debe salir ≠ 0\n${cli.stdout}${cli.stderr}`);
      assert.match(cli.stdout, /matriz-51: FAIL/);
      assert.ok(
        cli.stdout.includes(m.codigo),
        `${m.nombre}: se esperaba el código ${m.codigo}\n${cli.stdout}`
      );
    });
  });
}

test('U265: compararCeldasConKind no calla cuando la fila publicada miente', () => {
  const entradas = [
    { id: 'x-ui', workspace: '@zeus/x', hasWorkspaceKey: true, kind: 'service', hasKindKey: true, healthPath: '/health', fuente: 'sintetico.mjs' }
  ];
  const filaHonesta = {
    pieza: '@zeus/x',
    celdas: { tipo: { valor: 'UI', evidencia: 'x' }, health: { valor: '/health vía catálogo', evidencia: 'x' } }
  };
  assert.deepEqual(compararCeldasConKind([filaHonesta], entradas), []);

  const filaMentirosa = structuredClone(filaHonesta);
  filaMentirosa.celdas.tipo.valor = 'MCP';
  filaMentirosa.celdas.health.valor = '/mcp/health vía catálogo';
  const fallos = compararCeldasConKind([filaMentirosa], entradas);
  assert.deepEqual(fallos.map((f) => f.codigo).sort(), ['health-vs-healthpath', 'tipo-vs-kind']);
});

test('D2: fila duplicada en la MATRIZ de contraste = fallo, no «coincide»', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'u233-contraste-'));
  try {
    fs.mkdirSync(path.join(tmp, 'plan'), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, 'plan', 'MATRIZ-RUNTIME-51.md'),
      ['| @zeus/uno | lib |', '| @zeus/dos | lib |', '| @zeus/uno | lib |'].join('\n')
    );
    const r = parseContraste({ repoRoot: tmp });
    assert.equal(r.nombres.length, 3, 'filas físicas');
    assert.equal(r.unicos.length, 2, 'únicas');
    assert.ok(
      r.fallos.some((f) => f.codigo === 'contraste-duplicado' && f.detalle.includes('@zeus/uno')),
      JSON.stringify(r.fallos)
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
