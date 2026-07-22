import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard
} from '@zeus/protocol/peer-card-seat';
import {
  assertSignalingPeerCard,
  isPeerCardGatedType,
  peerCardFromMessage,
  ssbIdFromMessage,
  PEER_CARD_GATED_TYPES
} from '../src/peer-card-gate.mjs';
import { SignalingService } from '../src/signaling-service.mjs';

function freshCard(overrides = {}) {
  return makePeerCard({
    roomId: 'R1',
    endpoint: 'http://test.local/runtime',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId: 'alice',
    ...overrides
  });
}

test('PEER_CARD_GATED_TYPES covers offer/answer/ICE/join', () => {
  assert.ok(isPeerCardGatedType('offer'));
  assert.ok(isPeerCardGatedType('answer'));
  assert.ok(isPeerCardGatedType('ice-candidate'));
  assert.ok(isPeerCardGatedType('room-join'));
  assert.equal(isPeerCardGatedType('room-leave'), false);
  assert.equal(PEER_CARD_GATED_TYPES.length, 4);
});

test('assertSignalingPeerCard rejects expired card', () => {
  const expired = freshCard({ expiresAt: Date.now() - 1 });
  const r = assertSignalingPeerCard(expired);
  assert.equal(r.ok, false);
  assert.match(r.error, /expired/);
});

test('assertSignalingPeerCard rejects card without role', () => {
  const noRole = makePeerCard({
    roomId: 'R1',
    endpoint: 'http://test.local/runtime',
    token: 'tok',
    scopes: ['presence:join'],
    expiresAt: Date.now() + 60_000
  });
  const r = assertSignalingPeerCard(noRole);
  assert.equal(r.ok, false);
  assert.match(r.error, /no role/);
});

test('assertSignalingPeerCard accepts fresh card with role', () => {
  const r = assertSignalingPeerCard(freshCard());
  assert.equal(r.ok, true);
  assert.equal(r.role, 'player');
});

test('assertSignalingPeerCard requireSsbId + seat signature (Z_SDK #4)', () => {
  const keys = generateSeatKeyPair();
  const unsigned = freshCard({ ssbId: keys.ssbId });
  assert.equal(assertSignalingPeerCard(unsigned, { requireSsbId: true }).ok, true);
  assert.equal(assertSignalingPeerCard(freshCard(), { requireSsbId: true }).ok, false);

  const signed = signTravelingPeerCard(freshCard(), keys.privateKey, keys.ssbId);
  const ok = assertSignalingPeerCard(signed, {
    requireSsbId: true,
    requireSeatSignature: true
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.ssbId, keys.ssbId);

  const bad = { ...signed, seatSignature: Buffer.alloc(64, 9).toString('base64') };
  const rejected = assertSignalingPeerCard(bad, { requireSeatSignature: true });
  assert.equal(rejected.ok, false);
  assert.match(rejected.error, /seat signature rejected/);
});

test('sendOffer throws without peer-card; accepts with card', async () => {
  const sent = [];
  class Stub extends SignalingService {
    async sendMessage(message) {
      sent.push(message);
    }
  }
  const s = new Stub();
  s.userId = 'alice';
  s.roomId = 'R1';

  await assert.rejects(
    () => s.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/
  );

  s.setPeerCard(freshCard());
  await s.sendOffer('bob', { type: 'offer', sdp: 'x' });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].type, 'offer');
  assert.ok(sent[0].peerCard);
});

test('sendOffer propagates ssbId on handshake', async () => {
  const keys = generateSeatKeyPair();
  const sent = [];
  class Stub extends SignalingService {
    async sendMessage(message) {
      sent.push(message);
    }
  }
  const s = new Stub();
  s.userId = keys.ssbId;
  s.roomId = 'R1';
  s.setPeerCard(signTravelingPeerCard(freshCard(), keys.privateKey, keys.ssbId), {
    requireSsbId: true,
    requireSeatSignature: true
  });
  await s.sendOffer('@bob.ed25519', { type: 'offer', sdp: 'x' });
  assert.equal(sent[0].ssbId, keys.ssbId);
  assert.equal(sent[0].peerCard.ssbId, keys.ssbId);
});

test('handleMessage drops offer with expired peer-card', () => {
  const s = new SignalingService();
  const errors = [];
  const seen = [];
  s.on('error', (e) => errors.push(e));
  s.on('message', (m) => seen.push(m));

  s.handleMessage({
    type: 'offer',
    from: 'bob',
    to: 'alice',
    roomId: 'R1',
    timestamp: Date.now(),
    messageId: 'm1',
    offer: { type: 'offer', sdp: 'x' },
    peerCard: freshCard({ expiresAt: Date.now() - 1 })
  });
  assert.equal(seen.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /expired/);
});

test('handleMessage rejects bad seat signature', () => {
  const keys = generateSeatKeyPair();
  const signed = signTravelingPeerCard(freshCard(), keys.privateKey, keys.ssbId);
  const s = new SignalingService();
  s._requireSeatSignature = true;
  const errors = [];
  const seen = [];
  s.on('error', (e) => errors.push(e));
  s.on('message', (m) => seen.push(m));
  s.handleMessage({
    type: 'offer',
    from: keys.ssbId,
    to: 'alice',
    roomId: 'R1',
    timestamp: Date.now(),
    messageId: 'm1',
    offer: { type: 'offer', sdp: 'x' },
    ssbId: keys.ssbId,
    peerCard: { ...signed, seatSignature: Buffer.alloc(64, 2).toString('base64') }
  });
  assert.equal(seen.length, 0);
  assert.match(errors[0].message, /seat signature/);
});

test('peerCardFromMessage reads top-level or data.peerCard', () => {
  const card = freshCard();
  assert.equal(peerCardFromMessage({ peerCard: card }), card);
  assert.equal(peerCardFromMessage({ data: { peerCard: card } }), card);
  assert.equal(peerCardFromMessage({ data: {} }), null);
});

test('ssbIdFromMessage reads handshake fields', () => {
  const id = '@AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=.ed25519';
  assert.equal(ssbIdFromMessage({ ssbId: id }), id);
  assert.equal(ssbIdFromMessage({ data: { ssbId: id } }), id);
  assert.equal(ssbIdFromMessage({ peerCard: { ssbId: id } }), id);
  assert.equal(ssbIdFromMessage({}), null);
});
