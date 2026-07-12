import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { emptyDecksActor } from '@zeus/tablero-core';
import {
  buildSessionManifest,
  createSessionDomainState,
  reduceSessionInbound,
  applyActorEvents,
  applyDomainOps
} from '@zeus/session-domain';
import { sessionMachine, snapshotFromActor } from '../src/session-machine.mjs';
import { createSessionHandlers } from '../src/socket-handlers.mjs';

function manifestFromReductions(actor, domain, events) {
  for (const { event, payload } of events) {
    const reduction = reduceSessionInbound(event, payload);
    applyActorEvents(actor, reduction.actorEvents);
    applyDomainOps(domain, reduction.domainOps);
  }
  return snapshotFromActor(actor, domain);
}

test('G-D3: selection:cast registro fills ontologia.byNode and selections.byActor', { timeout: 5000 }, () => {
  const actor = createActor(sessionMachine);
  actor.start();

  const resolved = { selected: { oldid: 42, label: 'Registro Z' } };
  actor.send({ type: 'DECK_LOADING', deckId: 'B', serverName: 'linea-espana' });
  actor.send({ type: 'DECK_LOADED', deckId: 'B', phase: 'playing', filtered: null, resolved });

  const domain = createSessionDomainState();
  const manifest = manifestFromReductions(actor, domain, [{
    event: 'selection:cast',
    payload: {
      actorId: 'dj',
      kind: 'registro',
      deckId: 'B',
      targetId: 42,
      label: 'Registro Z'
    }
  }]);

  assert.equal(manifest.ontologia.selections.byActor.dj.targetId, 42);
  assert.equal(manifest.ontologia.selections.byActor.dj.nodeId, 'nodo-b');
  assert.equal(manifest.ontologia.byNode['nodo-b'].registro.oldid, 42);
  actor.stop();
});

test('G-D5: map reducer and sessionMachine commute under master ordering', { timeout: 5000 }, () => {
  const eventsA = [
    { event: 'game:intent', payload: { actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' } },
    { event: 'material:pin', payload: { nodeId: 'nodo-a', slot: 'overlay', serverName: 'srv-a' } },
    { event: 'selection:cast', payload: { actorId: 'dj', kind: 'registro', deckId: 'B', targetId: 7 } }
  ];
  const eventsB = [
    { event: 'selection:cast', payload: { actorId: 'dj', kind: 'registro', deckId: 'B', targetId: 7 } },
    { event: 'material:pin', payload: { nodeId: 'nodo-a', slot: 'overlay', serverName: 'srv-a' } },
    { event: 'game:intent', payload: { actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' } }
  ];

  const run = (events) => {
    const actor = createActor(sessionMachine);
    actor.start();
    const domain = createSessionDomainState();
    const manifest = manifestFromReductions(actor, domain, events);
    actor.stop();
    return manifest;
  };

  const mA = run(eventsA);
  const mB = run(eventsB);

  assert.deepEqual(mA.map.actors, mB.map.actors);
  assert.deepEqual(mA.materiales.byNode, mB.materiales.byNode);
  const stripTs = (selections) => {
    const copy = structuredClone(selections);
    if (copy.last) delete copy.last.ts;
    for (const entry of Object.values(copy.byActor ?? {})) delete entry.ts;
    for (const entry of copy.log ?? []) delete entry.ts;
    return copy;
  };

  assert.deepEqual(stripTs(mA.ontologia.selections), stripTs(mB.ontologia.selections));
});

test('G-D1 handler path: game:intent sit updates manifest.map via socket handlers', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  const actor = createActor(sessionMachine);
  actor.start();
  let lastSnap = null;

  const { handlers } = createSessionHandlers({
    actor,
    domainState: domain,
    broadcastState: () => { lastSnap = snapshotFromActor(actor, domain); },
    resolveAllDecks: async () => {},
    handleDeckLoad: async () => {},
    handleRegistroSelect: async () => {},
    handleMicropostSelect: async () => {},
    handleFirehoseCorpus: async () => {},
    handleWikitextCache: async () => {},
    handleWikitextPoll: async () => {},
    listServers: async () => [],
    snapshotFromActor: () => snapshotFromActor(actor, domain),
    getIo: () => ({})
  });

  handlers['game:intent']({ actorId: 'bot-1', intent: 'sit', anchorId: 'ancla-a' }, {});
  assert.ok(lastSnap);
  assert.equal(lastSnap.map.actors['bot-1'].pose, 'sit');
  actor.stop();
});
