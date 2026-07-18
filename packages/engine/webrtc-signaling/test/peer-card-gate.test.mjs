import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  assertSignalingPeerCard,
  isPeerCardGatedType,
  peerCardFromMessage,
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

test('peerCardFromMessage reads top-level or data.peerCard', () => {
  const card = freshCard();
  assert.equal(peerCardFromMessage({ peerCard: card }), card);
  assert.equal(peerCardFromMessage({ data: { peerCard: card } }), card);
  assert.equal(peerCardFromMessage({ data: {} }), null);
});
