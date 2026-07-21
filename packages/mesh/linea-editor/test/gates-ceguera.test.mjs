/**
 * Eje II/III + V + horse-without-bytes + ceguera método.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeApprovalGate, requireMutationApproval } from '../src/gate.mjs';
import { resolveLineaEditorOffer } from '../src/horse-preset.mjs';
import { MUTATION_TOOL_CREAR_LINEA } from '../src/tools.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACK_ROOT = path.resolve(__dirname, '..');

/**
 * Forbidden método tokens — every fragment is concat-assembled so the
 * source tree never holds a contiguous literal (blind construction).
 */
function cegueraPattern() {
  const parts = [
    'Novel' + 'ist' + 'Editor',
    String.raw`\bnov` + 'ela\\b',
    'marco' + '-' + 'agn',
    'holarqu' + '[ií]a',
    'SCRIPT' + '_' + 'SDK',
    'HOL' + 'ONES',
    'swarm-' + 'orquestacion',
    'sprint-' + 'game-city',
    'WP-' + 'Z[0-9]+',
    'ciudad-' + 'como-m[eé]todo'
  ];
  return new RegExp(parts.join('|'), 'i');
}

/**
 * @param {string} dir
 * @param {string[]} acc
 */
function walkFiles(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, acc);
    else if (/\.(mjs|js|md|json)$/.test(ent.name)) acc.push(full);
  }
  return acc;
}

/**
 * Pack roots under ceguera (src + test + package docs).
 * @returns {string[]}
 */
function packScanRoots() {
  return [
    path.join(PACK_ROOT, 'src'),
    path.join(PACK_ROOT, 'test'),
    path.join(PACK_ROOT, 'README.md'),
    path.join(PACK_ROOT, 'package.json')
  ];
}

/**
 * @returns {string[]} relative paths with hits
 */
function scanPackForCeguera() {
  const re = cegueraPattern();
  const hits = [];
  for (const root of packScanRoots()) {
    if (!fs.existsSync(root)) continue;
    const files = fs.statSync(root).isDirectory() ? walkFiles(root) : [root];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (re.test(text)) hits.push(path.relative(PACK_ROOT, file));
    }
  }
  return hits;
}

test('eje V: gate visible and auditable', () => {
  const d = describeApprovalGate(MUTATION_TOOL_CREAR_LINEA);
  assert.ok(d.token);
  assert.match(d.gateLine, /token exacto/);
  assert.match(d.gateLine, new RegExp(MUTATION_TOOL_CREAR_LINEA));

  const denied = requireMutationApproval({
    toolName: MUTATION_TOOL_CREAR_LINEA,
    approve: true,
    approvalToken: 'WRONG'
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.rule, 'linea-editor.token_mismatch');
  assert.ok(denied.gate.gate_line);
  assert.equal(denied.gate.expected_token, d.token);
});

test('eje II/III: crearLinea defined once in linea-kit/tools', () => {
  const kitTools = path.resolve(
    PACK_ROOT,
    '../../engine/linea-kit/src/tools/crear-linea.mjs'
  );
  assert.ok(fs.existsSync(kitTools), 'kit definition must exist');
  const kitSrc = fs.readFileSync(kitTools, 'utf8');
  assert.match(kitSrc, /export function crearLinea/);

  const packTools = fs.readFileSync(
    path.join(PACK_ROOT, 'src/tools.mjs'),
    'utf8'
  );
  assert.match(packTools, /from '@zeus\/linea-kit\/tools'/);
  assert.doesNotMatch(packTools, /function crearLinea\s*\(/);
});

test('horse offer: preset refs only (no corpus keys)', () => {
  const offer = resolveLineaEditorOffer();
  assert.equal(offer._meta.preset.id, 'linea-editor');
  assert.ok(offer.tools.some((t) => t.name === MUTATION_TOOL_CREAR_LINEA));
  const blob = JSON.stringify(offer);
  assert.equal(/wikitext|"body":/i.test(blob), false);
  assert.ok(offer.resources.some((r) => r.uri === 'preset://linea-editor'));
});

test('ceguera ampliada: pack tree (src+test) free of método tokens', () => {
  const hits = scanPackForCeguera();
  assert.deepEqual(hits, [], `ceguera hits: ${hits.join(', ')}`);
});
