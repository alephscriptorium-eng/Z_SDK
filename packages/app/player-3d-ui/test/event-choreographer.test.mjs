/**
 * event-choreographer tests — pure logic with STUB engine/adapter/walkDriver/
 * puppet/hud (no three, no DOM). Verifies the event→intent→animation mapping
 * and the label reconciliation from a session snapshot.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createEventChoreographer } from '../assets/js/event-choreographer.mjs';
// Real scene def (pure data, no three) from the canonical source of truth
// @zeus/game-engine (block-11 GA-B — was the vendored kit copy).
import { vaivenDosNodos } from '@zeus/game-engine';

function makePuppet(id) {
  return {
    id,
    labels: [],
    emotes: [],
    bases: [],
    spawnOpts: null,
    setBase(p) { this.bases.push(p); },
    setLabel(t) { this.labels.push(t); },
    playAdditive(name) { this.emotes.push(name); return true; },
  };
}

function makeStubs() {
  const actors = {};
  const anchors = {
    'ancla-a': { occupiedBy: null },
    'ancla-b': { occupiedBy: null },
  };
  const intents = [];
  const engine = {
    registerActor(id, init) {
      actors[id] = {
        id,
        zone: init.zone,
        anchorId: init.anchorId ?? null,
        pose: init.pose ?? 'idle',
      };
      if (init.anchorId && anchors[init.anchorId]) anchors[init.anchorId].occupiedBy = id;
    },
    applyIntent(id, intent) {
      intents.push([id, intent]);
      if (intent.intent === 'sit' && anchors[intent.anchorId]) {
        anchors[intent.anchorId].occupiedBy = id;
        actors[id].anchorId = intent.anchorId;
        actors[id].pose = 'sit';
      }
      return { ok: true };
    },
    getSnapshot() {
      return { actors: structuredClone(actors), anchors: structuredClone(anchors) };
    },
  };

  const walkCalls = [];
  const walkDriver = {
    actorZone: (id) => engine.getSnapshot().actors[id]?.zone ?? null,
    walkToward(id, node) {
      walkCalls.push([id, node]);
      if (actors[id]) actors[id].zone = `walking:${node}`;
      return { ok: true };
    },
    walkBetween: () => ({ ok: true }),
  };

  const puppets = new Map();
  const adapter = {
    spawnActor: async (id, opts) => {
      const p = makePuppet(id);
      p.spawnOpts = opts;
      puppets.set(id, p);
      return p;
    },
    getPuppet: (id) => puppets.get(id) ?? null,
  };

  const hudCalls = [];
  const hud = {
    reflect: (s, e) => hudCalls.push(['reflect', s, e]),
    selection: (info) => hudCalls.push(['selection', info]),
    event: (info) => hudCalls.push(['event', info]),
    presence: (info) => hudCalls.push(['presence', info]),
  };

  const choreographer = createEventChoreographer({
    engine, adapter, walkDriver, scene: vaivenDosNodos, puppets, hud,
  });

  return { engine, adapter, walkDriver, puppets, hud, choreographer, intents, walkCalls, hudCalls, anchors, actors };
}

test('requires adapter/scene and local or remote deps', () => {
  assert.throws(() => createEventChoreographer({}), /adapter/);
  assert.throws(() => createEventChoreographer({ adapter: {} }), /scene/);
  assert.throws(
    () => createEventChoreographer({ adapter: {}, scene: vaivenDosNodos }),
    /engine/,
  );
});

test('PING: presence spawns + seats actor, then walks toward far node (B)', async () => {
  const s = makeStubs();
  await s.choreographer.onPing({ from: 'ping-demo' });

  // presence: puppet spawned, engine actor seated at a free anchor
  const puppet = s.adapter.getPuppet('ping-demo');
  assert.ok(puppet, 'puppet spawned');
  assert.ok(s.choreographer.hasActor('ping-demo'));
  assert.equal(s.actors['ping-demo'].anchorId, 'ancla-a'); // first free anchor
  // ping-ish id → canonical Alephillo model (Xbot mesh placeholder)
  assert.match(puppet.spawnOpts.url, /SK_Alephillo\.glb/);
  // walk intent toward far node
  assert.deepEqual(s.walkCalls, [['ping-demo', 'nodo-b']]);
  assert.deepEqual(
    s.hudCalls.find(([k]) => k === 'event')?.[1],
    { kind: 'PING', actorId: 'ping-demo' },
  );
});

test('PONG: walks toward home node (A) and plays the greeting emote', async () => {
  const s = makeStubs();
  await s.choreographer.onPong({ from: 'pong-demo' });

  const puppet = s.adapter.getPuppet('pong-demo');
  assert.ok(puppet);
  // pong-ish id → RobotExpressive model (real Wave clip)
  assert.match(puppet.spawnOpts.url, /RobotExpressive\.glb/);
  assert.deepEqual(s.walkCalls, [['pong-demo', 'nodo-a']]);
  assert.deepEqual(puppet.emotes, ['wave']);
});

test('two actors occupy distinct anchors (occupied-anchor registry)', async () => {
  const s = makeStubs();
  await s.choreographer.onPing({ from: 'ping-demo' });
  await s.choreographer.onPong({ from: 'pong-demo' });
  assert.equal(s.actors['ping-demo'].anchorId, 'ancla-a');
  assert.equal(s.actors['pong-demo'].anchorId, 'ancla-b');
});

test('selection:cast at current node → sit in place, label + celebration + HUD', async () => {
  const s = makeStubs();
  // presence seats the single actor at ancla-a (home node nodo-a); deck A → nodo-a
  await s.choreographer.onSelection({
    actorId: 'pong-demo', targetId: 42, label: 'Zeus', deckId: 'A',
  });

  const puppet = s.adapter.getPuppet('pong-demo');
  assert.ok(puppet);
  assert.ok(
    s.intents.some(([id, it]) => id === 'pong-demo' && it.intent === 'sit' && it.anchorId === 'ancla-a'),
    'sit intent at deck anchor',
  );
  assert.deepEqual(s.walkCalls, []); // already at the deck node → no walk
  assert.deepEqual(puppet.labels, ['Zeus']);
  assert.deepEqual(puppet.emotes, ['thumbsUp']);
  const sel = s.hudCalls.find(([k]) => k === 'selection')?.[1];
  assert.equal(sel.actorId, 'pong-demo');
  assert.match(sel.text, /pong-demo escogió 42 \(Zeus\)/);
});

test('selection:cast at another deck → walks toward that deck node', async () => {
  const s = makeStubs();
  // actor seats at nodo-a; deck B → nodo-b, so it must walk there (auto-sits on arrival)
  await s.choreographer.onSelection({ actorId: 'a1', targetId: 8, label: 'Beta', deckId: 'B' });
  assert.deepEqual(s.walkCalls, [['a1', 'nodo-b']]);
  assert.deepEqual(s.adapter.getPuppet('a1').labels, ['Beta']);
  assert.deepEqual(s.adapter.getPuppet('a1').emotes, ['thumbsUp']);
});

test('selection label falls back to targetId when no label', async () => {
  const s = makeStubs();
  await s.choreographer.onSelection({ actorId: 'a1', targetId: 9, deckId: 'A' });
  assert.deepEqual(s.adapter.getPuppet('a1').labels, ['9']);
});

test('onSnapshot reconciles labels from selections.byActor (idempotent)', async () => {
  const s = makeStubs();
  // materialize the actor first (present, no selection yet)
  await s.choreographer.ensurePresence('ping-demo');
  const puppet = s.adapter.getPuppet('ping-demo');

  const snapshot = {
    phase: 'run',
    selections: { byActor: { 'ping-demo': { targetId: 7, label: 'Kronos' } } },
  };
  s.choreographer.onSnapshot(snapshot, { seq: 1 });
  s.choreographer.onSnapshot(snapshot, { seq: 2 }); // identical → no re-label

  assert.deepEqual(puppet.labels, ['Kronos']); // exactly once
  // snapshot does NOT generate walk/sit intents
  assert.deepEqual(s.walkCalls, []);
  assert.equal(s.intents.length, 0);
  // HUD reflect was called for each snapshot
  assert.equal(s.hudCalls.filter(([k]) => k === 'reflect').length, 2);
});

test('onSnapshot uses targetId as label when label missing, and re-labels on change', async () => {
  const s = makeStubs();
  await s.choreographer.ensurePresence('a1');
  const puppet = s.adapter.getPuppet('a1');

  s.choreographer.onSnapshot({ selections: { byActor: { a1: { targetId: 3 } } } });
  s.choreographer.onSnapshot({ selections: { byActor: { a1: { targetId: 5, label: 'Five' } } } });
  assert.deepEqual(puppet.labels, ['3', 'Five']);
});

test('onEvent dispatches by name', async () => {
  const s = makeStubs();
  await s.choreographer.onEvent('PING', { from: 'ping-demo' });
  assert.deepEqual(s.walkCalls, [['ping-demo', 'nodo-b']]);
});

test('remote mode emits game:intent instead of local walk', async () => {
  const emitted = [];
  const actors = {};
  const anchors = { 'ancla-a': { occupiedBy: null }, 'ancla-b': { occupiedBy: null } };
  const mapSource = { getSnapshot: () => ({ actors, anchors }) };
  const puppets = new Map();
  const adapter = {
    spawnActor: async (id, opts) => {
      const p = makePuppet(id);
      p.spawnOpts = opts;
      puppets.set(id, p);
      return p;
    },
    getPuppet: (id) => puppets.get(id) ?? null,
  };
  const choreographer = createEventChoreographer({
    adapter,
    scene: vaivenDosNodos,
    mapSource,
    emitGameIntent: (p) => emitted.push(p),
    resolveWalk: (from, to) => (
      from === 'nodo-a' && to === 'nodo-b'
        ? { linkId: 'enlace-ab', direction: 'a-to-b' }
        : null
    ),
  });

  await choreographer.onPing({ from: 'ping-demo' });
  assert.equal(emitted.length, 2);
  assert.deepEqual(emitted[0], { actorId: 'ping-demo', intent: 'sit', anchorId: 'ancla-a' });
  assert.deepEqual(emitted[1], {
    actorId: 'ping-demo',
    intent: 'walk',
    linkId: 'enlace-ab',
    direction: 'a-to-b',
  });
});
