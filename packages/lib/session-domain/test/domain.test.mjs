import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDecksActor } from '@zeus/tablero-core';
import { buildOntologia } from '../src/ontology.mjs';
import { buildSessionManifest } from '../src/manifest.mjs';
import { createSessionDomainState } from '../src/domain-state.mjs';
import { decksToMaterialsByNode } from '../src/materials.mjs';

test('buildOntologia derives registro from deck B resolved', () => {
  const decks = emptyDecksActor();
  decks.B = {
    phase: 'playing',
    serverName: 'linea-espana',
    presetId: null,
    filtered: null,
    resolved: { selected: { oldid: 42, label: 'Registro X' } }
  };

  const ontologia = buildOntologia({ last: null, byActor: {}, log: [] }, decks);
  assert.deepEqual(ontologia.byNode['nodo-b'].registro, { oldid: 42, label: 'Registro X' });
});

test('selections gain nodeId from deck binding', () => {
  const selections = {
    last: { actorId: 'dj', kind: 'registro', deckId: 'B', targetId: 1, ts: 1 },
    byActor: {},
    log: []
  };
  const ontologia = buildOntologia(selections, emptyDecksActor());
  assert.equal(ontologia.selections.last.nodeId, 'nodo-b');
});

test('G-D4: materiales.byNode coherent with ontologia.byNode', () => {
  const decks = emptyDecksActor();
  decks.B = {
    phase: 'cued',
    serverName: 'linea-espana',
    presetId: 'p1',
    filtered: null,
    resolved: { selected: { oldid: 99 } }
  };
  const manifest = buildSessionManifest({
    phase: 'preparada',
    playhead: { year: 2010, playing: false },
    sync: true,
    activeCaso: 'aeo-p24-linea',
    decks,
    selections: { last: null, byActor: {}, log: [] }
  });

  const material = manifest.materiales.byNode['nodo-b'].find((m) => m.slot === 'deck-b');
  assert.equal(material.phase, 'cued');
  assert.equal(material.serverName, 'linea-espana');
  assert.equal(manifest.ontologia.byNode['nodo-b'].registro.oldid, 99);
});

test('createSessionDomainState material pin merges into manifest', () => {
  const domain = createSessionDomainState();
  domain.applyMaterialPin({
    nodeId: 'nodo-a',
    slot: 'overlay',
    serverName: 'linea-espana',
    presetId: 'x'
  });

  const manifest = buildSessionManifest(
    {
      phase: 'idle',
      playhead: { year: 2010, playing: false },
      sync: true,
      activeCaso: 'c',
      decks: emptyDecksActor(),
      selections: { last: null, byActor: {}, log: [] }
    },
    domain.snapshot()
  );

  const slots = manifest.materiales.byNode['nodo-a'].map((m) => m.slot);
  assert.ok(slots.includes('overlay'));
});

test('decksToMaterialsByNode respects pin override', () => {
  const pins = new Map();
  pins.set('nodo-a:deck-a', {
    nodeId: 'nodo-a',
    slot: 'deck-a',
    serverName: 'pinned-srv',
    presetId: 'pin',
    phase: 'cued'
  });
  const byNode = decksToMaterialsByNode(emptyDecksActor(), pins);
  assert.equal(byNode['nodo-a'][0].serverName, 'pinned-srv');
});

test('applyGameIntent reduces map via server authority reducer', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  const result = domain.applyGameIntent({ actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' });
  assert.deepEqual(result, { ok: true });
  assert.equal(domain.getMap().actors.a1.anchorId, 'ancla-a');
});
