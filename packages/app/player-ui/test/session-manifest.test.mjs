import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { MANIFEST_VERSION } from '@zeus/session-domain';
import { sessionMachine, snapshotFromActor } from '../src/session-machine.mjs';
import { createSessionDomainState } from '@zeus/session-domain';
import { createSessionHandlers } from '../src/socket-handlers.mjs';

test('snapshotFromActor emits SessionManifest v2', () => {
  const actor = createActor(sessionMachine);
  actor.start();
  const domain = createSessionDomainState();
  const snap = snapshotFromActor(actor, domain);

  assert.equal(snap.version, MANIFEST_VERSION);
  assert.ok(snap.session);
  assert.ok(snap.map);
  assert.ok(snap.materiales);
  assert.ok(snap.ontologia);
  assert.ok(snap.decks);
  assert.equal(snap.phase, snap.session.phase);
  actor.stop();
});

test('material:pin handler updates manifest materiales', () => {
  const domain = createSessionDomainState();
  const actor = createActor(sessionMachine);
  actor.start();
  let broadcasts = 0;
  const { handlers } = createSessionHandlers({
    actor,
    domainState: domain,
    broadcastState: () => { broadcasts += 1; },
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

  handlers['material:pin']({
    nodeId: 'nodo-a',
    slot: 'overlay',
    serverName: 'linea-espana'
  });

  assert.equal(broadcasts, 1);
  const pins = domain.snapshot().materialPins;
  assert.ok(pins.has('nodo-a:overlay'));
  actor.stop();
});
