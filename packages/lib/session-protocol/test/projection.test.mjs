import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDecksActor } from '@zeus/tablero-core';
import { buildSessionManifest } from '@zeus/session-domain';
import {
  SCENE_IDS,
  getSceneDeclaration,
  projectSlice,
  buildDomainNodes,
  firehoseDeckContextFromSession
} from '../src/projection/index.mjs';

const legacyBase = {
  phase: 'preparada',
  playhead: { year: 2012, playing: false },
  sync: true,
  activeCaso: 'aeo-p24-linea',
  decks: emptyDecksActor(),
  selections: { last: null, byActor: {}, log: [] }
};

function manifestWithMap(actors = {}) {
  return buildSessionManifest(legacyBase, {
    map: {
      sceneId: 'vaiven-dos-nodos',
      tick: 1,
      actors,
      anchors: { 'ancla-a': { occupiedBy: 'a1' }, 'ancla-b': { occupiedBy: null } }
    }
  });
}

test('getSceneDeclaration rejects unknown scene', () => {
  assert.throws(() => getSceneDeclaration('unknown'), /Unknown sceneId/);
});

test('projectSlice tablero returns full session fields', () => {
  const manifest = manifestWithMap();
  const slice = projectSlice(manifest, SCENE_IDS.tablero);
  assert.equal(slice.sceneId, SCENE_IDS.tablero);
  assert.equal(slice.phase, 'preparada');
  assert.ok(slice.decks);
  assert.ok(slice.map);
});

test('projectSlice player-3d exposes map, playhead, deckBSelected, nodes', () => {
  const decks = emptyDecksActor();
  decks.B = {
    phase: 'playing',
    serverName: 'linea-espana',
    presetId: null,
    filtered: null,
    resolved: { selected: { oldid: 7, label: 'R7' } }
  };
  const manifest = buildSessionManifest(
    { ...legacyBase, decks },
    {
      map: {
        sceneId: 'vaiven-dos-nodos',
        tick: 2,
        actors: { a1: { id: 'a1', zone: 'nodo-a', pose: 'sit', anchorId: 'ancla-a' } },
        anchors: {}
      }
    }
  );

  const slice = projectSlice(manifest, SCENE_IDS.player3d);
  assert.equal(slice.map.actors.a1.pose, 'sit');
  assert.equal(slice.playhead.year, 2012);
  assert.equal(slice.deckBSelected.oldid, 7);
  assert.equal(slice.nodes['nodo-a'].actors.a1.pose, 'sit');
});

test('G-DM.3: identical sessions project to identical player-3d domain slices', { timeout: 5000 }, () => {
  const manifest = manifestWithMap({
    walker: { id: 'walker', zone: 'nodo-a', pose: 'walk', linkId: 'enlace-ab', progress: 0.5 }
  });
  const sliceA = projectSlice(structuredClone(manifest), SCENE_IDS.player3d);
  const sliceB = projectSlice(structuredClone(manifest), SCENE_IDS.player3d);
  assert.deepEqual(sliceA.map, sliceB.map);
  assert.deepEqual(sliceA.nodes, sliceB.nodes);
});

test('G-DM.4: player-3d slice derives actor pose from manifest.map not deck fields', { timeout: 5000 }, () => {
  const decks = emptyDecksActor();
  decks.B = {
    phase: 'playing',
    serverName: 'linea-espana',
    presetId: null,
    filtered: null,
    resolved: { selected: { oldid: 1 } }
  };
  const manifest = buildSessionManifest(
    { ...legacyBase, decks },
    {
      map: {
        sceneId: 'vaiven-dos-nodos',
        tick: 3,
        actors: { bot: { id: 'bot', zone: 'nodo-b', pose: 'idle' } },
        anchors: {}
      }
    }
  );

  const slice = projectSlice(manifest, SCENE_IDS.player3d);
  assert.equal(slice.map.actors.bot.pose, 'idle');
  assert.equal(slice.nodes['nodo-b'].actors.bot.pose, 'idle');
  assert.notEqual(slice.map.actors.bot.pose, decks.B.resolved.selected.oldid);
});

test('buildDomainNodes groups actors by zone and merges ontologia', () => {
  const manifest = buildSessionManifest(
    {
      ...legacyBase,
      decks: emptyDecksActor()
    },
    {
      map: {
        sceneId: 'vaiven-dos-nodos',
        tick: 0,
        actors: { x: { id: 'x', zone: 'nodo-a', pose: 'sit' } },
        anchors: {}
      },
      ontologyPatches: { 'nodo-a': { registro: { oldid: 3 } } }
    }
  );
  manifest.ontologia.byNode['nodo-a'] = {
    ...manifest.ontologia.byNode['nodo-a'],
    registro: { oldid: 3 }
  };
  const nodes = buildDomainNodes(manifest);
  assert.equal(nodes['nodo-a'].actors.x.pose, 'sit');
  assert.equal(nodes['nodo-a'].registro.oldid, 3);
});

test('projectSlice firehose exposes deck C resolved and corpus', () => {
  const decks = emptyDecksActor();
  decks.C = {
    phase: 'playing',
    serverName: 'firehose-mcp-server',
    presetId: 'aleph-firehose-browse',
    filtered: null,
    resolved: {
      kind: 'firehose',
      corpus: 'raw',
      path: 'batch-001',
      selected: { handle: 'post-42.json' },
      posts: { items: [{ id: 'p1' }] }
    }
  };
  const manifest = buildSessionManifest({ ...legacyBase, decks });
  const slice = projectSlice(manifest, SCENE_IDS.firehose);

  assert.equal(slice.corpus, 'raw');
  assert.equal(slice.path, 'batch-001');
  assert.equal(slice.selectedFilePath, 'post-42.json');
  assert.equal(slice.deckCResolved.kind, 'firehose');
  assert.ok(slice.deckCResolved.posts.items.length > 0);
});

test('firehoseDeckContextFromSession maps slice to link recipe context', () => {
  const decks = emptyDecksActor();
  decks.C = {
    phase: 'cued',
    serverName: 'firehose-mcp-server',
    presetId: null,
    filtered: null,
    resolved: {
      kind: 'firehose',
      corpus: 'candidate',
      path: '',
      selected: { file: 'micropost-a.json' }
    }
  };
  const manifest = buildSessionManifest({ ...legacyBase, decks });
  const ctx = firehoseDeckContextFromSession(manifest);
  assert.equal(ctx.corpus, 'candidate');
  assert.equal(ctx.selectedFilePath, 'micropost-a.json');
});

test('projectSlice view-ui exposes registros and wikitext', () => {
  const decks = emptyDecksActor();
  decks.A = {
    phase: 'playing',
    serverName: 'linea-wp-historia',
    presetId: null,
    filtered: null,
    resolved: { wikitext: { title: 'Wiki', html: '<p>x</p>' } }
  };
  decks.B = {
    phase: 'playing',
    serverName: 'linea-espana',
    presetId: null,
    filtered: null,
    resolved: { selected: { oldid: 99, label: 'Reg' } }
  };
  const manifest = buildSessionManifest({ ...legacyBase, decks });
  const slice = projectSlice(manifest, SCENE_IDS.viewUi);
  assert.equal(slice.registros.oldid, 99);
  assert.equal(slice.wikitext.title, 'Wiki');
});

test('projectSlice operator exposes playhead, deck phases and selectionLast', () => {
  const decks = emptyDecksActor();
  decks.A = { phase: 'playing', serverName: 'linea-wp-historia', presetId: null, filtered: null, resolved: null };
  decks.B = { phase: 'cued', serverName: 'linea-espana', presetId: null, filtered: null, resolved: null };
  decks.C = { phase: 'empty', serverName: 'firehose-mcp-server', presetId: null, filtered: null, resolved: null };
  const manifest = buildSessionManifest({
    ...legacyBase,
    decks,
    playhead: { year: 2015, playing: true },
    selections: {
      last: { actorId: 'operator-ui', deckId: 'B', targetId: 42, label: 'operator pick' },
      byActor: {},
      log: []
    }
  });
  const slice = projectSlice(manifest, SCENE_IDS.operator);
  assert.equal(slice.sceneId, SCENE_IDS.operator);
  assert.equal(slice.phase, 'preparada');
  assert.equal(slice.playhead.year, 2015);
  assert.equal(slice.playhead.playing, true);
  assert.equal(slice.decks.A, 'playing');
  assert.equal(slice.decks.B, 'cued');
  assert.equal(slice.decks.C, 'empty');
  assert.equal(slice.selectionLast.actorId, 'operator-ui');
  assert.equal(slice.selectionLast.targetId, 42);
});
