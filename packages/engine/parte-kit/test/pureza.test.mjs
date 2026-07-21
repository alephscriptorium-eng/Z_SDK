import test from 'node:test';
import assert from 'node:assert/strict';
import { redactarParte } from '../src/redactar.mjs';
import { estadoVacio } from '../src/tipos.mjs';
import { fixture50 } from './fixtures.mjs';

test('pureza: 2× mismo estado+deltas → deep-equal parte y estado', () => {
  const { estado0, deltas } = fixture50();
  const a = redactarParte(estado0, deltas);
  const b = redactarParte(estado0, deltas);
  assert.deepEqual(a.parte, b.parte);
  assert.deepEqual(a.estado, b.estado);
});

test('pureza: estadoAnterior no se muta', () => {
  const prev = {
    tick: 1,
    barrios: { A: { estado: 'vivo', gentesActivas: 2 } }
  };
  const freeze = JSON.stringify(prev);
  redactarParte(prev, [
    { type: 'tick', tick: 2 },
    { type: 'barrio', id: 'A', estado: 'latente', gentesActivas: 0 }
  ]);
  assert.equal(JSON.stringify(prev), freeze);
});

test('pureza: estado vacío estable', () => {
  const e = estadoVacio();
  const a = redactarParte(e, []);
  const b = redactarParte(e, []);
  assert.deepEqual(a.parte, b.parte);
});
