import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope, ssbIdFromPublicKeyBytes } from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard
} from '@zeus/protocol/peer-card-seat';
import { crearReparto, actorDeCard, puede, evaluarPermiso, MOTIVOS } from '../src/index.mjs';

const NOW = 1_700_000_000_000;
const otroSsb = (seed) => ssbIdFromPublicKeyBytes(Buffer.alloc(32, seed));

function baseCard(ssbId) {
  return makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    issuedAt: NOW,
    expiresAt: NOW + 3_600_000,
    ssbId
  });
}

/**
 * La identidad del actor es la de la peer-card/seat EXISTENTE: se firma un
 * asiento viajero con `@zeus/protocol/peer-card-seat`, y el mismo `ssbId`
 * derivado de esa clave es el `actorSsbId` del reparto. Cero identidad paralela.
 */
test('identidad: el actor del reparto es el ssbId de la peer-card/seat firmada', () => {
  const seat = generateSeatKeyPair();
  const base = makePeerCard({
    roomId: 'sala',
    endpoint: 'https://endpoint.example',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    issuedAt: NOW,
    expiresAt: NOW + 3_600_000,
    ssbId: seat.ssbId
  });
  const firmada = signTravelingPeerCard(base, seat.privateKey, seat.ssbId);

  // El asiento verifica con el protocolo existente (no lo reimplementa el kit).
  assert.deepEqual(verifyTravelingPeerCard(firmada), { ok: true });

  // La identidad de dominio == ssbId de la card; no hay id nuevo.
  assert.equal(actorDeCard(firmada), seat.ssbId);

  const reparto = crearReparto({
    personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'protagonista' }],
    asignaciones: [{ actorSsbId: seat.ssbId, personajeId: 'pj-1' }],
    politica: { protagonista: ['reparto:interpretar'] }
  });
  assert.equal(puede(reparto, firmada, 'pj-1', 'reparto:interpretar', NOW), true);
});

test('identidad: actorDeCard rechaza ausencia o forma inválida de ssbId', () => {
  assert.equal(actorDeCard(null), null);
  assert.equal(actorDeCard({}), null);
  assert.equal(actorDeCard({ ssbId: 'actor-inventado' }), null);
});

test('adversarial: ssbId manipulado post-firma NO verifica → seat_invalido (no concedido)', () => {
  const seat = generateSeatKeyPair();
  const firmada = signTravelingPeerCard(baseCard(seat.ssbId), seat.privateKey, seat.ssbId);

  // Manipular el ssbId tras firmar a otro ssbId de forma válida (regex ok) que
  // ADEMÁS está asignado al personaje: sin verificación de asiento se colaría.
  const ssbIntruso = otroSsb(0x9e);
  const tampered = { ...firmada, ssbId: ssbIntruso };

  // El propio protocol delata la manipulación:
  const v = verifyTravelingPeerCard(tampered);
  assert.equal(v.ok, false);
  assert.equal(v.error, 'seatSignature mismatch');

  const reparto = crearReparto({
    personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'protagonista' }],
    asignaciones: [{ actorSsbId: ssbIntruso, personajeId: 'pj-1' }],
    politica: { protagonista: ['reparto:interpretar'] }
  });

  const d = evaluarPermiso(reparto, tampered, { personajeId: 'pj-1', permiso: 'reparto:interpretar', now: NOW });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.SEAT_INVALIDO);
  assert.equal(d.seatError, 'seatSignature mismatch');
  assert.equal(puede(reparto, tampered, 'pj-1', 'reparto:interpretar', NOW), false);
});

test('seat ausente: card sin seatSignature = comportamiento documentado (acepta; exigirSeat lo deniega)', () => {
  const ssbId = otroSsb(0x11);
  const card = baseCard(ssbId); // sin seatSignature
  const reparto = crearReparto({
    personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'protagonista' }],
    asignaciones: [{ actorSsbId: ssbId, personajeId: 'pj-1' }],
    politica: { protagonista: ['reparto:leer'] }
  });

  // Por defecto: identidad no acreditada por asiento pero se acepta (llamador responsable).
  assert.equal(puede(reparto, card, 'pj-1', 'reparto:leer', NOW), true);

  // Frontera opt-in: exigirSeat deniega la ausencia de asiento.
  const d = evaluarPermiso(reparto, card, {
    personajeId: 'pj-1',
    permiso: 'reparto:leer',
    now: NOW,
    exigirSeat: true
  });
  assert.equal(d.ok, false);
  assert.equal(d.motivo, MOTIVOS.SEAT_AUSENTE);
  assert.equal(puede(reparto, card, 'pj-1', 'reparto:leer', { now: NOW, exigirSeat: true }), false);
});
