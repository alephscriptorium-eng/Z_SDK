import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DECK_IDS,
  DEFAULT_SERVERS_BY_DECK,
  PARTE_CUES
} from '../src/constants.mjs';
import {
  resolveTableroDefaults,
  buildDeckLoadPayloads
} from '../src/bootstrap.mjs';

test('DECK_IDS includes A B C', () => {
  assert.deepEqual(DECK_IDS, ['A', 'B', 'C']);
});

test('resolveTableroDefaults maps preset names to ids', () => {
  const tablero = resolveTableroDefaults({
    alephConfig: { defaultPresets: { A: 'aleph-tronco-puro' } },
    presets: [{ id: 'preset-a', name: 'aleph-tronco-puro' }]
  });
  assert.equal(tablero.servers.A, DEFAULT_SERVERS_BY_DECK.A);
  assert.equal(tablero.presetIds.A, 'preset-a');
  const payloads = buildDeckLoadPayloads(tablero);
  assert.equal(payloads.A.serverName, 'linea-espana');
  assert.equal(payloads.A.presetId, 'preset-a');
  assert.equal(payloads.C.serverName, 'firehose-mcp-server');
});

test('PARTE_CUES has four entries', () => {
  assert.equal(PARTE_CUES.length, 4);
  assert.equal(PARTE_CUES[3].year, 1978);
});
