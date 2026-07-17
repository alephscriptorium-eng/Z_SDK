/**
 * player-3d-ui browser entry (ESM, resolved via the page import map).
 *
 * Builds the vaivén-dos-nodos map scene from @zeus/ui-3d-kit over
 * @zeus/view-kit stage/HUD/room wiring, wires a live event-choreographer,
 * and spawns puppets ON DEMAND as presence is detected.
 * Map poses are **projected** via `projectSlice(session, 'player-3d')` (L-session M3);
 * the viewer emits game:intent — it is not map authority (L-session M2).
 */

import {
  createNodeMesh,
  createAnchorMarker,
  createLinkCorridorBetween,
  createMapSceneAdapter,
  loadPuppet,
  resolveWalk,
  vaivenDosNodos
} from '@zeus/ui-3d-kit';
import {
  createViewerScene,
  setText,
  readViewerConfig,
  connectRoom
} from '@zeus/view-kit';
import { projectSlice, SCENE_IDS } from './local-projection.mjs';
import { createEventChoreographer } from './event-choreographer.mjs';

function buildStage(scene) {
  for (const nodo of Object.values(vaivenDosNodos.nodos)) {
    const mesh = createNodeMesh({ name: nodo.id, radius: 3 });
    mesh.position.set(nodo.entrada.x, nodo.entrada.y, nodo.entrada.z);
    scene.add(mesh);
  }
  const link = vaivenDosNodos.enlaces['enlace-ab'];
  const wp = link.waypoints;
  scene.add(createLinkCorridorBetween(wp[0], wp[wp.length - 1], { width: 2 }));
  for (const anchor of Object.values(vaivenDosNodos.anclas)) {
    scene.add(createAnchorMarker({
      name: anchor.id,
      position: anchor.position,
      facing: anchor.facing
    }));
  }
}

function reflectSlice(slice, envelope) {
  setText('hud-playhead', slice.playhead?.year);
  const deckBSel = slice.deckBSelected;
  setText('hud-deckB-sel', deckBSel?.label ?? deckBSel?.oldid ?? deckBSel ?? '—');
  setText('hud-seq', envelope?.seq ?? '—');
}

function reflectSnapshot(snapshot, envelope) {
  const slice = projectSlice(snapshot, SCENE_IDS.player3d);
  reflectSlice(slice, envelope);

  const decks = snapshot.decks || {};
  const deckLabel = (d) => {
    if (!d) return '—';
    return d.preset || d.presetId || d.id || d.selected || (typeof d === 'string' ? d : '(loaded)');
  };
  setText('hud-deckA', deckLabel(decks.A));
  setText('hud-deckB', deckLabel(decks.B));

  const last = snapshot.selections?.last ?? snapshot.ontologia?.selections?.last;
  if (last) {
    setText('hud-sel', `${last.actorId ?? '?'} → ${last.targetId ?? '?'}${last.label ? ` (${last.label})` : ''}`);
  }
}

function emptyMapSlice() {
  return {
    sceneId: vaivenDosNodos.id,
    tick: 0,
    actors: {},
    anchors: Object.fromEntries(
      Object.keys(vaivenDosNodos.anclas ?? {}).map((id) => [id, { occupiedBy: null }])
    )
  };
}

async function main() {
  const cfg = readViewerConfig();
  const stage = createViewerScene({
    camera: { fov: 60, near: 0.1, far: 500, position: [14, 10, 20] },
    controls: { minDistance: 4, maxDistance: 120, maxPolarAngle: Math.PI / 2 }
  });
  const { sceneManager, scene } = stage;
  buildStage(scene);

  const adapter = createMapSceneAdapter({
    scene: vaivenDosNodos,
    sceneManager,
    puppetFactory: (id, opts = {}) =>
      loadPuppet(opts.url || '/models/SK_Alephillo.glb', { scale: opts.scale ?? 1 })
  });

  let authoritativeMap = emptyMapSlice();
  const mapSource = { getSnapshot: () => authoritativeMap };

  const hud = {
    reflect: (snapshot, envelope) => reflectSnapshot(snapshot, envelope),
    selection: ({ text }) => setText('hud-sel', text),
    event: ({ kind, actorId }) => setText('hud-event', `${kind} · ${actorId}`),
    presence: ({ actorId }) => setText('hud-event', `join · ${actorId}`)
  };

  const room = connectRoom(cfg);

  const choreographer = createEventChoreographer({
    adapter,
    scene: vaivenDosNodos,
    mapSource,
    emitGameIntent: (payload) => room.emit('game:intent', payload),
    resolveWalk: (from, to) => resolveWalk(vaivenDosNodos, from, to),
    hud
  });

  stage.onFrame((dt) => {
    adapter.applySnapshot(authoritativeMap);
    adapter.update(dt);
    choreographer.update?.(dt);
  });
  stage.start();

  room.onRoomEvent('PING', (payload) => choreographer.onPing(payload));
  room.onRoomEvent('PONG', (payload) => choreographer.onPong(payload));
  room.onRoomEvent('selection:cast', (payload) => choreographer.onSelection(payload));
  room.onState((snapshot, envelope) => {
    setText('hud-conn', 'live');
    const slice = projectSlice(snapshot, SCENE_IDS.player3d);
    authoritativeMap = slice.map ?? emptyMapSlice();
    adapter.applySnapshot(authoritativeMap);
    for (const actor of Object.values(authoritativeMap.actors ?? {})) {
      choreographer.ensurePresence(actor.id);
    }
    reflectSlice(slice, envelope);
    choreographer.onSnapshot(snapshot, envelope);
  });

  window.addEventListener('beforeunload', () => {
    room.disconnect();
    adapter.dispose();
    stage.dispose();
  });
}

main().catch((err) => console.error('[viewer] fatal:', err));
