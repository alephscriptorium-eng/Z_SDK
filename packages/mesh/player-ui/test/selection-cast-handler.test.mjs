import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionHandlers } from '../src/socket-handlers.mjs';

function makeDeps(overrides = {}) {
  const calls = { actor: [], registro: [], broadcast: 0 };
  const io = { marker: 'io-stub' };
  const deps = {
    actor: { send: (evt) => calls.actor.push(evt) },
    broadcastState: () => { calls.broadcast += 1; },
    resolveAllDecks: async () => {},
    handleDeckLoad: async () => {},
    handleRegistroSelect: async (ioArg, payload) => {
      calls.registro.push({ ioArg, payload });
    },
    handleMicropostSelect: async () => {},
    handleFirehoseCorpus: async () => {},
    handleWikitextCache: async () => {},
    handleWikitextPoll: async () => {},
    listServers: async () => [],
    snapshotFromActor: () => ({}),
    getIo: () => io,
    ...overrides
  };
  return { deps, calls, io };
}

test('selection:cast sends SELECTION_CAST and delegates to handleRegistroSelect for kind=registro', async () => {
  const { deps, calls, io } = makeDeps();
  const { handlers } = createSessionHandlers(deps);

  handlers['selection:cast']({ actorId: 'dj-1', kind: 'registro', deckId: 'B', targetId: 12345 });
  await Promise.resolve(); // let the delegated promise settle

  assert.equal(calls.actor.length, 1);
  const evt = calls.actor[0];
  assert.equal(evt.type, 'SELECTION_CAST');
  assert.equal(evt.actorId, 'dj-1');
  assert.equal(evt.kind, 'registro');
  assert.equal(evt.deckId, 'B');
  assert.equal(evt.targetId, 12345);
  assert.equal(typeof evt.ts, 'number');

  assert.equal(calls.registro.length, 1);
  assert.equal(calls.registro[0].ioArg, io);
  assert.deepEqual(calls.registro[0].payload, { deckId: 'B', oldid: 12345 });
});

test('selection:cast defaults kind=registro and deckId=B', async () => {
  const { deps, calls } = makeDeps();
  const { handlers } = createSessionHandlers(deps);

  handlers['selection:cast']({ actorId: 'dj-2', targetId: '67890' });
  await Promise.resolve();

  const evt = calls.actor[0];
  assert.equal(evt.kind, 'registro');
  assert.equal(evt.deckId, 'B');
  assert.deepEqual(calls.registro[0].payload, { deckId: 'B', oldid: '67890' });
});

test('selection:cast without registro delegation broadcasts state directly', () => {
  const { deps, calls } = makeDeps();
  const { handlers } = createSessionHandlers(deps);

  handlers['selection:cast']({ actorId: 'dj-3', kind: 'note', label: 'hola' });

  assert.equal(calls.actor.length, 1);
  assert.equal(calls.actor[0].kind, 'note');
  assert.equal(calls.registro.length, 0); // no deck re-resolution
  assert.equal(calls.broadcast, 1);
});
