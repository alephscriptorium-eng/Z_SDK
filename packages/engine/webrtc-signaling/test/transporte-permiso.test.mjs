/**
 * WP-U186 · U93-bis — transporte ≠ permiso.
 *
 * Invariante (frontera confirmada en
 * plan/REPORTES/U186-paso0-frontera-room-join.md):
 *   - CA1: sin card, el transporte base conecta — sesión anónima `role:null`.
 *   - CA2: card válida concede EN LA ACCIÓN (antesala WebRTC = opt-in).
 *   - CA3: card inválida RECHAZA — jamás degrada a anónimo (caso clave).
 *   - CA4: acción sin rol denegada con el cable intacto.
 *   - Caso rojo (ausencia): sin card ⇒ transporte sí + acción no;
 *     firma exigida y no aportada ⇒ deniega (no trata como anónimo).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { assertSignalingPeerCard } from '../src/peer-card-gate.mjs';
import { SocketRoomSignalingService } from '../src/socket-room-signaling.mjs';

function freshCard(sessionId = 'alice', overrides = {}) {
  return makePeerCard({
    roomId: 'R1',
    endpoint: 'http://test.local/runtime',
    token: `tok-${sessionId}`,
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId,
    displayName: sessionId,
    ...overrides
  });
}

/**
 * Cliente falso compatible con connectAndJoin (@zeus/rooms) y
 * emitRoomEvent: registra CLIENT_REGISTER / CLIENT_SUSCRIBE / ROOM_MESSAGE
 * sin abrir red.
 */
function fakeClient() {
  const io = new EventEmitter();
  io.id = 'sock-test';
  io.connected = false;
  /** @type {Array<{ event: string, args: unknown[] }>} */
  const emitted = [];
  const realEmit = io.emit.bind(io);
  io.emit = (event, ...args) => {
    emitted.push({ event, args });
    return realEmit(event, ...args);
  };
  io.connect = () => {
    io.connected = true;
    // 'connect' se difiere: connectAndJoin registra el listener tras llamar
    queueMicrotask(() => realEmit('connect'));
  };
  io.disconnect = () => {
    io.connected = false;
  };
  /** @type {Array<{ event: string, data: any, room: string }>} */
  const roomCalls = [];
  return {
    io,
    emitted,
    roomCalls,
    room(event, data, room) {
      roomCalls.push({ event, data, room });
    }
  };
}

function service(client, extra = {}) {
  return new SocketRoomSignalingService({ client, room: 'R1', ...extra });
}

// ─── CA1 · sin card conecta al transporte base (sesión anónima role:null) ───

test('CA1: sin card el transporte base conecta y la sesión es anónima role:null', async () => {
  const client = fakeClient();
  const svc = service(client);

  await svc.connect('anon-1');

  assert.equal(svc.isConnected(), true);
  assert.equal(svc.getPeerCard(), null);
  assert.equal(svc.getSessionRole(), null);

  const reg = client.emitted.find((e) => e.event === 'CLIENT_REGISTER');
  assert.ok(reg, 'CLIENT_REGISTER emitido sin exigir card');
  assert.equal(reg.args[0].usuario, 'anon-1');
  assert.equal(reg.args[0].peerCard, undefined, 'registro sin card: anónimo');

  const sub = client.emitted.find((e) => e.event === 'CLIENT_SUSCRIBE');
  assert.ok(sub, 'CLIENT_SUSCRIBE emitido: membresía de sala genérica sin torno');
  assert.equal(sub.args[0].room, 'R1');
});

// ─── CA2 · card válida concede EN LA ACCIÓN ───

test('CA2: card válida concede en la acción (antesala) — no antes', async () => {
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('alice');

  // Antes de la acción: anónimo pleno sobre transporte vivo
  assert.equal(svc.getSessionRole(), null);

  // La acción de antesala presenta la card; ahí se concede el rol
  await svc.joinRoom('R1', freshCard('alice'));
  assert.equal(svc.getSessionRole(), 'player');

  const announce = client.roomCalls.find((c) => c.event === 'join-room');
  assert.ok(announce, 'anuncio de antesala emitido');
  assert.ok(announce.data.peerCard, 'el anuncio viaja con la card');

  await svc.sendOffer('bob', { type: 'offer', sdp: 'x' });
  const offer = client.roomCalls.find((c) => c.event === 'webrtc-offer');
  assert.ok(offer, 'offer emitida con card válida');
  assert.ok(offer.data.peerCard, 'la card acompaña la acción gated');
});

test('CA2b: card válida presentada en connect viaja en CLIENT_REGISTER', async () => {
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('alice', { peerCard: freshCard('alice') });

  assert.equal(svc.isConnected(), true);
  assert.equal(svc.getSessionRole(), 'player');
  const reg = client.emitted.find((e) => e.event === 'CLIENT_REGISTER');
  assert.ok(reg.args[0].peerCard, 'card válida reenviada en el registro');
});

// ─── CA3 · card inválida RECHAZA, no degrada a anónimo (caso clave) ───

test('CA3: card inválida en connect rechaza — sin sesión, sin degradar a anónimo', async () => {
  const client = fakeClient();
  const svc = service(client);
  const expired = freshCard('mallory', { expiresAt: Date.now() - 1 });

  await assert.rejects(() => svc.connect('mallory', { peerCard: expired }), /expired/);

  // NO hay sesión anónima encubierta: el cable ni se abrió
  assert.equal(svc.isConnected(), false, 'rechazo total: no conectado');
  assert.equal(svc.getPeerCard(), null, 'la card inválida no se adopta');
  assert.equal(svc.getSessionRole(), null);
  assert.equal(
    client.emitted.find((e) => e.event === 'CLIENT_REGISTER'),
    undefined,
    'sin CLIENT_REGISTER: no se degradó a registro anónimo'
  );
  assert.equal(client.io.connected, false, 'socket sin abrir');
});

test('CA3b: card inválida en joinRoom rechaza y no deja al anónimo dentro de la antesala', async () => {
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('mallory');
  const roomCallsBefore = client.roomCalls.length;
  const subsBefore = client.emitted.filter((e) => e.event === 'CLIENT_SUSCRIBE').length;

  await assert.rejects(
    () => svc.joinRoom('R1', { not: 'a-card' }),
    /missing or malformed/
  );

  assert.equal(svc.getPeerCard(), null, 'no se adopta card inválida');
  assert.equal(svc.getSessionRole(), null);
  assert.equal(svc.getRoomId(), '', 'no quedó unido a la antesala como anónimo');
  assert.equal(client.roomCalls.length, roomCallsBefore, 'sin anuncio join-room');
  assert.equal(
    client.emitted.filter((e) => e.event === 'CLIENT_SUSCRIBE').length,
    subsBefore,
    'sin CLIENT_SUSCRIBE de antesala tras el rechazo'
  );
  // ... y el transporte base sigue vivo (rechazo ≠ desconexión)
  assert.equal(svc.isConnected(), true);
});

test('CA3c: mensaje entrante con card inválida se rechaza, no se procesa como anónimo', async () => {
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('alice');

  const errors = [];
  const seen = [];
  svc.on('error', (e) => errors.push(e));
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'alice',
    room: 'R1',
    data: { type: 'offer', sdp: 'x' },
    peerCard: freshCard('bob', { expiresAt: Date.now() - 1 })
  });

  assert.equal(seen.length, 0, 'no se entrega: rechazado, no degradado');
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /expired/);
  assert.equal(svc.isConnected(), true, 'el rechazo no corta el cable');
});

// ─── CA4 · acción sin rol denegada con el cable intacto ───

test('CA4: acción gated sin rol se deniega y el transporte sigue intacto', async () => {
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('anon-1');

  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/
  );
  await assert.rejects(
    () => svc.sendMessage({
      type: 'room-join',
      from: 'anon-1',
      roomId: 'R1',
      timestamp: Date.now(),
      messageId: 'm-anon'
    }),
    /peer-card required/
  );

  // Cable intacto tras cada denegación:
  assert.equal(svc.isConnected(), true);
  assert.equal(client.io.connected, true);

  // Lo no-gated sigue fluyendo por el mismo cable (transporte ≠ permiso)
  const seen = [];
  svc.on('message', (m) => seen.push(m));
  svc._onWirePayload('peer-disconnected', {
    from: 'bob',
    room: 'R1',
    data: { peerId: 'bob' }
  });
  assert.equal(seen.length, 1, 'evento no-gated entregado al anónimo');
  assert.equal(seen[0].type, 'peer-disconnected');
});

// ─── Caso rojo (contrarrevisión: probar la AUSENCIA, clase hostil-omite) ───

test('caso rojo: ausencia de card ⇒ transporte sí, acción no; firma exigida no aportada ⇒ deniega', async () => {
  // (i) AUSENCIA de card: el transporte admite, la acción deniega.
  const client = fakeClient();
  const svc = service(client);
  await svc.connect('anon-red');
  assert.equal(svc.isConnected(), true, 'ausencia de card NO cierra el transporte');
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/,
    'ausencia de card SÍ deniega la acción gated'
  );

  // (ii) AUSENCIA de firma cuando se exige: deniega, no trata como anónimo.
  const unsigned = freshCard('carol'); // con rol, fresca, SIN seatSignature
  const direct = assertSignalingPeerCard(unsigned, { requireSeatSignature: true });
  assert.equal(direct.ok, false);
  assert.match(direct.error, /seat signature missing/);

  const strict = service(fakeClient(), { requireSeatSignature: true });
  await assert.rejects(
    () => strict.connect('carol', { peerCard: unsigned }),
    /seat signature missing/,
    'firma no aportada = rechazo del connect con card'
  );
  assert.equal(strict.isConnected(), false, 'no degrada a sesión anónima');
  assert.equal(strict.getPeerCard(), null);
  assert.equal(strict.getSessionRole(), null);
});
