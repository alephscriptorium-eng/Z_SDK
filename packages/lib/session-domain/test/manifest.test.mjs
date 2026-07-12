import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDecksActor } from '@zeus/tablero-core';
import {
  MANIFEST_VERSION,
  buildSessionManifest,
  projectMap
} from '../src/manifest.mjs';
import { createEmptyMapSlice } from '../src/map-slice.mjs';

const legacyBase = {
  phase: 'idle',
  playhead: { year: 2010, playing: false },
  sync: true,
  activeCaso: 'aeo-p24-linea',
  decks: emptyDecksActor(),
  selections: { last: null, byActor: {}, log: [] },
  parteCues: [{ id: 'cue-1' }]
};

test('buildSessionManifest v2 shape', () => {
  const manifest = buildSessionManifest(legacyBase);

  assert.equal(manifest.version, MANIFEST_VERSION);
  assert.equal(typeof manifest.ts, 'number');
  assert.deepEqual(manifest.session, {
    phase: 'idle',
    playhead: { year: 2010, playing: false },
    sync: true,
    activeCaso: 'aeo-p24-linea'
  });
  assert.equal(manifest.map.sceneId, 'vaiven-dos-nodos');
  assert.deepEqual(manifest.map.actors, {});
  assert.ok(manifest.map.anchors['ancla-a']);
  assert.deepEqual(manifest.materiales.byNode, {});
  assert.deepEqual(manifest.ontologia.selections, {
    last: null,
    byActor: {},
    log: []
  });
  assert.deepEqual(manifest.ontologia.byNode, {});
});

test('buildSessionManifest keeps compat top-level mirrors', () => {
  const manifest = buildSessionManifest(legacyBase);
  assert.equal(manifest.phase, 'idle');
  assert.deepEqual(manifest.playhead, legacyBase.playhead);
  assert.equal(manifest.sync, true);
  assert.equal(manifest.activeCaso, 'aeo-p24-linea');
  assert.ok(manifest.decks);
  assert.deepEqual(manifest.selections, manifest.ontologia.selections);
});

test('projectMap returns map slice', () => {
  const map = createEmptyMapSlice();
  const manifest = buildSessionManifest(legacyBase, { map });
  assert.deepEqual(projectMap(manifest), map);
});

test('loaded deck projects into materiales.byNode', () => {
  const decks = emptyDecksActor();
  decks.A = {
    phase: 'playing',
    serverName: 'linea-espana',
    presetId: 'p1',
    filtered: null,
    resolved: { year: 2010, kind: 'linea' }
  };

  const manifest = buildSessionManifest({ ...legacyBase, decks });
  assert.equal(manifest.materiales.byNode['nodo-a'].length, 1);
  assert.equal(manifest.materiales.byNode['nodo-a'][0].slot, 'deck-a');
  assert.equal(manifest.materiales.byNode['nodo-a'][0].phase, 'playing');
  assert.equal(manifest.materiales.byNode['nodo-a'][0].serverName, 'linea-espana');
  assert.deepEqual(manifest.materiales.byNode['nodo-a'][0].resolved, decks.A.resolved);
});
