import test from 'node:test';
import assert from 'node:assert/strict';
import { redactarParte } from '../src/redactar.mjs';
import { validarParte } from '../src/validar.mjs';
import { intentarPublicarParte } from '../src/publicar.mjs';
import { LEDGER_PARTE, LEDGER_PARTE_RECHAZADO } from '../src/tipos.mjs';
import { fixture50 } from './fixtures.mjs';

/** Patrón método (fragmentado — el blob del test no debe hostear los tokens). */
const PATRON_METODO = [
  'SCRIPT' + '_SDK',
  'HOL' + 'ONES',
  'hol' + '\u00f3n',
  'ho' + 'lar' + 'qu' + '\u00eda',
  'jun' + 'tura',
  'swarm' + '-orquestacion',
  'BACK' + 'LOG',
  'orquest' + 'ador'
].join('|');

const TOKEN_HOL = 'HOL' + 'ONES';

test('ceguera: delta envenenado → validarParte.ok === false y sin publicación parte', () => {
  const { estado0, deltas } = fixture50();
  // Id envenenado entra siempre en barrios/pendientes (titulares máx 5 pueden
  // descartar un work-texto; el id del barrio no se omite).
  const poisonId = 'fuga-' + TOKEN_HOL + '-x';
  const poisoned = [
    ...deltas,
    {
      type: 'barrio',
      id: poisonId,
      estado: 'latente',
      gentesActivas: 0
    }
  ];
  const { parte } = redactarParte(estado0, poisoned);
  const gate = validarParte(parte, PATRON_METODO);
  assert.equal(gate.ok, false);
  assert.ok(gate.matches.length >= 1);
  assert.ok(gate.matches.some((m) => m.includes(TOKEN_HOL)));

  const published = [];
  const result = intentarPublicarParte(parte, PATRON_METODO, {
    game: 'demo',
    ts: 1,
    seq: 1,
    publish(event, payload) {
      published.push({ event, payload });
    }
  });
  assert.equal(result.published, false);
  assert.equal(result.ok, false);
  assert.equal(published.length, 1);
  assert.equal(published[0].payload.entryKind, LEDGER_PARTE_RECHAZADO);
  assert.notEqual(published[0].payload.entryKind, LEDGER_PARTE);
});

test('ceguera: parte limpio → publica entryKind parte', () => {
  const { estado0, deltas } = fixture50();
  const { parte } = redactarParte(estado0, deltas);
  const gate = validarParte(parte, PATRON_METODO);
  assert.equal(gate.ok, true);

  const published = [];
  const result = intentarPublicarParte(parte, PATRON_METODO, {
    game: 'demo',
    ts: 2,
    seq: 2,
    publish(event, payload) {
      published.push({ event, payload });
    }
  });
  assert.equal(result.published, true);
  assert.equal(published[0].payload.entryKind, LEDGER_PARTE);
});

test('ceguera: sin patrón → ok false (fail-safe)', () => {
  const { estado0, deltas } = fixture50();
  const { parte } = redactarParte(estado0, deltas);
  const gate = validarParte(parte, undefined);
  assert.equal(gate.ok, false);
  assert.deepEqual(gate.matches, ['CEGUERA_PATTERN_undefined']);
});
