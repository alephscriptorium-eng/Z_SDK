import { diffGameState } from '@zeus/protocol';

/**
 * Motor lógico del gamemap — sin red ni render.
 * Aplica reglas de gamethings (nodo / enlace / ancla).
 */

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function linkDistance(waypoints) {
  let d = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    d += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return d || 1;
}

export function sampleLink(waypoints, progress) {
  const t = clamp(progress, 0, 1);
  const segments = [];
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const len = Math.hypot(
      waypoints[i].x - waypoints[i - 1].x,
      waypoints[i].y - waypoints[i - 1].y,
      waypoints[i].z - waypoints[i - 1].z,
    );
    segments.push({ from: waypoints[i - 1], to: waypoints[i], len });
    total += len;
  }
  let target = t * total;
  for (const seg of segments) {
    if (target <= seg.len || seg === segments[segments.length - 1]) {
      const u = seg.len > 0 ? target / seg.len : 0;
      return {
        x: seg.from.x + (seg.to.x - seg.from.x) * u,
        y: seg.from.y + (seg.to.y - seg.from.y) * u,
        z: seg.from.z + (seg.to.z - seg.from.z) * u,
      };
    }
    target -= seg.len;
  }
  return { ...waypoints[waypoints.length - 1] };
}

/**
 * @param {object} scene — export de shared/scenes/*.mjs
 * @param {Record<string, object>} [initialActors]
 */
export function createMapEngine(scene, initialActors = {}) {
  const anchors = { ...scene.anclas };
  for (const a of Object.values(anchors)) {
    a.occupiedBy = a.occupiedBy ?? null;
  }

  const actors = structuredClone(initialActors);
  let tick = 0;
  const events = [];

  function pushEvent(name, payload) {
    events.push({ name, tick, ts: Date.now(), ...payload });
  }

  function getActor(id) {
    if (!actors[id]) {
      throw new Error(`actor desconocido: ${id}`);
    }
    return actors[id];
  }

  function releaseAnchor(anchorId) {
    if (!anchorId) return;
    const a = anchors[anchorId];
    if (a) a.occupiedBy = null;
  }

  function occupyAnchor(anchorId, actorId) {
    const a = anchors[anchorId];
    if (!a) throw new Error(`ancla desconocida: ${anchorId}`);
    if (a.occupiedBy && a.occupiedBy !== actorId) {
      return false;
    }
    a.occupiedBy = actorId;
    return true;
  }

  function applyIntent(actorId, intent) {
    const actor = getActor(actorId);
    const type = intent.intent ?? intent.type;

    if (type === 'sit') {
      const anchorId = intent.anchorId;
      const anchor = anchors[anchorId];
      if (!anchor) return { ok: false, error: 'ancla_invalida' };
      if (actor.zone !== anchor.parent) {
        return { ok: false, error: 'fuera_de_nodo' };
      }
      if (!occupyAnchor(anchorId, actorId)) {
        return { ok: false, error: 'ancla_ocupada' };
      }
      releaseAnchor(actor.anchorId);
      actor.zone = anchor.parent;
      actor.anchorId = anchorId;
      actor.linkId = null;
      actor.progress = null;
      actor.linkDirection = null;
      actor.pose = 'sit';
      actor.position = { ...anchor.position };
      pushEvent('anchor_occupied', { actorId, anchorId, nodeId: anchor.parent });
      return { ok: true };
    }

    if (type === 'walk') {
      const linkId = intent.linkId;
      const direction = intent.direction;
      const link = scene.enlaces[linkId];
      if (!link) return { ok: false, error: 'enlace_invalido' };

      const fromNode = direction === 'a-to-b' ? link.from : link.to;
      const toNode = direction === 'a-to-b' ? link.to : link.from;

      if (actor.zone !== fromNode) {
        return { ok: false, error: 'nodo_origen_incorrecto' };
      }
      if (actor.pose === 'walk' && actor.linkId === linkId) {
        return { ok: false, error: 'ya_caminando' };
      }

      releaseAnchor(actor.anchorId);
      actor.anchorId = null;
      actor.zone = linkId;
      actor.linkId = linkId;
      actor.linkDirection = direction;
      actor.pose = 'walk';
      actor.progress = direction === 'a-to-b' ? 0 : 1;
      actor.position = sampleLink(link.waypoints, actor.progress);
      pushEvent('link_enter', { actorId, linkId, direction });
      return { ok: true };
    }

    return { ok: false, error: 'intent_desconocida' };
  }

  function tickWalk(actor, deltaSec) {
    const link = scene.enlaces[actor.linkId];
    if (!link) return;

    const dist = linkDistance(link.waypoints);
    const sign = actor.linkDirection === 'a-to-b' ? 1 : -1;
    const prev = actor.progress;
    actor.progress = clamp(
      prev + sign * ((link.walkSpeed * deltaSec) / dist),
      0,
      1,
    );
    actor.position = sampleLink(link.waypoints, actor.progress);

    if (actor.progress !== prev) {
      pushEvent('link_progress', { actorId: actor.id, linkId: actor.linkId, progress: actor.progress });
    }

    const arrivedForward = actor.linkDirection === 'a-to-b' && prev < 1 && actor.progress >= 1;
    const arrivedBackward = actor.linkDirection === 'b-to-a' && prev > 0 && actor.progress <= 0;

    if (arrivedForward || arrivedBackward) {
      const endNode = actor.linkDirection === 'a-to-b' ? link.to : link.from;
      pushEvent('link_exit', { actorId: actor.id, linkId: actor.linkId, endNodeId: endNode });
      actor.zone = endNode;
      actor.linkId = null;
      actor.progress = null;
      actor.linkDirection = null;
      actor.pose = 'idle';
      const node = scene.nodos[endNode];
      actor.position = { ...node.entrada };

      const defaultAnchor = scene.defaultAnchorByNode?.[endNode];
      if (defaultAnchor) {
        applyIntent(actor.id, { intent: 'sit', anchorId: defaultAnchor });
      }
    }
  }

  return {
    sceneId: scene.id,

    registerActor(id, initial) {
      actors[id] = {
        id,
        zone: initial.zone,
        pose: initial.pose ?? 'idle',
        anchorId: initial.anchorId ?? null,
        linkId: initial.linkId ?? null,
        progress: initial.progress ?? null,
        linkDirection: initial.linkDirection ?? null,
        position: initial.position ?? { x: 0, y: 0, z: 0 },
        kind: initial.kind ?? 'gameobjects.alephillo-robot',
      };
      if (initial.anchorId) {
        occupyAnchor(initial.anchorId, id);
        const anchor = anchors[initial.anchorId];
        actors[id].position = { ...anchor.position };
      }
    },

    applyIntent(actorId, intent) {
      return applyIntent(actorId, intent);
    },

    tick(deltaSec) {
      tick += 1;
      for (const actor of Object.values(actors)) {
        if (actor.pose === 'walk' && actor.linkId) {
          tickWalk(actor, deltaSec);
        }
      }
    },

    getSnapshot() {
      return {
        sceneId: scene.id,
        tick,
        ts: Date.now(),
        actors: structuredClone(actors),
        anchors: Object.fromEntries(
          Object.entries(anchors).map(([id, a]) => [id, { occupiedBy: a.occupiedBy }]),
        ),
      };
    },

    /**
     * Delta v0.2 respecto a un snapshot previo (mismo shape que getSnapshot).
     * @param {object|null|undefined} prev
     * @param {object} [opts]
     */
    getDelta(prev, opts = {}) {
      return diffGameState(prev, this.getSnapshot(), opts);
    },

    drainEvents() {
      const out = [...events];
      events.length = 0;
      return out;
    },
  };
}
