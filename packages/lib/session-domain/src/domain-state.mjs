import {
  createEmptyMapSlice,
  ensureActorOnEngine,
  rebuildEngineFromSlice,
  resolveScene,
  sliceFromSnapshot
} from './map-slice.mjs';
import { reduceDomain } from './reducer.mjs';

/**
 * Mutable domain slice held by the session master (M2: authoritative map-engine).
 * @param {object} [options]
 * @param {string} [options.sceneId]
 */
export function createSessionDomainState(options = {}) {
  const scene = resolveScene(options.sceneId);
  let engine = rebuildEngineFromSlice(scene, createEmptyMapSlice(scene.id));
  /** @type {Map<string, { nodeId: string, slot: string, serverName: string, presetId?: string|null, phase?: string, resolved?: unknown }>} */
  const materialPins = new Map();
  /** @type {Record<string, object>} */
  const ontologyPatches = {};

  return {
    getMap: () => sliceFromSnapshot(engine.getSnapshot()),

    /** Apply a validated game:intent via the pure reducer (server authority). */
    applyGameIntent(payload) {
      const prev = sliceFromSnapshot(engine.getSnapshot());
      const next = reduceDomain(prev, payload);
      if (next === prev) {
        return { ok: false, error: 'intent_rechazada' };
      }
      engine = rebuildEngineFromSlice(scene, next);
      return { ok: true };
    },

    /**
     * Advance walk animations on the authoritative engine.
     * @returns {boolean} true when the map slice changed
     */
    tick(deltaSec) {
      const before = JSON.stringify(engine.getSnapshot().actors);
      engine.tick(deltaSec);
      engine.drainEvents();
      const after = JSON.stringify(engine.getSnapshot().actors);
      return before !== after;
    },

    ensureActor(actorId) {
      ensureActorOnEngine(engine, scene, actorId);
    },

    applyMaterialPin({ nodeId, slot, serverName, presetId }) {
      const key = `${nodeId}:${slot}`;
      materialPins.set(key, {
        nodeId,
        slot,
        serverName,
        presetId: presetId ?? null,
        phase: 'loading'
      });
    },

    applyMaterialUnpin({ nodeId, slot }) {
      materialPins.delete(`${nodeId}:${slot}`);
    },

    applyOntologyPatch({ nodeId, patch }) {
      ontologyPatches[nodeId] = {
        ...ontologyPatches[nodeId],
        ...patch
      };
    },

    /** @param {object} resolved */
    resolveMaterialPin({ nodeId, slot, resolved, phase = 'cued' }) {
      const key = `${nodeId}:${slot}`;
      const existing = materialPins.get(key);
      if (!existing) return;
      materialPins.set(key, { ...existing, resolved, phase });
    },

    snapshot() {
      return {
        map: sliceFromSnapshot(engine.getSnapshot()),
        materialPins,
        ontologyPatches
      };
    }
  };
}
