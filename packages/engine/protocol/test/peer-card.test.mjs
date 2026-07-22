import test from 'node:test';
import assert from 'node:assert/strict';
import {
  makePeerCard,
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  roleScope,
  isSsbId,
  ssbIdFromPublicKeyBytes,
  publicKeyBytesFromSsbId,
  travelingPeerCardPayload,
  travelingPeerCardBytes,
  attachTravelingSeat,
  checkSnapshotBudget,
  SNAPSHOT_BUDGET_BYTES,
  GATES
} from '../src/index.mjs';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard
} from '../src/peer-card-seat.mjs';

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

test('ssbId helpers round-trip raw ed25519 pubkey', () => {
  const raw = Buffer.alloc(32, 7);
  const id = ssbIdFromPublicKeyBytes(raw);
  assert.equal(isSsbId(id), true);
  assert.deepEqual(Buffer.from(publicKeyBytesFromSsbId(id)), raw);
  assert.equal(isSsbId('not-a-feed'), false);
  assert.throws(
    () =>
      makePeerCard({
        roomId: 'R',
        endpoint: 'http://x',
        token: 't',
        scopes: [roleScope('player')],
        expiresAt: Date.now() + 1000,
        ssbId: 'bad'
      }),
    /ssbId/
  );
});

test('traveling seat: sign + verify + reject tamper (Z_SDK #4)', () => {
  const keys = generateSeatKeyPair();
  const base = makePeerCard({
    roomId: 'ROOM_A',
    endpoint: 'ssb:oasis',
    token: 'tok-seat',
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId: keys.ssbId
  });
  const signed = signTravelingPeerCard(base, keys.privateKey, keys.ssbId);
  assert.equal(signed.ssbId, keys.ssbId);
  assert.ok(signed.seatSignature);
  assert.equal(verifyTravelingPeerCard(signed).ok, true);

  const tampered = { ...signed, token: 'tok-evil' };
  assert.equal(verifyTravelingPeerCard(tampered).ok, false);

  const badSig = attachTravelingSeat(base, {
    ssbId: keys.ssbId,
    seatSignature: Buffer.alloc(64, 1).toString('base64')
  });
  assert.match(verifyTravelingPeerCard(badSig).error, /mismatch|malformed/);

  const payload = travelingPeerCardPayload(signed);
  assert.equal('seatSignature' in payload, false);
  assert.ok(travelingPeerCardBytes(signed).byteLength > 0);
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
