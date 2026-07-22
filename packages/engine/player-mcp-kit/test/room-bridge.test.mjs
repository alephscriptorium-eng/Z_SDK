/**
 * createPlayerRoomBridge: validación + peercard en bootstrap (sin socket real).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createPlayerRoomBridge } from '../src/room-bridge.mjs';

const EVENTS = {
  STATE: 'state',
  INTENT: 'intent',
  TRACK: 'track',
  LEDGER: 'ledger'
};

function mockClient() {
  const mockIo = new EventEmitter();
  mockIo.id = 'sock-mcp';
  mockIo.io = { opts: {} };
  mockIo.connect = () => {};
  mockIo.close = () => {};
  mockIo.disconnect = () => {};
  mockIo.on = (...args) => EventEmitter.prototype.on.apply(mockIo, args);
  mockIo.off = (...args) => EventEmitter.prototype.off.apply(mockIo, args);
  return {
    io: mockIo,
    room: () => {}
  };
}

test('exige events + makeIntent + room', () => {
  assert.throws(
    () => createPlayerRoomBridge({ actor: 'a', room: 'R', makeIntent: () => ({}) }),
    /events/
  );
  assert.throws(
    () => createPlayerRoomBridge({ actor: 'a', room: 'R', events: EVENTS }),
    /makeIntent/
  );
  assert.throws(
    () =>
      createPlayerRoomBridge({
        actor: 'a',
        room: '',
        events: EVENTS,
        makeIntent: () => ({})
      }),
    /room/
  );
});

test('requirePeerCard exige peerCard en bootstrap', () => {
  assert.throws(
    () =>
      createPlayerRoomBridge({
        actor: 'a',
        room: 'R',
        events: EVENTS,
        makeIntent: () => ({}),
        requirePeerCard: true,
        createClient: () => mockClient()
      }),
    /requirePeerCard/
  );
});

test('assertPeerCard rechaza card inválida en bootstrap', () => {
  assert.throws(
    () =>
      createPlayerRoomBridge({
        actor: 'a',
        room: 'R',
        events: EVENTS,
        makeIntent: () => ({}),
        peerCard: { token: 'x' },
        requirePeerCard: true,
        assertPeerCard: () => ({ ok: false, error: 'seat bad' }),
        createClient: () => mockClient()
      }),
    /seat bad/
  );
});

test('connect reenvía peerCard a connectAndJoin (mismo carril puerta)', async () => {
  const joins = [];
  const peerCard = {
    roomId: 'R',
    endpoint: 'wss://example/runtime',
    token: 'mcp-seat',
    scopes: ['role:player'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ssbId: '@AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=.ed25519',
    seatSignature: 'dGVzdA=='
  };

  const bridge = createPlayerRoomBridge({
    actor: 'rabbit',
    room: 'R',
    events: EVENTS,
    makeIntent: () => ({}),
    peer: { type: 'PlayerMcp', features: ['intent', 'mcp-wrapper'] },
    peerCard,
    requirePeerCard: true,
    assertPeerCard: (card) =>
      card?.seatSignature ? { ok: true } : { ok: false, error: 'no seat' },
    createClient: () => mockClient(),
    connectAndJoin: async (_client, user, options) => {
      joins.push({ user, options });
      return { room: options.room, socketId: '1' };
    }
  });

  assert.equal(bridge.ssbId, peerCard.ssbId);
  assert.equal(bridge.peerCard.seatSignature, 'dGVzdA==');

  await bridge.connect();
  assert.equal(bridge.connected, true);
  assert.equal(joins.length, 1);
  assert.equal(joins[0].options.type, 'PlayerMcp');
  assert.deepEqual(joins[0].options.peerCard, peerCard);
});

test('connect sin peerCard falla si requirePeerCard (tras setPeerCard null)', async () => {
  const peerCard = {
    roomId: 'R',
    endpoint: 'wss://example/runtime',
    token: 'mcp-seat',
    scopes: ['role:player'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    seatSignature: 'dGVzdA=='
  };
  const bridge = createPlayerRoomBridge({
    actor: 'a',
    room: 'R',
    events: EVENTS,
    makeIntent: () => ({}),
    peerCard,
    requirePeerCard: true,
    assertPeerCard: () => ({ ok: true }),
    createClient: () => mockClient(),
    connectAndJoin: async () => ({ room: 'R' })
  });
  assert.throws(() => bridge.setPeerCard(null), /requerido/);
});
