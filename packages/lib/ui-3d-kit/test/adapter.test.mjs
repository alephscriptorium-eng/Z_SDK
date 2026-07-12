/**
 * map-scene-adapter tests: stub puppetFactory (no three.js) + REAL vendored
 * engine (createMapEngine + vaivenDosNodos).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createMapEngine, sampleLink } from '@zeus/game-engine';
import { vaivenDosNodos } from '@zeus/game-engine';
import { createMapSceneAdapter } from '../src/adapter/map-scene-adapter.mjs';

function makeStubPuppet(id) {
  const calls = [];
  return {
    id,
    calls,
    object: { name: `stub:${id}` },
    position: null,
    heading: null,
    pose: null,
    updates: [],
    disposed: false,
    setPosition(pos) {
      this.position = { ...pos };
      calls.push(['setPosition', { ...pos }]);
    },
    setHeading(rad) {
      this.heading = rad;
      calls.push(['setHeading', rad]);
    },
    setBase(pose) {
      this.pose = pose;
      calls.push(['setBase', pose]);
    },
    setLabel(text) {
      calls.push(['setLabel', text]);
    },
    update(dt) {
      this.updates.push(dt);
    },
    dispose() {
      this.disposed = true;
    },
  };
}

function makeStubRoot() {
  return {
    children: [],
    add(obj) {
      this.children.push(obj);
    },
    remove(obj) {
      this.children = this.children.filter((c) => c !== obj);
    },
  };
}

function makeWorld() {
  const engine = createMapEngine(structuredClone(vaivenDosNodos));
  const root = makeStubRoot();
  const puppets = new Map();
  const adapter = createMapSceneAdapter({
    scene: vaivenDosNodos,
    puppetFactory: (id) => {
      const puppet = makeStubPuppet(id);
      puppets.set(id, puppet);
      return puppet;
    },
    root,
  });
  return { engine, adapter, root, puppets };
}

test('requires scene and puppetFactory', () => {
  assert.throws(() => createMapSceneAdapter({}), /scene/);
  assert.throws(() => createMapSceneAdapter({ scene: vaivenDosNodos }), /puppetFactory/);
});

test('spawnActor adds puppet.object to root; despawn removes and disposes', async () => {
  const { adapter, root, puppets } = makeWorld();
  const puppet = await adapter.spawnActor('alephillo-1', { label: 'Alephillo' });
  assert.equal(root.children.length, 1);
  assert.equal(adapter.getPuppet('alephillo-1'), puppet);
  assert.deepEqual(
    puppets.get('alephillo-1').calls.filter(([m]) => m === 'setLabel'),
    [['setLabel', 'Alephillo']],
  );

  // spawn is idempotent per id
  const again = await adapter.spawnActor('alephillo-1');
  assert.equal(again, puppet);
  assert.equal(root.children.length, 1);

  assert.equal(adapter.despawnActor('alephillo-1'), true);
  assert.equal(root.children.length, 0);
  assert.equal(puppet.disposed, true);
  assert.equal(adapter.despawnActor('alephillo-1'), false);
});

test('applySnapshot: sitting actor snaps to anchor position/facing with setBase(sit)', async () => {
  const { engine, adapter, puppets } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-a', anchorId: 'ancla-a', pose: 'sit' });
  await adapter.spawnActor('a1');

  adapter.applySnapshot(engine.getSnapshot());

  const puppet = puppets.get('a1');
  const anchor = vaivenDosNodos.anclas['ancla-a'];
  assert.deepEqual(puppet.position, {
    x: anchor.position.x,
    y: anchor.position.y,
    z: anchor.position.z,
  });
  assert.equal(puppet.pose, 'sit');
  // facing 90° → π/2 radians
  assert.ok(Math.abs(puppet.heading - Math.PI / 2) < 1e-9);
});

test('applySnapshot: walking actor is positioned via sampleLink(progress) with setBase(walk)', async () => {
  const { engine, adapter, puppets } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-a', anchorId: 'ancla-a', pose: 'sit' });
  await adapter.spawnActor('a1');

  const res = engine.applyIntent('a1', { intent: 'walk', linkId: 'enlace-ab', direction: 'a-to-b' });
  assert.equal(res.ok, true);

  // advance the real engine: walkSpeed 1.4 u/s over 12 u link
  engine.tick(2); // progress = 1.4*2/12 ≈ 0.2333
  const snapshot = engine.getSnapshot();
  const actor = snapshot.actors.a1;
  assert.equal(actor.pose, 'walk');
  assert.ok(actor.progress > 0 && actor.progress < 1);

  adapter.applySnapshot(snapshot);

  const puppet = puppets.get('a1');
  const expected = sampleLink(vaivenDosNodos.enlaces['enlace-ab'].waypoints, actor.progress);
  assert.deepEqual(puppet.position, expected);
  assert.equal(puppet.pose, 'walk');
  // link runs along +X → heading atan2(dx, dz) = π/2
  assert.ok(Math.abs(puppet.heading - Math.PI / 2) < 1e-6);
});

test('vaivén loop: arrival auto-sits on the far anchor and adapter follows', async () => {
  const { engine, adapter, puppets } = makeWorld();
  engine.registerActor('a1', { zone: 'nodo-a', anchorId: 'ancla-a', pose: 'sit' });
  await adapter.spawnActor('a1');

  engine.applyIntent('a1', { intent: 'walk', linkId: 'enlace-ab', direction: 'a-to-b' });
  // 12 u at 1.4 u/s → done in < 9 s
  for (let i = 0; i < 10; i++) engine.tick(1);

  const snapshot = engine.getSnapshot();
  const actor = snapshot.actors.a1;
  assert.equal(actor.pose, 'sit');
  assert.equal(actor.anchorId, 'ancla-b');

  adapter.applySnapshot(snapshot);
  const puppet = puppets.get('a1');
  assert.deepEqual(puppet.position, { x: 24, y: 0, z: 0 });
  assert.equal(puppet.pose, 'sit');
});

test('applySnapshot maps unknown poses to idle and skips unspawned actors', async () => {
  const { adapter, puppets } = makeWorld();
  await adapter.spawnActor('a1');

  adapter.applySnapshot({
    actors: {
      a1: { id: 'a1', pose: 'levitate', position: { x: 1, y: 2, z: 3 } },
      ghost: { id: 'ghost', pose: 'walk', position: { x: 0, y: 0, z: 0 } },
    },
  });

  const puppet = puppets.get('a1');
  assert.equal(puppet.pose, 'idle');
  assert.deepEqual(puppet.position, { x: 1, y: 2, z: 3 });
});

test('update(dt) fans out to all puppets; dispose despawns everything', async () => {
  const { adapter, puppets, root } = makeWorld();
  await adapter.spawnActor('a1');
  await adapter.spawnActor('a2');

  adapter.update(0.016);
  adapter.update(0.032);
  assert.deepEqual(puppets.get('a1').updates, [0.016, 0.032]);
  assert.deepEqual(puppets.get('a2').updates, [0.016, 0.032]);

  adapter.dispose();
  assert.equal(root.children.length, 0);
  assert.equal(puppets.get('a1').disposed, true);
  assert.equal(puppets.get('a2').disposed, true);
});
