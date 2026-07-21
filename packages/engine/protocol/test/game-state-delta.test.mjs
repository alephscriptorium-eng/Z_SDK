/**
 * GAME_STATE_DELTA — contrato puro (2º cliente = apply sin dominio).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_STATE_DELTA,
  GAME_STATE_DELTA_V,
  diffGameState,
  applyGameStateDelta,
  isGameStateDeltaShaped,
  isEmptyGameStateDelta,
  makeGameStateDeltaMessage,
  makeEnvelope,
  isShaped,
  PROTOCOL_VERSION
} from '../src/index.mjs';

const base = {
  mode: 'full',
  sceneId: 'demo-scene',
  tick: 10,
  ts: 1000,
  reason: 'change',
  actors: {
    a: { id: 'a', pose: 'sit', progress: null },
    b: { id: 'b', pose: 'walk', progress: 0.2 }
  },
  anchors: {
    'ancla-1': { occupiedBy: 'a' },
    'ancla-2': { occupiedBy: null }
  }
};

test('GAME_STATE_DELTA constant + message v0.2', () => {
  assert.equal(GAME_STATE_DELTA, 'GAME_STATE_DELTA');
  assert.equal(GAME_STATE_DELTA_V, 2);
});

test('diffGameState: solo actors/anchors cambiados; null = borrado', () => {
  const next = {
    ...base,
    tick: 11,
    ts: 1100,
    actors: {
      a: { id: 'a', pose: 'walk', progress: 0.1 },
      c: { id: 'c', pose: 'sit', progress: null }
    },
    anchors: {
      'ancla-1': { occupiedBy: null },
      'ancla-2': { occupiedBy: 'c' }
    }
  };
  const delta = diffGameState(base, next, { reason: 'change' });
  assert.equal(delta.mode, 'delta');
  assert.equal(delta.baseTick, 10);
  assert.equal(delta.tick, 11);
  assert.deepEqual(delta.actors, {
    a: { id: 'a', pose: 'walk', progress: 0.1 },
    b: null,
    c: { id: 'c', pose: 'sit', progress: null }
  });
  assert.deepEqual(delta.anchors, {
    'ancla-1': { occupiedBy: null },
    'ancla-2': { occupiedBy: 'c' }
  });
  assert.equal(isEmptyGameStateDelta(delta), false);
});

test('applyGameStateDelta (viewer / 2º cliente) reconstruye next', () => {
  const next = {
    ...base,
    tick: 12,
    actors: {
      a: { id: 'a', pose: 'sit', progress: null }
    },
    anchors: base.anchors
  };
  const delta = diffGameState(base, next);
  assert.equal(isGameStateDeltaShaped(delta), true);
  const applied = applyGameStateDelta(base, delta);
  assert.equal(applied.ok, true);
  assert.equal(applied.state.tick, 12);
  assert.equal(applied.state.mode, 'full');
  assert.deepEqual(applied.state.actors, next.actors);
  assert.equal(Object.prototype.hasOwnProperty.call(applied.state.actors, 'b'), false);
});

test('base_tick_mismatch fuerza resync', () => {
  const delta = diffGameState(base, { ...base, tick: 11 });
  const stale = { ...base, tick: 9 };
  const r = applyGameStateDelta(stale, delta);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'base_tick_mismatch');
});

test('isEmptyGameStateDelta cuando no hay cambios de mapa', () => {
  const delta = diffGameState(base, { ...base, tick: 10, ts: 2000 });
  assert.equal(isEmptyGameStateDelta(delta), true);
});

test('makeGameStateDeltaMessage + envelope state mode=delta isShaped', () => {
  const delta = diffGameState(base, {
    ...base,
    tick: 11,
    actors: {
      ...base.actors,
      a: { id: 'a', pose: 'walk', progress: 0.5 }
    }
  });
  const msg = makeGameStateDeltaMessage({ ...delta, from: 'map-authority' });
  assert.equal(msg.type, GAME_STATE_DELTA);
  assert.equal(msg.v, GAME_STATE_DELTA_V);
  assert.equal(msg.mode, 'delta');
  assert.equal(msg.from, 'map-authority');

  const env = makeEnvelope({
    game: 'demo',
    kind: 'state',
    from: 'auth',
    ...delta
  });
  assert.equal(env.mode, 'delta');
  assert.equal(env.kind, 'state');
  assert.equal(env.v, PROTOCOL_VERSION);
  assert.equal(isShaped('state', env), true);
});
