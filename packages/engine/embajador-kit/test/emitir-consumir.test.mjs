import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emitirCredencial,
  consumirCredencial,
  DEFAULT_STARTPACK,
  CREDENCIAL_VERSION,
  isCredencialEmbajadorShaped,
  attachSignatureStub,
  FIRMA_STUB_PENDIENTE
} from '../src/index.mjs';

const NOW = 1_700_000_000_000;

function baseEmit(extra = {}) {
  return emitirCredencial({
    roomId: 'ROOM_ENTRADA',
    endpoint: 'wss://example.test/runtime',
    token: 'tok-amigo-1',
    role: 'player',
    expiresAt: NOW + 3_600_000,
    displayName: 'amigo',
    sessionId: 'sess-1',
    ...extra
  });
}

test('eje I smoke: emitir → consumir peercard + startpack default', () => {
  const cred = baseEmit();
  assert.equal(cred.version, CREDENCIAL_VERSION);
  assert.equal(isCredencialEmbajadorShaped(cred), true);
  assert.deepEqual(cred.startpack, { ...DEFAULT_STARTPACK });
  assert.equal(cred.signature.alg, 'stub');

  const out = consumirCredencial(cred, { now: NOW });
  assert.equal(out.ok, true);
  assert.deepEqual(out.errors, []);
  assert.equal(out.peerCard.roomId, 'ROOM_ENTRADA');
  assert.equal(out.role, 'player');
  assert.equal(out.startpack.ref, 'startpack-ciudad-v0.1.0');
  assert.equal(out.defaultStartpack, true);
  assert.equal(out.signature.verified, false);
  assert.equal(out.signature.mode, 'stub');
});

test('consumir peercard desnudo rellena DEFAULT_STARTPACK', () => {
  const cred = baseEmit();
  const bare = cred.peerCard;
  const out = consumirCredencial(bare, { now: NOW });
  assert.equal(out.ok, true);
  assert.equal(out.defaultStartpack, true);
  assert.equal(out.startpack.ref, 'startpack-ciudad-v0.1.0');
});

test('consumir rechaza peercard expirado', () => {
  const cred = baseEmit({ expiresAt: NOW - 1 });
  const out = consumirCredencial(cred, { now: NOW });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('expirado')));
});

test('attachSignatureStub no muta original', () => {
  const cred = baseEmit({ signature: null });
  assert.equal(cred.signature, undefined);
  const signed = attachSignatureStub(cred, FIRMA_STUB_PENDIENTE);
  assert.equal(cred.signature, undefined);
  assert.equal(signed.signature.alg, 'stub');
  assert.notEqual(signed.peerCard, cred.peerCard);
});

test('requireSignature con stub → ok false', () => {
  const cred = baseEmit();
  const out = consumirCredencial(cred, { now: NOW, requireSignature: true });
  assert.equal(out.ok, false);
  assert.ok(out.errors.some((e) => e.includes('signature')));
});
