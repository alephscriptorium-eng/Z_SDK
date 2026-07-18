import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  ABSTRACT_TO_WIRE,
  WIRE_TO_ABSTRACT,
  createWireMessage,
  abstractMessageToWire,
  SignalingService,
  SocketRoomSignalingService
} from '../src/index.mjs';

function freshCard(sessionId = 'alice') {
  return makePeerCard({
    roomId: 'R1',
    endpoint: 'http://test.local/runtime',
    token: `tok-${sessionId}`,
    scopes: [roleScope('player')],
    expiresAt: Date.now() + 60_000,
    sessionId,
    displayName: sessionId
  });
}

test('wire contract maps abstract ↔ webrtc-* events (repo A)', () => {
  assert.equal(ABSTRACT_TO_WIRE.offer, 'webrtc-offer');
  assert.equal(ABSTRACT_TO_WIRE.answer, 'webrtc-answer');
  assert.equal(ABSTRACT_TO_WIRE['ice-candidate'], 'webrtc-ice-candidate');
  assert.equal(ABSTRACT_TO_WIRE['room-join'], 'join-room');
  assert.equal(WIRE_TO_ABSTRACT['webrtc-offer'], 'offer');
});

test('abstractMessageToWire builds ROOM_MESSAGE payload with peerCard', () => {
  const card = freshCard();
  const { wireType, payload } = abstractMessageToWire({
    type: 'offer',
    from: 'alice',
    to: 'bob',
    roomId: 'R1',
    timestamp: 1,
    messageId: 'm1',
    offer: { type: 'offer', sdp: 'v=0' },
    peerCard: card
  });
  assert.equal(wireType, 'webrtc-offer');
  assert.equal(payload.from, 'alice');
  assert.equal(payload.to, 'bob');
  assert.equal(payload.room, 'R1');
  assert.deepEqual(payload.data, { type: 'offer', sdp: 'v=0' });
  assert.equal(payload.peerCard, card);
});

test('SignalingService helpers emit abstract types via sendMessage', async () => {
  const sent = [];
  class Stub extends SignalingService {
    async sendMessage(message) {
      sent.push(message);
    }
  }
  const s = new Stub();
  s.userId = 'alice';
  s.roomId = 'R1';
  s.setPeerCard(freshCard());
  await s.sendOffer('bob', { type: 'offer', sdp: 'x' });
  await s.sendIceCandidate('bob', { candidate: 'cand' });
  assert.equal(sent[0].type, 'offer');
  assert.equal(sent[1].type, 'ice-candidate');
  assert.equal(sent[1].candidate.candidate, 'cand');
  assert.ok(sent[0].peerCard);
});

test('SocketRoomSignalingService filters self and wrong target; accepts peerCard', () => {
  const svc = new SocketRoomSignalingService({ client: { io: new EventEmitter() } });
  svc.userId = 'alice';
  svc.roomId = 'R1';
  svc.handleConnectionChange(true);
  svc.setPeerCard(freshCard('alice'));

  const seen = [];
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'alice',
    to: 'bob',
    room: 'R1',
    data: { type: 'offer', sdp: 'self' },
    peerCard: freshCard('alice')
  });
  assert.equal(seen.length, 0);

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'carol',
    room: 'R1',
    data: { type: 'offer', sdp: 'other' },
    peerCard: freshCard('bob')
  });
  assert.equal(seen.length, 0);

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'alice',
    room: 'R1',
    data: { type: 'offer', sdp: 'ok' },
    peerCard: freshCard('bob')
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].type, 'offer');
  assert.equal(seen[0].offer.sdp, 'ok');
  assert.ok(seen[0].peerCard);
});

test('createWireMessage includes timestamp and messageId', () => {
  const card = freshCard();
  const m = createWireMessage({
    type: 'join-room',
    from: 'alice',
    room: 'R1',
    data: { peerCard: card, roomId: 'R1' },
    extra: { peerCard: card }
  });
  assert.equal(m.type, 'join-room');
  assert.ok(m.timestamp);
  assert.ok(String(m.messageId).includes('alice'));
  assert.equal(m.peerCard, card);
  assert.equal(m.data.peerId, undefined);
});
