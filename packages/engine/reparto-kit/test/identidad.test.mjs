import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard
} from '@zeus/protocol/peer-card-seat';
import { crearReparto, actorDeCard, puede } from '../src/index.mjs';

const NOW = 1_700_000_000_000;

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
