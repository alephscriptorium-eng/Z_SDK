/**
 * WP-U233 — autoprueba del gate matriz 51/51.
 * CA: verde en el árbol real (51 filas derivadas, contraste coincide,
 * 10 declaradas-sin-pieza visibles); rojo reproducible con:
 *   (a) pieza fantasma 52 añadida temporalmente → exit ≠ 0,
 *   (b) pieza ocultada (manifest renombrado) → exit ≠ 0,
 *   (c) celda sin evidencia ni ⏳ → falla, no advierte,
 *   (d) entrada de catálogo sin pieza NI marca explícita → falla.
 * Las probes (a) y (b) mutan el árbol dentro de try/finally y se revierten.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  REPO_ROOT,
  EXPECTED_TOTAL,
  runMatriz51,
  buildJson,
  validarCeldas,
  parseSeedEntries,
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

test('fail-probe (a): pieza fantasma 52 → exit ≠ 0 (revertida)', { timeout: 120_000 }, () => {
  const fantasmaDir = path.join(REPO_ROOT, 'packages', 'mesh', 'zz-pieza-fantasma-u233');
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
  try {
    const result = runMatriz51({ repoRoot: REPO_ROOT });
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
    const cli = runCli();
    assert.notEqual(cli.status, 0, 'el CLI debe salir ≠ 0 con la pieza fantasma presente');
    assert.match(cli.stdout, /matriz-51: FAIL/);
  } finally {
    fs.rmSync(fantasmaDir, { recursive: true, force: true });
  }
  const limpio = runMatriz51({ repoRoot: REPO_ROOT });
  assert.equal(limpio.ok, true, 'el árbol debe quedar verde tras revertir la probe');
});

test('fail-probe (b): pieza ocultada → exit ≠ 0 (revertida)', { timeout: 120_000 }, () => {
  const manifest = path.join(REPO_ROOT, 'packages', 'mesh', 'blob-sync-harness', 'package.json');
  const oculto = `${manifest}.oculta-u233`;
  fs.renameSync(manifest, oculto);
  try {
    const result = runMatriz51({ repoRoot: REPO_ROOT });
    assert.equal(result.ok, false);
    assert.ok(
      result.fallos.some(
        (f) => f.codigo === 'contraste-solo-matriz' && f.detalle.includes('@zeus/blob-sync-harness')
      ),
      JSON.stringify(result.fallos)
    );
    assert.ok(result.fallos.some((f) => f.codigo === 'denominador-total'));
    const cli = runCli();
    assert.notEqual(cli.status, 0, 'el CLI debe salir ≠ 0 con la pieza ocultada');
  } finally {
    fs.renameSync(oculto, manifest);
  }
  const limpio = runMatriz51({ repoRoot: REPO_ROOT });
  assert.equal(limpio.ok, true, 'el árbol debe quedar verde tras restaurar el manifest');
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
