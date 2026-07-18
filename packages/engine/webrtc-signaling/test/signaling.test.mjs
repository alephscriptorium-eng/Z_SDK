import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  ABSTRACT_TO_WIRE,
  WIRE_TO_ABSTRACT,
  createWireMessage,
  abstractMessageToWire,
  SignalingService,
  SocketRoomSignalingService
} from '../src/index.mjs';

test('wire contract maps abstract ↔ webrtc-* events (repo A)', () => {
  assert.equal(ABSTRACT_TO_WIRE.offer, 'webrtc-offer');
  assert.equal(ABSTRACT_TO_WIRE.answer, 'webrtc-answer');
  assert.equal(ABSTRACT_TO_WIRE['ice-candidate'], 'webrtc-ice-candidate');
  assert.equal(ABSTRACT_TO_WIRE['room-join'], 'join-room');
  assert.equal(WIRE_TO_ABSTRACT['webrtc-offer'], 'offer');
});

test('abstractMessageToWire builds ROOM_MESSAGE payload', () => {
  const { wireType, payload } = abstractMessageToWire({
    type: 'offer',
    from: 'alice',
    to: 'bob',
    roomId: 'R1',
    timestamp: 1,
    messageId: 'm1',
    offer: { type: 'offer', sdp: 'v=0' }
  });
  assert.equal(wireType, 'webrtc-offer');
  assert.equal(payload.from, 'alice');
  assert.equal(payload.to, 'bob');
  assert.equal(payload.room, 'R1');
  assert.deepEqual(payload.data, { type: 'offer', sdp: 'v=0' });
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
  await s.sendOffer('bob', { type: 'offer', sdp: 'x' });
  await s.sendIceCandidate('bob', { candidate: 'cand' });
  assert.equal(sent[0].type, 'offer');
  assert.equal(sent[1].type, 'ice-candidate');
  assert.equal(sent[1].candidate.candidate, 'cand');
});

test('SocketRoomSignalingService filters self and wrong target', () => {
  const svc = new SocketRoomSignalingService({ client: { io: new EventEmitter() } });
  svc.userId = 'alice';
  svc.roomId = 'R1';
  svc.handleConnectionChange(true);

  const seen = [];
  svc.on('message', (m) => seen.push(m));

  svc._onWirePayload('webrtc-offer', {
    from: 'alice',
    to: 'bob',
    room: 'R1',
    data: { type: 'offer', sdp: 'self' }
  });
  assert.equal(seen.length, 0);

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'carol',
    room: 'R1',
    data: { type: 'offer', sdp: 'other' }
  });
  assert.equal(seen.length, 0);

  svc._onWirePayload('webrtc-offer', {
    from: 'bob',
    to: 'alice',
    room: 'R1',
    data: { type: 'offer', sdp: 'ok' }
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].type, 'offer');
  assert.equal(seen[0].offer.sdp, 'ok');
});

test('createWireMessage includes timestamp and messageId', () => {
  const m = createWireMessage({
    type: 'join-room',
    from: 'alice',
    room: 'R1',
    data: { peerId: 'alice' }
  });
  assert.equal(m.type, 'join-room');
  assert.ok(m.timestamp);
  assert.ok(String(m.messageId).includes('alice'));
});
