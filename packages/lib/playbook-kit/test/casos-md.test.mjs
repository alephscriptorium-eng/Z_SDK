import test from 'node:test';
import assert from 'node:assert/strict';
import { listCasoIds, extractCaso } from '../src/casos-md.mjs';

const SAMPLE = `# Playbook

## C-01 — join
pasos…

## C-02b — edge
detalle sin_contacto

## C-03 — goto
fin
`;

test('listCasoIds orden de aparición', () => {
  assert.deepEqual(listCasoIds(SAMPLE), ['C-01', 'C-02b', 'C-03']);
});

test('extractCaso sección completa y case-insensitive', () => {
  const section = extractCaso(SAMPLE, 'c-02B');
  assert.ok(section.startsWith('## C-02b'));
  assert.match(section, /sin_contacto/);
  assert.ok(!section.includes('## C-03'));
  assert.equal(extractCaso(SAMPLE, 'C-99'), null);
});
