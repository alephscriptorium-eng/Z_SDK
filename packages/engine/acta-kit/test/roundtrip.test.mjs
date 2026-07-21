import test from 'node:test';
import assert from 'node:assert/strict';
import { emitirActa } from '../src/emitir.mjs';
import { huellaLedger } from '../src/huella.mjs';
import { isActaDeBarrioShaped, ACTA_VERSION, RESUMEN_MAX } from '../src/tipos.mjs';
import { intentarPublicarActa } from '../src/publicar.mjs';
import { adoptarActaDesdePlaza } from '../src/adoptar.mjs';
import { LEDGER_ACTA } from '../src/tipos.mjs';
import { actaLimpia } from './fixtures.mjs';

/** Patrón método (fragmentado). */
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

test('contrato: ActaDeBarrio v1 shape literal + resumen ≤400', () => {
  const acta = actaLimpia();
  assert.equal(acta.version, ACTA_VERSION);
  assert.equal(isActaDeBarrioShaped(acta), true);
  assert.ok(acta.resumen.length <= RESUMEN_MAX);

  assert.throws(
    () =>
      emitirActa({
        barrioId: 'x',
        estado: 'vivo',
        resumen: 'x'.repeat(RESUMEN_MAX + 1),
        pendientes: [],
        ultimaClase: 'visitante',
        tickEmision: 1,
        huellaLedger: 'abc'
      }),
    /resumen_excede_400/
  );
});

test('round-trip: emitir → publicar plaza → adoptar por barrioId', () => {
  const acta = actaLimpia({ barrioId: 'scriptorium-plaza' });
  const plaza = [];
  const pub = intentarPublicarActa(acta, PATRON_METODO, {
    game: 'ciudad',
    ts: 10,
    seq: 3,
    publish(event, payload) {
      plaza.push({ event, payload });
    }
  });
  assert.equal(pub.published, true);
  assert.equal(plaza[0].payload.entryKind, LEDGER_ACTA);

  const adopt = adoptarActaDesdePlaza(plaza, 'scriptorium-plaza');
  assert.equal(adopt.ok, true);
  assert.deepEqual(adopt.acta, acta);

  const missing = adoptarActaDesdePlaza(plaza, 'otro-barrio');
  assert.equal(missing.ok, true);
  assert.equal(missing.acta, null);
});

test('pureza: mismo input → misma acta (huella inyectada)', () => {
  const h = huellaLedger({ kind: 'sleep', barrioId: 'a', seq: 9 });
  const input = {
    barrioId: 'a',
    estado: 'latente',
    resumen: 'ok',
    pendientes: ['t'],
    ultimaClase: 'residente',
    tickEmision: 4,
    huellaLedger: h
  };
  assert.deepEqual(emitirActa(input), emitirActa(input));
});
