/**
 * WP-U197 · gemelo de navegador del signaling anónimo.
 *
 * `BrowserSocketSignalingService` habla el MISMO contrato de cable que
 * `SocketRoomSignalingService` (U88). Si sólo el carril Node admitiera
 * anónimos, «signaling sin card» sería falso en el navegador. Aquí se
 * prueba la paridad y, sobre todo, que la paridad NO incluye permisos.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { assertSignalingPeerCard } from '@zeus/webrtc-signaling/peer-card-gate';
import { BrowserSocketSignalingService } from '../src/browser/browser-signaling.mjs';

const ROOM = 'R1';

function freshCard(sessionId = 'alice', overrides = {}) {
  return makePeerCard({
    roomId: ROOM,
    endpoint: 'http://test.local/runtime',
    token: `tok-${sessionId}`,
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId,
    displayName: sessionId,
    ...overrides
  });
}

/** Cliente de sala falso: registra lo emitido sin abrir red. */
function fakeClient() {
  const emitted = [];
  const socketEmitted = [];
  return {
    emitted,
    socketEmitted,
    emit(event, payload) {
      emitted.push({ event, payload: JSON.parse(JSON.stringify(payload)) });
    },
    getSocket() {
      return {
        emit(event, payload) {
          socketEmitted.push({ event, payload });
        }
      };
    },
    onRoomEvent() {
      return () => {};
    },
    disconnect() {}
  };
}

/** Servicio ya «conectado» (el transporte no es lo que se prueba aquí). */
function service(config = {}) {
  const svc = new BrowserSocketSignalingService({ scriptoriumUrl: 'http://x', ...config });
  const client = fakeClient();
  svc._client = client;
  svc._connected = true;
  svc.userId = config.userId ?? 'alice';
  return { svc, client };
}

test('U197: el navegador admite antesala anónima — offer/answer/ICE sin card', async () => {
  const { svc, client } = service({ admission: 'anonymous' });
  assert.equal(svc.getAdmission(), 'anonymous');

  await svc.joinRoom(ROOM);
  await svc.sendOffer('bob', { type: 'offer', sdp: 'x' });
  await svc.sendAnswer('bob', { type: 'answer', sdp: 'y' });
  await svc.sendIceCandidate('bob', { candidate: 'c' });

  assert.equal(client.emitted.length, 4, 'los 4 tipos gated salieron');
  for (const { event, payload } of client.emitted) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(payload, 'peerCard'),
      false,
      `${event}: sin card en el cable`
    );
    if (payload.data && typeof payload.data === 'object') {
      assert.equal(
        Object.prototype.hasOwnProperty.call(payload.data, 'peerCard'),
        false,
        `${event}: sin card oculta en data`
      );
    }
  }
  assert.equal(svc.isAnonymous(), true);
  assert.equal(svc.getPeerCard(), null);
});

test('U197: el defecto del navegador NO cambió — sin modo declarado exige card', async () => {
  const { svc } = service();
  assert.equal(svc.getAdmission(), 'peer-card');
  await assert.rejects(() => svc.joinRoom(ROOM), /missing or malformed/);
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/
  );
});

test('U197: card presentada e inválida RECHAZA también en modo anónimo', async () => {
  const { svc } = service({ admission: 'anonymous' });
  await assert.rejects(
    () => svc.joinRoom(ROOM, freshCard('mallory', { expiresAt: Date.now() - 1 })),
    /expired/
  );
  assert.equal(svc.getPeerCard(), null, 'no se adopta card inválida');
  assert.equal(svc.getRoomId(), '', 'no entró a la antesala ni como anónimo');
});

test('U197: el anónimo del navegador tampoco sale con permisos', async () => {
  const { svc } = service({ admission: 'anonymous' });
  await svc.joinRoom(ROOM);
  await svc.sendOffer('bob', { type: 'offer', sdp: 'x' });

  // El portero que consumen terceros no se movió (mismo torno U186).
  const torno = assertSignalingPeerCard(svc.getPeerCard());
  assert.equal(torno.ok, false);
  assert.match(torno.error, /missing or malformed/);
});

test('U197: declararse anónimo por el cable no abre la antesala estricta', () => {
  const { svc } = service();
  const errors = [];
  const seen = [];
  svc.on('error', (e) => errors.push(e));
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'mallory',
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' },
    anonymous: true,
    admission: 'anonymous'
  });

  assert.equal(seen.length, 0, 'no se entrega');
  assert.match(errors[0].message, /peer-card rejected: peer-card missing or malformed/);
  assert.equal(svc.getAdmission(), 'peer-card', 'el modo local no se movió');
});

test('U197: claim de identidad sin card deniega también en el navegador', () => {
  const { svc } = service({ admission: 'anonymous' });
  const errors = [];
  const seen = [];
  svc.on('error', (e) => errors.push(e));
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'mallory',
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' },
    ssbId: '@Vt0zURlyOWvW6yQL9Q9nQNwFq+ykYCEBJvfDBrmTFPQ=.ed25519'
  });

  assert.equal(seen.length, 0);
  assert.match(errors[0].message, /unproven identity claim/);
});

test('U197: en modo anónimo el mensaje entrante llega sin card y marcado', () => {
  const { svc } = service({ admission: 'anonymous' });
  const seen = [];
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' }
  });

  assert.equal(seen.length, 1);
  assert.equal(seen[0].anonymous, true);
  assert.equal('peerCard' in seen[0], false);
});
