import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makePeerCard,
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  roleScope,
  checkSnapshotBudget,
  SNAPSHOT_BUDGET_BYTES,
  GATES
} from '../src/index.mjs';

test('Peer Card shape + freshness + role scopes', () => {
  const card = makePeerCard({
    roomId: 'ROOM_A',
    endpoint: 'wss://example.test/runtime',
    token: 'tok-1',
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    displayName: 'uno'
  });
  assert.equal(isPeerCardShaped(card), true);
  assert.equal(isPeerCardFresh(card), true);
  assert.equal(roleFromPeerCard(card), 'player');
  assert.equal(peerCardGrantsRole(card, 'player'), true);
  assert.equal(peerCardGrantsRole(card, 'dj'), false);

  const expired = makePeerCard({
    roomId: 'ROOM_A',
    endpoint: 'wss://example.test/runtime',
    token: 'tok-2',
    scopes: [roleScope('dj')],
    expiresAt: Date.now() - 1
  });
  assert.equal(isPeerCardFresh(expired), false);
  assert.equal(peerCardGrantsRole(expired, 'dj'), false);
});

test('gates expose ids and snapshot budget helper', () => {
  assert.equal(GATES.SINGLE_AUTHORITY, 'G-PROTO.1');
  assert.equal(SNAPSHOT_BUDGET_BYTES, 32 * 1024);
  const small = checkSnapshotBudget({ v: 1, actors: {} });
  assert.equal(small.ok, true);
  assert.ok(small.bytes > 0);
  const huge = checkSnapshotBudget({ pad: 'x'.repeat(SNAPSHOT_BUDGET_BYTES) });
  assert.equal(huge.ok, false);
});
