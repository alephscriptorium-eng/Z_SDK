import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, ssbIdFromPublicKeyBytes, roleScope } from '@zeus/protocol';
import { crearReparto, evaluarPermiso, puede, personajesDeActor, MOTIVOS } from '../src/index.mjs';

const NOW = 1_700_000_000_000;
const ssb = (seed) => ssbIdFromPublicKeyBytes(Buffer.alloc(32, seed));
const ACTOR_A = ssb(0xa1);
const ACTOR_B = ssb(0xb2);

/** Peer-card real de @zeus/protocol (identidad durable = ssbId). */
function card(ssbId, { role = 'player', now = NOW, ttlMs = 3_600_000, expiresAt } = {}) {
  return makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope(role), 'presence:join'],
    issuedAt: now,
    expiresAt: expiresAt ?? now + ttlMs,
    ssbId
  });
}

/** Reparto fijo: A interpreta protagonista + figurante; B no interpreta nada. */
function reparto() {
  return crearReparto({
    personajes: [
      { id: 'pj-prota', nombre: 'Protagonista', rol: 'protagonista' },
      { id: 'pj-fig', nombre: 'Figurante', rol: 'figurante' }
    ],
    asignaciones: [
      { actorSsbId: ACTOR_A, personajeId: 'pj-prota' },
      { actorSsbId: ACTOR_A, personajeId: 'pj-fig' }
    ],
    politica: {
      protagonista: ['reparto:leer', 'reparto:interpretar', 'reparto:dirigir'],
      figurante: ['reparto:leer']
    }
  });
}

test('permiso CONCEDIDO: actor con personaje en su reparto y rol que concede el permiso', () => {
  const d = evaluarPermiso(reparto(), card(ACTOR_A), {
    personajeId: 'pj-prota',
    permiso: 'reparto:interpretar',
    now: NOW
  });
  assert.equal(d.ok, true);
  assert.equal(d.motivo, MOTIVOS.CONCEDIDO);
  assert.equal(d.actorSsbId, ACTOR_A);
  assert.equal(d.rol, 'protagonista');
});

test('permiso DENEGADO por rol: mismo actor y personaje en reparto, pero el rol no concede el permiso', () => {
  const d = evaluarPermiso(reparto(), card(ACTOR_A), {
    personajeId: 'pj-fig',
    permiso: 'reparto:interpretar',
    now: NOW
  });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.ROL_SIN_PERMISO);
  // el figurante SÍ puede leer:
  assert.equal(puede(reparto(), card(ACTOR_A), 'pj-fig', 'reparto:leer', NOW), true);
});

test('permiso DENEGADO por actor SIN personaje en su reparto', () => {
  const d = evaluarPermiso(reparto(), card(ACTOR_B), {
    personajeId: 'pj-prota',
    permiso: 'reparto:leer',
    now: NOW
  });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.PERSONAJE_NO_EN_REPARTO);
});

test('permiso CONCEDIDO por actor CON personaje en su reparto (contraste del caso anterior)', () => {
  assert.equal(puede(reparto(), card(ACTOR_A), 'pj-prota', 'reparto:leer', NOW), true);
});

test('permiso DENEGADO: peer-card caducada → card_no_vigente', () => {
  const caducada = card(ACTOR_A, { expiresAt: NOW - 1 });
  const d = evaluarPermiso(reparto(), caducada, { personajeId: 'pj-prota', permiso: 'reparto:leer', now: NOW });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.CARD_NO_VIGENTE);
});

test('permiso DENEGADO: card fresca sin ssbId → identidad_ausente (cero identidad paralela)', () => {
  const sinId = makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    issuedAt: NOW,
    expiresAt: NOW + 3_600_000
  });
  const d = evaluarPermiso(reparto(), sinId, { personajeId: 'pj-prota', permiso: 'reparto:leer', now: NOW });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.IDENTIDAD_AUSENTE);
});

test('permiso DENEGADO: permiso o personaje desconocidos', () => {
  assert.equal(
    evaluarPermiso(reparto(), card(ACTOR_A), { personajeId: 'pj-prota', permiso: 'reparto:volar', now: NOW }).motivo,
    MOTIVOS.PERMISO_DESCONOCIDO
  );
  assert.equal(
    evaluarPermiso(reparto(), card(ACTOR_A), { personajeId: 'pj-fantasma', permiso: 'reparto:leer', now: NOW }).motivo,
    MOTIVOS.PERSONAJE_DESCONOCIDO
  );
});

test('relación 1 actor – N personajes vía asignaciones', () => {
  const pjs = personajesDeActor(reparto(), ACTOR_A);
  assert.deepEqual(pjs.map((p) => p.id).sort(), ['pj-fig', 'pj-prota']);
  assert.equal(personajesDeActor(reparto(), ACTOR_B).length, 0);
});
