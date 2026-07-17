import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickRevFromSnapshot,
  strategies,
  castSelection,
  attachSessionParticipant
} from '../lib/session-participant.mjs';

/** Build a snapshot with a deck B holding revs with the given oldids. */
function snapshotWithRevs(oldids, deckId = 'B') {
  return {
    phase: 'test',
    decks: {
      [deckId]: {
        phase: 'resolved',
        resolved: {
          registros: { items: oldids.map((oldid) => ({ oldid })) }
        }
      }
    }
  };
}

// ---- pickRevFromSnapshot ----

test('pickRevFromSnapshot: first strategy returns first oldid', () => {
  const snap = snapshotWithRevs([101, 202, 303]);
  assert.equal(pickRevFromSnapshot(snap, 'B', strategies.first), 101);
});

test('pickRevFromSnapshot: last strategy returns last oldid', () => {
  const snap = snapshotWithRevs([101, 202, 303]);
  assert.equal(pickRevFromSnapshot(snap, 'B', strategies.last), 303);
});

test('pickRevFromSnapshot: default strategy is first', () => {
  const snap = snapshotWithRevs(['a', 'b']);
  assert.equal(pickRevFromSnapshot(snap, 'B'), 'a');
});

test('pickRevFromSnapshot: deterministic strategy is stable and in-range', () => {
  const snap = snapshotWithRevs([1, 2, 3, 4, 5]);
  const a = pickRevFromSnapshot(snap, 'B', strategies.deterministic);
  const b = pickRevFromSnapshot(snap, 'B', strategies.deterministic);
  assert.equal(a, b); // deterministic
  assert.ok([1, 2, 3, 4, 5].includes(a));
});

test('pickRevFromSnapshot: null snapshot -> null', () => {
  assert.equal(pickRevFromSnapshot(null, 'B'), null);
  assert.equal(pickRevFromSnapshot(undefined, 'B'), null);
});

test('pickRevFromSnapshot: missing deck -> null', () => {
  const snap = snapshotWithRevs([1, 2], 'B');
  assert.equal(pickRevFromSnapshot(snap, 'C'), null);
});

test('pickRevFromSnapshot: missing resolved/items -> null', () => {
  assert.equal(pickRevFromSnapshot({ decks: { B: {} } }, 'B'), null);
  assert.equal(pickRevFromSnapshot({ decks: { B: { resolved: {} } } }, 'B'), null);
  assert.equal(pickRevFromSnapshot({ decks: { B: { resolved: { registros: { items: [] } } } } }, 'B'), null);
});

test('pickRevFromSnapshot: out-of-range strategy index falls back to 0', () => {
  const snap = snapshotWithRevs([7, 8]);
  assert.equal(pickRevFromSnapshot(snap, 'B', () => 99), 7);
  assert.equal(pickRevFromSnapshot(snap, 'B', () => -1), 7);
});

// ---- castSelection: ROOM_MESSAGE shape ----

/** Socket stub capturing client.room(event, data, room) calls. */
function makeClientStub() {
  const calls = [];
  return {
    calls,
    room(event, data, room) {
      calls.push({ event, data, room });
    }
  };
}

test('castSelection: builds selection:cast with full data', () => {
  const client = makeClientStub();
  castSelection(client, 'scriptorium.default', {
    actorId: 'ping-demo',
    kind: 'registro',
    deckId: 'B',
    targetId: 12345,
    label: 'hello',
    meta: { x: 1 }
  });
  assert.equal(client.calls.length, 1);
  assert.deepEqual(client.calls[0], {
    event: 'selection:cast',
    room: 'scriptorium.default',
    data: { actorId: 'ping-demo', kind: 'registro', deckId: 'B', targetId: 12345, label: 'hello', meta: { x: 1 } }
  });
});

test('castSelection: applies kind/deckId defaults and omits absent label/meta', () => {
  const client = makeClientStub();
  const data = castSelection(client, 'r1', { actorId: 'pong-demo', targetId: 'oldid-9' });
  assert.deepEqual(data, { actorId: 'pong-demo', kind: 'registro', deckId: 'B', targetId: 'oldid-9' });
  assert.equal('label' in client.calls[0].data, false);
  assert.equal('meta' in client.calls[0].data, false);
});

// ---- attachSessionParticipant ----

/** Client stub with an io event bus + room() capture. */
function makeIoClientStub() {
  const handlers = new Map();
  const calls = [];
  return {
    calls,
    io: {
      on(event, cb) {
        if (!handlers.has(event)) handlers.set(event, []);
        handlers.get(event).push(cb);
      },
      off(event, cb) {
        const arr = handlers.get(event) || [];
        const i = arr.indexOf(cb);
        if (i >= 0) arr.splice(i, 1);
      },
      emit(event, payload) {
        for (const cb of handlers.get(event) || []) cb(payload);
      }
    },
    room(event, data, room) {
      calls.push({ event, data, room });
    }
  };
}

test('attachSessionParticipant: caches snapshot from session:state SET_STATE', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'scriptorium.default', actorId: 'ping-demo' });
  assert.equal(p.getSnapshot(), null);

  const snap = snapshotWithRevs([1, 2, 3]);
  client.io.emit('SET_STATE', { type: 'session:state', snapshot: snap, seq: 5 });
  assert.equal(p.getSnapshot(), snap);
});

test('attachSessionParticipant: ignores non-session SET_STATE and payloads without snapshot', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'r', actorId: 'a' });
  client.io.emit('SET_STATE', { type: 'other:state', snapshot: { decks: {} } });
  assert.equal(p.getSnapshot(), null);
  client.io.emit('SET_STATE', { type: 'session:state' });
  assert.equal(p.getSnapshot(), null);
});

test('attachSessionParticipant: onSnapshot fires on new snapshots', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'r', actorId: 'a' });
  const seen = [];
  p.onSnapshot((s) => seen.push(s));
  const snap = snapshotWithRevs([9]);
  client.io.emit('SET_STATE', { type: 'session:state', snapshot: snap });
  assert.equal(seen.length, 1);
  assert.equal(seen[0], snap);
});

test('attachSessionParticipant: cast picks rev and emits selection:cast', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'scriptorium.default', actorId: 'ping-demo', deckId: 'B' });
  client.io.emit('SET_STATE', { type: 'session:state', snapshot: snapshotWithRevs([11, 22, 33]) });

  const data = p.cast({ strategy: strategies.last, label: 'x' });
  assert.deepEqual(data, { actorId: 'ping-demo', kind: 'registro', deckId: 'B', targetId: 33, label: 'x' });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].event, 'selection:cast');
  assert.equal(client.calls[0].room, 'scriptorium.default');
});

test('attachSessionParticipant: cast is a silent no-op with no snapshot', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'r', actorId: 'a' });
  assert.equal(p.cast(), null);
  assert.equal(client.calls.length, 0);
});

test('attachSessionParticipant: dispose detaches listener', () => {
  const client = makeIoClientStub();
  const p = attachSessionParticipant(client, { room: 'r', actorId: 'a' });
  p.dispose();
  client.io.emit('SET_STATE', { type: 'session:state', snapshot: snapshotWithRevs([1]) });
  assert.equal(p.getSnapshot(), null);
});

test('attachSessionParticipant: requires room and actorId', () => {
  assert.throws(() => attachSessionParticipant({}, { actorId: 'a' }));
  assert.throws(() => attachSessionParticipant({}, { room: 'r' }));
});
