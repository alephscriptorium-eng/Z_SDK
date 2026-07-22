import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');

/** Tokens de método fragmentados — el blob del test no debe hostearlos. */
const PATRON_METODO = [
  'SCRIPT' + '_SDK',
  'S_' + 'SDK',
  'HOL' + 'ONES',
  'hol' + '\u00f3n',
  'ho' + 'lar' + 'qu' + '\u00eda',
  'jun' + 'tura',
  'swarm' + '-orquestacion',
  'BACK' + 'LOG',
  'orquest' + 'ador'
].join('|');

function collectTexts() {
  /** @type {string[]} */
  const blobs = [];
  for (const f of readdirSync(srcDir).filter((n) => n.endsWith('.mjs'))) {
    blobs.push(readFileSync(join(srcDir, f), 'utf8'));
  }
  blobs.push(readFileSync(join(root, 'README.md'), 'utf8'));
  blobs.push(readFileSync(join(root, 'package.json'), 'utf8'));
  return blobs;
}

test('ceguera árbol: cero tokens de método en src + README + package.json', () => {
  const re = new RegExp(PATRON_METODO, 'i');
  /** @type {string[]} */
  const hits = [];
  for (const blob of collectTexts()) {
    const m = blob.match(re);
    if (m) hits.push(m[0]);
  }
  assert.deepEqual(hits, []);
});
