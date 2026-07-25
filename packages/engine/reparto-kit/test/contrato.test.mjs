import test from 'node:test';
import assert from 'node:assert/strict';
import { ssbIdFromPublicKeyBytes } from '@zeus/protocol';
import {
  REPARTO_VERSION,
  PERMISOS,
  crearReparto,
  repartoVacio,
  isRepartoShaped,
  isPersonajeShaped,
  isAsignacionShaped
} from '../src/index.mjs';

const ssb = (seed) => ssbIdFromPublicKeyBytes(Buffer.alloc(32, seed));

test('contrato: version congelada reparto/1 y catálogo de permisos', () => {
  assert.equal(REPARTO_VERSION, 'reparto/1');
  assert.deepEqual([...PERMISOS], ['reparto:leer', 'reparto:interpretar', 'reparto:dirigir']);
  assert.ok(Object.isFrozen(PERMISOS));
});

test('contrato: repartoVacio() está bien formado', () => {
  const r = repartoVacio();
  assert.equal(r.version, REPARTO_VERSION);
  assert.ok(isRepartoShaped(r));
});

test('contrato: crearReparto valida, referencia y congela', () => {
  const r = crearReparto({
    personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'protagonista' }],
    asignaciones: [{ actorSsbId: ssb(1), personajeId: 'pj-1' }],
    politica: { protagonista: ['reparto:leer', 'reparto:interpretar'] }
  });
  assert.ok(isRepartoShaped(r));
  assert.ok(Object.isFrozen(r));
  assert.ok(Object.isFrozen(r.personajes));
  assert.ok(Object.isFrozen(r.asignaciones));
});

test('contrato: guards rechazan shapes inválidos', () => {
  assert.equal(isPersonajeShaped({ id: 'x', nombre: 'X' }), false); // falta rol
  assert.equal(isAsignacionShaped({ actorSsbId: 'no-ssb', personajeId: 'p' }), false);
  assert.equal(isAsignacionShaped({ actorSsbId: ssb(1), personajeId: 'p' }), true);
  assert.equal(isRepartoShaped({ version: 'reparto/2', personajes: [], asignaciones: [], politica: {} }), false);
});

test('contrato: crearReparto rechaza actorSsbId no-ssb (cero identidad paralela)', () => {
  assert.throws(
    () =>
      crearReparto({
        personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'r' }],
        asignaciones: [{ actorSsbId: 'actor-inventado-1', personajeId: 'pj-1' }]
      }),
    /actorSsbId debe ser ssbId/
  );
});

test('contrato: crearReparto rechaza asignacion a personaje inexistente', () => {
  assert.throws(
    () => crearReparto({ personajes: [], asignaciones: [{ actorSsbId: ssb(1), personajeId: 'fantasma' }] }),
    /personaje inexistente/
  );
});

test('contrato: crearReparto rechaza asignacion duplicada actor↔personaje (OBS-2)', () => {
  assert.throws(
    () =>
      crearReparto({
        personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'r' }],
        asignaciones: [
          { actorSsbId: ssb(7), personajeId: 'pj-1' },
          { actorSsbId: ssb(7), personajeId: 'pj-1' }
        ]
      }),
    /asignacion duplicada/
  );
});

test('contrato: crearReparto rechaza permiso fuera de catálogo', () => {
  assert.throws(
    () =>
      crearReparto({
        personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'r' }],
        politica: { r: ['reparto:borrar-todo'] }
      }),
    /permiso desconocido/
  );
});
