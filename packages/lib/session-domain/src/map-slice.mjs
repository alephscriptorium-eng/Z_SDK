import { createMapEngine, vaivenDosNodos } from '@zeus/ui-3d-kit';

/**
 * Empty authoritative map slice (actors filled by reducer / game:intent).
 * @param {string} [sceneId]
 */
export function createEmptyMapSlice(sceneId = vaivenDosNodos.id) {
  const scene = resolveScene(sceneId);
  return {
    sceneId: scene.id,
    tick: 0,
    actors: {},
    anchors: Object.fromEntries(
      Object.keys(scene.anclas ?? {}).map((id) => [id, { occupiedBy: null }])
    )
  };
}

/**
 * @param {string} [sceneId]
 */
export function resolveScene(sceneId) {
  if (!sceneId || sceneId === vaivenDosNodos.id) return vaivenDosNodos;
  return vaivenDosNodos;
}

/**
 * Serializable map slice from a map-engine snapshot.
 * @param {object} snap
 */
export function sliceFromSnapshot(snap) {
  return {
    sceneId: snap.sceneId,
    tick: snap.tick,
    actors: structuredClone(snap.actors ?? {}),
    anchors: structuredClone(snap.anchors ?? {})
  };
}

/**
 * Rebuild a map-engine from a persisted slice (for pure reduceDomain).
 * @param {object} scene
 * @param {object} mapSlice
 */
export function rebuildEngineFromSlice(scene, mapSlice) {
  const engine = createMapEngine(structuredClone(scene), {});
  for (const actor of Object.values(mapSlice.actors ?? {})) {
    engine.registerActor(actor.id, {
      zone: actor.zone,
      pose: actor.pose,
      anchorId: actor.anchorId ?? null,
      linkId: actor.linkId ?? null,
      progress: actor.progress ?? null,
      linkDirection: actor.linkDirection ?? null,
      position: actor.position,
      kind: actor.kind
    });
  }
  return engine;
}

/**
 * Register a new actor at the first free anchor (or idle at home node).
 * @param {object} engine
 * @param {object} scene
 * @param {string} actorId
 */
export function ensureActorOnEngine(engine, scene, actorId) {
  const snap = engine.getSnapshot();
  if (snap.actors[actorId]) return;

  const nodeIds = Object.keys(scene.nodos ?? {});
  const homeNode = nodeIds[0] ?? null;
  const anclas = Object.values(scene.anclas ?? {});
  const anchor = anclas.find((a) => !snap.anchors[a.id]?.occupiedBy) ?? anclas[0] ?? null;

  if (anchor) {
    engine.registerActor(actorId, {
      zone: anchor.parent,
      anchorId: anchor.id,
      pose: 'sit'
    });
    return;
  }

  engine.registerActor(actorId, {
    zone: homeNode,
    pose: 'idle'
  });
}
