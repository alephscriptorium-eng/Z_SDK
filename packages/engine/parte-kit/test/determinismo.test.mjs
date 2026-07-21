import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { redactarParte } from '../src/redactar.mjs';
import { fixture50 } from './fixtures.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = join(__dir, 'snapshots', 'parte-50.json');

test('determinismo: 50 deltas → parte byte-idéntico en dos corridas', () => {
  const { estado0, deltas } = fixture50();
  assert.equal(deltas.length, 50);

  const a = redactarParte(estado0, deltas);
  const b = redactarParte(estado0, deltas);
  const ja = JSON.stringify(a.parte);
  const jb = JSON.stringify(b.parte);
  assert.equal(ja, jb);

  if (!existsSync(SNAPSHOT)) {
    writeFileSync(SNAPSHOT, `${ja}\n`, 'utf8');
  }
  const golden = readFileSync(SNAPSHOT, 'utf8').trim();
  assert.equal(ja, golden, 'snapshot drift');
});
