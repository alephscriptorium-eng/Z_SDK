import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { sessionMachine, snapshotFromActor } from '../src/session-machine.mjs';

function start() {
  const actor = createActor(sessionMachine);
  actor.start();
  return actor;
}

test('initial context exposes an empty selections structure', () => {
  const actor = start();
  const { selections } = actor.getSnapshot().context;
  assert.deepEqual(selections, { last: null, byActor: {}, log: [] });
  actor.stop();
});

test('SELECTION_CAST populates last, byActor and log', () => {
  const actor = start();
  actor.send({
    type: 'SELECTION_CAST',
    actorId: 'dj-1',
    kind: 'registro',
    deckId: 'B',
    targetId: 12345,
    label: 'Registro X',
    ts: 1000
  });

  const { selections } = actor.getSnapshot().context;
  assert.deepEqual(selections.last, {
    actorId: 'dj-1',
    kind: 'registro',
    deckId: 'B',
    targetId: 12345,
    label: 'Registro X',
    ts: 1000
  });
  assert.deepEqual(selections.byActor['dj-1'], selections.last);
  assert.equal(selections.log.length, 1);
  actor.stop();
});

test('SELECTION_CAST works from idle and keeps phase transitions intact', () => {
  const actor = start();
  // idle: a selection must not move the phase off idle
  actor.send({ type: 'SELECTION_CAST', actorId: 'a', targetId: 1, ts: 1 });
  assert.equal(actor.getSnapshot().value, 'idle');
  assert.equal(actor.getSnapshot().context.selections.last.actorId, 'a');

  // move to preparada then activa; selections should survive and phases still work
  actor.send({ type: 'DECK_LOADING', deckId: 'A', serverName: 'srv', presetId: null });
  assert.equal(actor.getSnapshot().value, 'preparada');
  actor.send({ type: 'SELECTION_CAST', actorId: 'b', targetId: 2, ts: 2 });
  assert.equal(actor.getSnapshot().value, 'preparada');

  actor.send({ type: 'TRANSPORT_PLAY' });
  assert.equal(actor.getSnapshot().value, 'activa');
  actor.send({ type: 'SELECTION_CAST', actorId: 'c', targetId: 3, ts: 3 });
  assert.equal(actor.getSnapshot().value, 'activa');

  const { selections } = actor.getSnapshot().context;
  assert.equal(selections.last.actorId, 'c');
  assert.deepEqual(Object.keys(selections.byActor).sort(), ['a', 'b', 'c']);
  actor.stop();
});

test('SELECTION_CAST log is capped at the last 20 entries', () => {
  const actor = start();
  for (let i = 0; i < 25; i++) {
    actor.send({ type: 'SELECTION_CAST', actorId: `a${i}`, targetId: i, ts: i });
  }
  const { selections } = actor.getSnapshot().context;
  assert.equal(selections.log.length, 20);
  assert.equal(selections.log[0].targetId, 5); // first 5 dropped
  assert.equal(selections.log.at(-1).targetId, 24);
  assert.equal(selections.last.targetId, 24);
  actor.stop();
});

test('byActor keeps only the latest selection per actor', () => {
  const actor = start();
  actor.send({ type: 'SELECTION_CAST', actorId: 'dj-1', targetId: 1, ts: 1 });
  actor.send({ type: 'SELECTION_CAST', actorId: 'dj-1', targetId: 2, ts: 2 });
  const { selections } = actor.getSnapshot().context;
  assert.equal(selections.byActor['dj-1'].targetId, 2);
  assert.equal(selections.log.length, 2);
  actor.stop();
});

test('snapshotFromActor includes selections', () => {
  const actor = start();
  actor.send({ type: 'SELECTION_CAST', actorId: 'dj-1', targetId: 7, ts: 7 });
  const snap = snapshotFromActor(actor);
  assert.ok('selections' in snap);
  assert.equal(snap.selections.last.targetId, 7);
  assert.equal(snap.selections.byActor['dj-1'].targetId, 7);
  assert.equal(snap.ontologia.selections.last.targetId, 7);
  assert.equal(snap.ontologia.selections.last.nodeId, 'nodo-b');
  actor.stop();
});
