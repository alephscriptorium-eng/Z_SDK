import test from 'node:test';
import assert from 'node:assert/strict';
import { validarActa } from '../src/validar.mjs';
import { intentarPublicarActa } from '../src/publicar.mjs';
import { LEDGER_ACTA, LEDGER_ACTA_RECHAZADA } from '../src/tipos.mjs';
import { emitirActa } from '../src/emitir.mjs';
import { huellaLedger } from '../src/huella.mjs';
import { actaLimpia } from './fixtures.mjs';

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

test('ceguera: acta envenenada → ok false y entryKind acta_rechazada', () => {
  const poison = emitirActa({
    barrioId: 'fuga-' + TOKEN_HOL + '-x',
    estado: 'latente',
    resumen: 'limpio',
    pendientes: [],
    ultimaClase: 'visitante',
    tickEmision: 1,
    huellaLedger: huellaLedger({ seq: 1 })
  });
  const gate = validarActa(poison, PATRON_METODO);
  assert.equal(gate.ok, false);
  assert.ok(gate.matches.some((m) => m.includes(TOKEN_HOL)));

  const published = [];
  const result = intentarPublicarActa(poison, PATRON_METODO, {
    game: 'demo',
    ts: 1,
    publish(event, payload) {
      published.push({ event, payload });
    }
  });
  assert.equal(result.published, false);
  assert.equal(published[0].payload.entryKind, LEDGER_ACTA_RECHAZADA);
});

test('ceguera: acta limpia → publica entryKind acta', () => {
  const acta = actaLimpia();
  const published = [];
  const result = intentarPublicarActa(acta, PATRON_METODO, {
    game: 'demo',
    ts: 2,
    publish(event, payload) {
      published.push({ event, payload });
    }
  });
  assert.equal(result.ok, true);
  assert.equal(published[0].payload.entryKind, LEDGER_ACTA);
});

test('ceguera: sin patrón → fail-safe', () => {
  const acta = actaLimpia();
  const gate = validarActa(acta, undefined);
  assert.equal(gate.ok, false);
  assert.deepEqual(gate.matches, ['CEGUERA_PATTERN_undefined']);
});
