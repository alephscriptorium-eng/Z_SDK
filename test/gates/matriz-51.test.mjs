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
import {
  REPO_ROOT,
  EXPECTED_TOTAL,
  CONTRASTE_PATH,
  ALLOWLIST_PATH,
  CATALOG_PATH,
  CATALOG_EXTEND_PATH,
  runMatriz51,
  buildJson,
  validarCeldas,
  parseSeedEntries,
  parseContraste,
  compararCatalogo
} from '../../scripts/gates/matriz-51.mjs';

const GATE = path.join(REPO_ROOT, 'scripts', 'gates', 'matriz-51.mjs');

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
 * Rutas que el gate lee y que NO se pueden derivar de un patrón del índice.
 * @type {string[]}
 */
const LECTURAS_FIJAS = [
  'package.json',
  CONTRASTE_PATH,
  ALLOWLIST_PATH,
  CATALOG_PATH,
  CATALOG_EXTEND_PATH,
  // El propio gate: al vivir en <tmp>/scripts/gates/matriz-51.mjs su REPO_ROOT
  // (`path.resolve(__dirname, '../..')`, matriz-51.mjs:52) es <tmp>. Así el CLI
  // se ejercita de verdad —exit code incluido— sin tocar el repo.
  'scripts/gates/matriz-51.mjs'
];

/** @param {string[]} args @returns {string[]} rutas del índice, sin vacíos */
function lsFiles(args) {
  return execFileSync('git', ['ls-files', '-z', ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
    .split('\0')
    .filter(Boolean);
}

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
  const rastreados = lsFiles(['--']);
  const rutas = [
    ...new Set([
      ...rastreados.filter((p) => p === 'package.json' || p.endsWith('/package.json')),
      ...rastreados.filter((p) => /\/src\/(server|mcp-server|start)\.mjs$/.test(p)),
      ...LECTURAS_FIJAS
    ])
  ];

  const raiz = JSON.parse(
    execFileSync('git', ['cat-file', 'blob', 'HEAD:package.json'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    })
  );
  const bases = (Array.isArray(raiz.workspaces) ? raiz.workspaces : [])
    .filter((g) => g.endsWith('/*'))
    .map((g) => g.slice(0, -2));

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
  return execFileSync(
    'git',
    [
      'status', '--porcelain', '-z', '--untracked-files=all', '--',
      '*package.json', CONTRASTE_PATH, ALLOWLIST_PATH, CATALOG_PATH, CATALOG_EXTEND_PATH,
      '*/src/server.mjs', '*/src/mcp-server.mjs', '*/src/start.mjs',
      'scripts/gates/matriz-51.mjs'
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
    .split('\0')
    .filter(Boolean)
    .filter((e) => e.length > 3);
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
