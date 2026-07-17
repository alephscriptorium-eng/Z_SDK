/**
 * pozo — dominio puro (sin red, sin fs, sin Date.now escondido).
 * Un pozo, nodos, feed que gotea, UN intent con ledger: draw_drop.
 */

import { INTENTS, POZO_SCENE, validateIntent } from './contract.mjs';

/**
 * @param {{ now?: () => number }} [opts]
 */
export function createPozoDomainState(opts = {}) {
  const clock = typeof opts.now === 'function' ? opts.now : () => Date.now();

  /** @type {Record<string, { id: string, kind: string, nodeId: string, joinedAt: number }>} */
  const actors = {};
  let wellLevel = POZO_SCENE.well.startLevel;
  let dripAcc = 0;
  let dropSeq = 0;
  let ledgerSeq = 0;
  let contentRev = 0;
  /** @type {{ id: string, label: string, actorId: string, ts: number }|null} */
  let lastDrop = null;
  /** @type {object[]} */
  const ledgerOut = [];
  /** @type {object[]} */
  const trackOut = [];

  const handlers = {
    join(payload) {
      const { actorId } = payload;
      if (!actorId || typeof actorId !== 'string') {
        return { ok: false, error: 'actor_requerido' };
      }
      if (!actors[actorId]) {
        actors[actorId] = {
          id: actorId,
          kind: payload.kind === 'operator' ? 'operator' : 'player',
          nodeId: 'orilla',
          joinedAt: clock()
        };
        contentRev += 1;
      }
      return { ok: true, error: null };
    },

    draw_drop(payload) {
      const { actorId, label } = payload;
      if (!actors[actorId]) {
        return { ok: false, error: 'actor_desconocido' };
      }
      if (typeof label !== 'string' || !label.trim()) {
        return { ok: false, error: 'label_requerido' };
      }
      const trimmed = label.trim().slice(0, 64);
      if (wellLevel < 1) {
        return { ok: false, error: 'pozo_seco' };
      }
      wellLevel -= 1;
      dropSeq += 1;
      ledgerSeq += 1;
      const ts = clock();
      const dropId = `drop-${dropSeq}`;
      lastDrop = { id: dropId, label: trimmed, actorId, ts };
      ledgerOut.push({
        kind: 'label',
        seq: ledgerSeq,
        actorId,
        label: trimmed,
        dropId,
        ts,
        detail: { wellLevel, nodeId: actors[actorId].nodeId }
      });
      trackOut.push({
        actorId,
        hint: 'drop-label',
        ref: { kind: 'drop', id: dropId, label: trimmed },
        ts
      });
      contentRev += 1;
      return { ok: true, error: null };
    }
  };

  return {
    applyIntent(payload) {
      const gate = validateIntent(payload, INTENTS);
      if (!gate.ok) return gate;
      const handler = handlers[payload.intent];
      if (!handler) return { ok: false, error: 'intent_desconocido' };
      return handler(payload);
    },

    /**
     * Feed: el eco gotea y rellena el pozo hasta capacity.
     * @param {number} deltaSec
     * @param {number} [_now]
     */
    tick(deltaSec, _now) {
      if (deltaSec <= 0) return;
      if (wellLevel >= POZO_SCENE.well.capacity) {
        dripAcc = 0;
        return;
      }
      dripAcc += deltaSec * POZO_SCENE.well.dripPerSec;
      const gained = Math.floor(dripAcc);
      if (gained < 1) return;
      dripAcc -= gained;
      const next = Math.min(POZO_SCENE.well.capacity, wellLevel + gained);
      if (next !== wellLevel) {
        wellLevel = next;
        contentRev += 1;
      }
    },

    snapshot(reason, _opts = {}) {
      return {
        ts: clock(),
        reason,
        sceneId: POZO_SCENE.id,
        actors: { ...actors },
        well: {
          level: wellLevel,
          capacity: POZO_SCENE.well.capacity,
          lastDrop: lastDrop ? { ...lastDrop } : null
        },
        feed: {
          id: POZO_SCENE.feed.id,
          lines: [...POZO_SCENE.feed.lines],
          dripAcc
        },
        nodes: POZO_SCENE.nodes,
        links: POZO_SCENE.links
      };
    },

    drainOutbox() {
      const out = { ledger: [...ledgerOut], tracks: [...trackOut] };
      ledgerOut.length = 0;
      trackOut.length = 0;
      return out;
    },

    contentRev: () => contentRev,

    /** Dry-run explicable (MCP confirmIntent / explain). */
    explainIntent(payload) {
      const gate = validateIntent(payload, INTENTS);
      if (!gate.ok) return gate;
      if (payload.intent === 'join') return { ok: true, error: null };
      if (payload.intent === 'draw_drop') {
        if (!actors[payload.actorId]) return { ok: false, error: 'actor_desconocido' };
        if (typeof payload.label !== 'string' || !payload.label.trim()) {
          return { ok: false, error: 'label_requerido' };
        }
        if (wellLevel < 1) return { ok: false, error: 'pozo_seco' };
        return { ok: true, error: null };
      }
      return { ok: false, error: 'intent_desconocido' };
    }
  };
}
