/**
 * walk-driver tests — resolver + on-demand walk over the REAL vendored engine.
 * Verifies (a) link/direction resolution, (b) that a walk intent animates
 * progress 0→1 under engine.tick and flips pose walk→idle/sit on arrival.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createMapEngine } from '@zeus/game-engine';
import { vaivenDosNodos } from '@zeus/game-engine';
import { createWalkDriver, resolveWalk } from '../src/engine/walk-driver.mjs';

function makeWorld() {
  const engine = createMapEngine(structuredClone(vaivenDosNodos));
  const walkDriver = createWalkDriver({ engine, scene: vaivenDosNodos });
  return { engine, walkDriver };
}

test('resolveWalk picks link + direction for both orientations', () => {
  assert.deepEqual(resolveWalk(vaivenDosNodos, 'nodo-a', 'nodo-b'), {
    linkId: 'enlace-ab',
    direction: 'a-to-b',
  });
  assert.deepEqual(resolveWalk(vaivenDosNodos, 'nodo-b', 'nodo-a'), {
    linkId: 'enlace-ab',
    direction: 'b-to-a',
  });
  assert.equal(resolveWalk(vaivenDosNodos, 'nodo-a', 'nodo-x'), null);
});

test('requires engine + scene', () => {
  assert.throws(() => createWalkDriver({}), /engine/);
  assert.throws(() => createWalkDriver({ engine: { applyIntent() {} } }), /scene/);
});

test('walkToward injects a walk intent and progresses 0→1 to arrival', () => {
  const { engine, walkDriver } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-a', anchorId: 'ancla-a', pose: 'sit' });

  assert.equal(walkDriver.actorZone('a1'), 'nodo-a');

  const res = walkDriver.walkToward('a1', 'nodo-b'); // A → B
  assert.equal(res.ok, true);

  let snap = engine.getSnapshot();
  assert.equal(snap.actors.a1.pose, 'walk');
  assert.equal(snap.actors.a1.progress, 0);

  // Advance: 12 u link at 1.4 u/s → mid-walk progress strictly inside (0,1).
  engine.tick(2);
  snap = engine.getSnapshot();
  assert.equal(snap.actors.a1.pose, 'walk');
  assert.ok(snap.actors.a1.progress > 0 && snap.actors.a1.progress < 1);

  // Finish the walk; arrival auto-sits on the far default anchor.
  for (let i = 0; i < 10; i++) engine.tick(1);
  snap = engine.getSnapshot();
  assert.equal(snap.actors.a1.pose, 'sit');
  assert.equal(snap.actors.a1.zone, 'nodo-b');
  assert.equal(snap.actors.a1.anchorId, 'ancla-b');
});

test('walkToward is a soft no-op when already at destination / no zone', () => {
  const { engine, walkDriver } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-a', anchorId: 'ancla-a', pose: 'sit' });

  assert.deepEqual(walkDriver.walkToward('a1', 'nodo-a'), {
    ok: false,
    error: 'ya_en_destino',
  });
  assert.deepEqual(walkDriver.walkToward('ghost', 'nodo-b'), {
    ok: false,
    error: 'actor_sin_zona',
  });
});

test('walkBetween returns sin_enlace for unconnected nodes', () => {
  const { walkDriver } = makeWorld();
  assert.deepEqual(walkDriver.walkBetween('a1', 'nodo-a', 'nodo-x'), {
    ok: false,
    error: 'sin_enlace',
  });
});

test('vaivén: B → A walk direction is b-to-a and arrives at nodo-a', () => {
  const { engine, walkDriver } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-b', anchorId: 'ancla-b', pose: 'sit' });

  const res = walkDriver.walkToward('a1', 'nodo-a');
  assert.equal(res.ok, true);
  assert.equal(engine.getSnapshot().actors.a1.linkDirection, 'b-to-a');

  for (let i = 0; i < 12; i++) engine.tick(1);
  const snap = engine.getSnapshot();
  assert.equal(snap.actors.a1.zone, 'nodo-a');
  assert.equal(snap.actors.a1.anchorId, 'ancla-a');
});
