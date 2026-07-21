/**
 * Campanas — clasificación de titulares → clases sonoras.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  claseTitular,
  campanasDesdeParte,
  campanasPlantillasOk,
  CLASES_CAMPANA,
  redactarParte,
  estadoVacio,
  PLANTILLAS,
  applyPlantilla
} from '../src/index.mjs';

test('campanasPlantillasOk — marcas alineadas a plantillas', () => {
  assert.equal(campanasPlantillasOk(), true);
});

test('claseTitular mapea las tres clases y silencia el resto', () => {
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.SUBIO, { id: 'plaza' })), 'despertar');
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.BAJO, { id: 'plaza' })), 'degradar');
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.ROTO, { id: 'plaza' })), 'roto');
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.LATENTE, { id: 'a' })), 'degradar');
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.MUERTO, { id: 'a' })), 'degradar');
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.IGUAL_VIVO, { id: 'a' })), null);
  assert.equal(claseTitular(applyPlantilla(PLANTILLAS.CENSO, { vivos: 1, latentes: 0, muertos: 0, rotos: 0 })), null);
  assert.equal(claseTitular('obra-1-plaza'), null);
  assert.equal(claseTitular(''), null);
  assert.equal(claseTitular(/** @type {any} */ (null)), null);
});

test('campanasDesdeParte — un evento por clase presente (orden fijo)', () => {
  assert.deepEqual(CLASES_CAMPANA, ['despertar', 'degradar', 'roto']);

  const { parte } = redactarParte(estadoVacio(), [
    { type: 'tick', tick: 1 },
    { type: 'barrio', id: 'a', estado: 'vivo', gentesActivas: 2 },
    { type: 'barrio', id: 'b', estado: 'roto', gentesActivas: 0 },
    { type: 'barrio', id: 'c', estado: 'latente', gentesActivas: 0 },
  ]);

  // a = vivo+subio → despertar; b = roto; c = latente → degradar
  const events = campanasDesdeParte(parte);
  assert.deepEqual(
    events.map((e) => e.clase),
    ['despertar', 'degradar', 'roto'],
  );
  assert.ok(events.every((e) => typeof e.titular === 'string' && e.titular.length > 0));

  // Solo censo → vacío
  const empty = campanasDesdeParte({
    version: 'parte/1',
    tick: 0,
    censo: { vivos: 0, latentes: 0, muertos: 0, rotos: 0 },
    barrios: [],
    titulares: [applyPlantilla(PLANTILLAS.CENSO, { vivos: 0, latentes: 0, muertos: 0, rotos: 0 })],
    pendientes: [],
  });
  assert.deepEqual(empty, []);

  assert.deepEqual(campanasDesdeParte(null), []);
  assert.deepEqual(campanasDesdeParte({ version: 'x' }), []);
});
