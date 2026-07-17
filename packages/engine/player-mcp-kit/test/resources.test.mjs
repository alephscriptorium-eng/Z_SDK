import test from 'node:test';
import assert from 'node:assert/strict';
import {
  standardPlayerResourceUris,
  buildStandardPlayerResources
} from '../src/resources.mjs';

test('URIs estándar `<game>://…`', () => {
  assert.deepEqual(standardPlayerResourceUris('arg'), {
    playerState: 'arg://player/state',
    scene: 'arg://scene',
    casos: 'arg://casos'
  });
  assert.deepEqual(standardPlayerResourceUris('demo'), {
    playerState: 'demo://player/state',
    scene: 'demo://scene',
    casos: 'demo://casos'
  });
});

test('game vacío ⇒ TypeError', () => {
  assert.throws(() => standardPlayerResourceUris(''), /game/);
});

test('buildStandardPlayerResources cablea lecturas', () => {
  const registry = buildStandardPlayerResources({
    game: 'demo',
    bridge: { actor: 'a1' },
    readPlayerState: () => ({ ok: 'state' }),
    readScene: () => ({ ok: 'scene' }),
    readCasos: () => ({ ok: 'casos' })
  });
  assert.equal(registry.length, 3);
  assert.equal(registry[0].uri, 'demo://player/state');
  assert.equal(registry[1].uri, 'demo://scene');
  assert.equal(registry[2].uri, 'demo://casos');
  assert.deepEqual(registry[0].read(), { ok: 'state' });
  assert.deepEqual(registry[1].read(), { ok: 'scene' });
  assert.deepEqual(registry[2].read(), { ok: 'casos' });
  assert.match(registry[0].title, /a1/);
});
