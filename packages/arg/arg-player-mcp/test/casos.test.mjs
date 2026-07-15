/**
 * Playbook CASOS.md: parseo de casos y coherencia mínima con los tools.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readCasosMarkdown, listCasoIds, extractCaso } from '../src/casos.mjs';

const EXPECTED_IDS = [
  'C-01',
  'C-02',
  'C-02b',
  'C-03',
  'C-04',
  'C-04b',
  'C-05',
  'C-06',
  'C-07',
  'C-08',
  'C-09',
  'C-10',
  'C-11',
  'C-12',
  'C-12b',
  'C-13',
  'C-14',
  'C-15',
  'C-16',
  'C-17',
  'C-18'
];

test('CASOS.md contiene todos los casos del playbook en orden', () => {
  const markdown = readCasosMarkdown();
  assert.deepEqual(listCasoIds(markdown), EXPECTED_IDS);
});

test('extractCaso devuelve la sección completa (y null si no existe)', () => {
  const markdown = readCasosMarkdown();
  const c04b = extractCaso(markdown, 'C-04b');
  assert.ok(c04b.startsWith('## C-04b'));
  assert.match(c04b, /sin_contacto/);
  assert.match(c04b, /player_tap_set/);
  // No arrastra la sección siguiente.
  assert.ok(!c04b.includes('## C-05'));
  // Case-insensitive.
  assert.equal(extractCaso(markdown, 'c-04B'), c04b);
  assert.equal(extractCaso(markdown, 'C-99'), null);
});

test('cada caso cita al menos una llamada MCP literal player_*', () => {
  const markdown = readCasosMarkdown();
  for (const id of EXPECTED_IDS) {
    const section = extractCaso(markdown, id);
    assert.ok(section, `falta el caso ${id}`);
    assert.match(section, /player_\w+/, `el caso ${id} no cita tools player_*`);
    assert.match(section, /Criterio de éxito/, `el caso ${id} no tiene criterio de éxito`);
  }
});

test('los casos de la fase 1.6 citan los tools del mar vivo (WP-32)', () => {
  const markdown = readCasosMarkdown();
  assert.match(extractCaso(markdown, 'C-17'), /player_salvage/);
  assert.match(extractCaso(markdown, 'C-18'), /player_track/);
});
