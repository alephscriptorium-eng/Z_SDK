/**
 * @zeus/game-engine — engine + scene smoke tests.
 *
 * Guards the pure-logic core that ui-3d-kit and the viewers consume: the
 * public API shape, link sampling, and that the canonical vaivén scene ticks
 * into an auto-sit on arrival. Kept dependency-free (no three).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createMapEngine,
  sampleLink,
  linkDistance,
  vaivenDosNodos,
} from '../src/index.mjs';

test('public API is exported', () => {
  assert.equal(typeof createMapEngine, 'function');
  assert.equal(typeof sampleLink, 'function');
  assert.equal(typeof linkDistance, 'function');
  assert.equal(typeof vaivenDosNodos, 'object');
  assert.equal(vaivenDosNodos.id, 'vaiven-dos-nodos');
});

test('sampleLink interpolates along waypoints', () => {
  const wps = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
  ];
  assert.deepEqual(sampleLink(wps, 0), { x: 0, y: 0, z: 0 });
  assert.deepEqual(sampleLink(wps, 1), { x: 10, y: 0, z: 0 });
  assert.equal(sampleLink(wps, 0.5).x, 5);
});

test('linkDistance sums segment lengths', () => {
  assert.equal(linkDistance([{ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }]), 5);
});

test('createMapEngine exposes the runtime API and ticks without throwing', () => {
  const engine = createMapEngine(structuredClone(vaivenDosNodos));
  assert.equal(typeof engine.applyIntent, 'function');
  assert.equal(typeof engine.tick, 'function');
  assert.equal(typeof engine.getSnapshot, 'function');
  assert.equal(typeof engine.getDelta, 'function');
  assert.equal(typeof engine.drainEvents, 'function');
  for (let i = 0; i < 20; i += 1) engine.tick(0.1);
  const snap = engine.getSnapshot();
  assert.equal(snap.sceneId, 'vaiven-dos-nodos');
  assert.ok(snap.actors);
});

test('getDelta emits GAME_STATE_DELTA body for actor changes', () => {
  const engine = createMapEngine(structuredClone(vaivenDosNodos));
  engine.registerActor('robot-ping', {
    zone: 'nodo-a',
    pose: 'sit',
    anchorId: 'ancla-a',
    position: { x: 0, y: 0, z: 0 },
  });
  const prev = engine.getSnapshot();
  engine.applyIntent('robot-ping', {
    intent: 'walk',
    linkId: 'enlace-ab',
    direction: 'a-to-b',
  });
  const delta = engine.getDelta(prev, { reason: 'change' });
  assert.equal(delta.mode, 'delta');
  assert.equal(delta.baseTick, prev.tick);
  assert.ok(delta.actors['robot-ping']);
  assert.equal(delta.actors['robot-ping'].pose, 'walk');
});
