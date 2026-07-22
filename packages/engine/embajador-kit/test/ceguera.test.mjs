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

/**
 * @param {string} dir
 * @param {(n: string) => boolean} pred
 * @returns {string[]}
 */
function walkFiles(dir, pred) {
  /** @type {string[]} */
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p, pred));
    else if (pred(ent.name)) out.push(p);
  }
  return out;
}

function collectTexts() {
  /** @type {string[]} */
  const blobs = [];
  for (const f of readdirSync(srcDir).filter((n) => n.endsWith('.mjs'))) {
    blobs.push(readFileSync(join(srcDir, f), 'utf8'));
  }
  blobs.push(readFileSync(join(root, 'README.md'), 'utf8'));
  blobs.push(readFileSync(join(root, 'package.json'), 'utf8'));
  const skillDir = join(root, 'skill');
  for (const f of walkFiles(skillDir, (n) => n.endsWith('.md'))) {
    blobs.push(readFileSync(f, 'utf8'));
  }
  return blobs;
}

test('ceguera árbol: cero tokens de método en src + skill + README + package.json', () => {
  const re = new RegExp(PATRON_METODO, 'i');
  /** @type {string[]} */
  const hits = [];
  for (const blob of collectTexts()) {
    const m = blob.match(re);
    if (m) hits.push(m[0]);
  }
  assert.deepEqual(hits, []);
});

test('ceguera tracking: cero WP-ids en skill + src + README', () => {
  const re = /WP-[A-Z]{1,2}\d/;
  /** @type {string[]} */
  const hits = [];
  for (const blob of collectTexts()) {
    const m = blob.match(re);
    if (m) hits.push(m[0]);
  }
  assert.deepEqual(hits, []);
});
