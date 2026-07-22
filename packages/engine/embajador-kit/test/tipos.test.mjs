import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREDENCIAL_VERSION,
  DEFAULT_STARTPACK,
  isCredencialEmbajadorShaped,
  isStartpackRefShaped,
  resolveStartpack
} from '../src/tipos.mjs';

test('DEFAULT_STARTPACK es startpack-ciudad-v0.1.0', () => {
  assert.equal(DEFAULT_STARTPACK.id, 'startpack-ciudad');
  assert.equal(DEFAULT_STARTPACK.version, '0.1.0');
  assert.equal(DEFAULT_STARTPACK.ref, 'startpack-ciudad-v0.1.0');
  assert.equal(DEFAULT_STARTPACK.packageName, '@zeus/startpack-ciudad');
  assert.equal(isStartpackRefShaped(DEFAULT_STARTPACK), true);
});

test('resolveStartpack rellena default y acepta override parcial', () => {
  assert.deepEqual(resolveStartpack(), { ...DEFAULT_STARTPACK });
  const over = resolveStartpack({ ref: 'startpack-ciudad-v0.1.0', id: 'startpack-ciudad' });
  assert.equal(over.version, '0.1.0');
  assert.equal(over.packageName, '@zeus/startpack-ciudad');
});

test('isCredencialEmbajadorShaped exige version + peerCard + startpack', () => {
  assert.equal(isCredencialEmbajadorShaped(null), false);
  assert.equal(
    isCredencialEmbajadorShaped({
      version: CREDENCIAL_VERSION,
      peerCard: { roomId: 'r' },
      startpack: DEFAULT_STARTPACK
    }),
    true
  );
  assert.equal(
    isCredencialEmbajadorShaped({
      version: 'otros/1',
      peerCard: {},
      startpack: DEFAULT_STARTPACK
    }),
    false
  );
});
