import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDecksActor } from '@zeus/tablero-core';
import { buildSessionManifest, createSessionDomainState } from '../src/index.mjs';

test('G-D1: valid game:intent sit sets manifest.map.actors pose', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  domain.applyGameIntent({ actorId: 'a1', intent: 'sit', anchorId: 'ancla-a' });

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

  assert.equal(manifest.map.actors.a1.pose, 'sit');
  assert.equal(manifest.map.actors.a1.anchorId, 'ancla-a');
});

test('G-D2: material:pin on nodo-a appears in materiales.byNode', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  domain.applyMaterialPin({
    nodeId: 'nodo-a',
    slot: 'overlay',
    serverName: 'linea-espana',
    presetId: 'p1'
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

  const materials = manifest.materiales.byNode['nodo-a'];
  assert.ok(Array.isArray(materials));
  assert.equal(materials.length, 1);
  assert.equal(materials[0].slot, 'overlay');
  assert.equal(materials[0].serverName, 'linea-espana');
});

test('G-D7: server manifest contains map.sceneId and materiales.byNode', { timeout: 5000 }, () => {
  const domain = createSessionDomainState();
  domain.applyMaterialPin({ nodeId: 'nodo-b', slot: 'deck-b', serverName: 'linea-wp-historia' });

  const manifest = buildSessionManifest(
    {
      phase: 'preparada',
      playhead: { year: 2012, playing: false },
      sync: true,
      activeCaso: 'aeo-p24-linea',
      decks: emptyDecksActor(),
      selections: { last: null, byActor: {}, log: [] }
    },
    domain.snapshot()
  );

  assert.equal(manifest.map.sceneId, 'vaiven-dos-nodos');
  assert.ok(typeof manifest.materiales.byNode === 'object');
  assert.ok(Array.isArray(manifest.materiales.byNode['nodo-b']));
});
