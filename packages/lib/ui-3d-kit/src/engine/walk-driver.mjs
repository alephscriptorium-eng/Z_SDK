/**
 * walk-driver — thin, on-demand "walk actor from node A to node B" layer on
 * top of the pure map-engine.
 *
 * The map-engine already animates link progress 0→1 under `tick(dt)` and
 * auto-sits on arrival (see map-engine.mjs). What it does NOT expose is a
 * resolver that, given (fromNode, toNode), picks the correct link + direction
 * and injects the walk intent. That is exactly what event-choreographer needs
 * to turn `walk A→B` requests into engine intents, so it lives here as a thin
 * reusable layer.
 *
 * Pure logic — NO three.js, NO node builtins — so it is browser-safe (served
 * raw via the import map) and unit-testable under `node --test`.
 */

/**
 * Resolve the link + direction that walks an actor from `fromNode` to
 * `toNode` in a scene definition (nodos/enlaces/anclas).
 *
 * @param {object} scene engine scene def (e.g. vaivenDosNodos)
 * @param {string} fromNode origin node id
 * @param {string} toNode destination node id
 * @returns {{ linkId: string, direction: 'a-to-b'|'b-to-a' } | null}
 */
export function resolveWalk(scene, fromNode, toNode) {
  const enlaces = scene?.enlaces ?? {};
  for (const link of Object.values(enlaces)) {
    if (link.from === fromNode && link.to === toNode) {
      return { linkId: link.id, direction: 'a-to-b' };
    }
    if (link.from === toNode && link.to === fromNode && link.bidirectional) {
      return { linkId: link.id, direction: 'b-to-a' };
    }
  }
  return null;
}

/**
 * @param {object} deps
 * @param {object} deps.engine a map-engine instance (createMapEngine): needs
 *   `applyIntent(actorId, intent)` and `getSnapshot()`.
 * @param {object} deps.scene engine scene def used to resolve links.
 */
export function createWalkDriver({ engine, scene } = {}) {
  if (!engine || typeof engine.applyIntent !== 'function') {
    throw new Error('createWalkDriver: engine with applyIntent is required');
  }
  if (!scene) throw new Error('createWalkDriver: scene (engine def) is required');

  /** Current zone (node id or link id) of an actor per the engine snapshot. */
  function actorZone(actorId) {
    const snap = engine.getSnapshot?.();
    return snap?.actors?.[actorId]?.zone ?? null;
  }

  /**
   * Inject a walk intent between two explicit nodes.
   * @returns {{ ok: boolean, error?: string }} engine intent result
   */
  function walkBetween(actorId, fromNode, toNode) {
    const resolved = resolveWalk(scene, fromNode, toNode);
    if (!resolved) return { ok: false, error: 'sin_enlace' };
    return engine.applyIntent(actorId, {
      intent: 'walk',
      linkId: resolved.linkId,
      direction: resolved.direction,
    });
  }

  /**
   * Walk the actor toward `destNode` from wherever it currently sits/stands.
   * No-op (soft error) if it is already there or has no known node zone.
   * @returns {{ ok: boolean, error?: string }}
   */
  function walkToward(actorId, destNode) {
    const zone = actorZone(actorId);
    if (zone == null) return { ok: false, error: 'actor_sin_zona' };
    if (zone === destNode) return { ok: false, error: 'ya_en_destino' };
    return walkBetween(actorId, zone, destNode);
  }

  return {
    resolveWalk: (fromNode, toNode) => resolveWalk(scene, fromNode, toNode),
    actorZone,
    walkBetween,
    walkToward,
  };
}
