/**
 * reduceArgIntent — reducer puro del contrato §3 (gate G-ARG.4).
 *
 * Recibe una VISTA de solo lectura del dominio y un arg:intent, y devuelve
 * `{ ok, error?, ops }`. Nunca muta la vista; el domain-state aplica las ops.
 * Intent inválido ⇒ `{ ok:false, error }` con ops vacías (no-op, nunca throw).
 *
 * Vista esperada:
 * {
 *   scene, nav: { nodos, enlaces },
 *   actors, taps, corridors,           // estados actuales (solo lectura)
 *   contacts,
 *   dropletUnder(riverId, progress) → droplet | null,
 *   positionOf(subjectId) → {x,y,z} | null   // actores y grifos
 * }
 */

import { EMOTES, INTENTS } from './contract.mjs';
import { cloakModFor } from './cloak-mods.mjs';
import { seaLayout } from './sea-layout.mjs';

const SHORE_NODES = new Set(['orilla-mar', 'boya-1', 'boya-2']);

function fail(error) {
  return { ok: false, error, ops: [] };
}

function okOps(...ops) {
  return { ok: true, ops };
}

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

function seaLayoutPositions(view) {
  const droplets = view.seaDroplets?.() ?? [];
  return seaLayout(droplets, view.scene.mar).positions;
}

function actorNearSeaDroplet(view, actor, dropletId) {
  const positions = seaLayoutPositions(view);
  const pos = positions[dropletId];
  if (!pos) return false;
  if (actor.zone === 'mar') return true;
  if (actor.nodeId && SHORE_NODES.has(actor.nodeId)) {
    const nodePos = view.nav.nodos[actor.nodeId]?.position;
    if (nodePos && distance(nodePos, pos) <= view.scene.contactRadius) return true;
  }
  if (actor.position && distance(actor.position, pos) <= view.scene.contactRadius) return true;
  return false;
}

function resolveLink(view, actor, intent) {
  const { enlaces } = view.nav;
  if (intent.linkId) {
    const link = enlaces[intent.linkId];
    if (!link) return { error: 'enlace_invalido' };
    const direction = intent.direction === 'b-to-a' ? 'b-to-a' : 'a-to-b';
    const fromNode = direction === 'a-to-b' ? link.from : link.to;
    if (actor.nodeId !== fromNode) return { error: 'nodo_origen_incorrecto' };
    return { link, direction };
  }
  if (intent.nodeId) {
    for (const link of Object.values(enlaces)) {
      if (link.from === actor.nodeId && link.to === intent.nodeId)
        return { link, direction: 'a-to-b' };
      if (link.to === actor.nodeId && link.from === intent.nodeId)
        return { link, direction: 'b-to-a' };
    }
    return { error: 'sin_enlace' };
  }
  return { error: 'destino_requerido' };
}

const HANDLERS = {
  join(view, intent) {
    if (view.actors[intent.actorId]) return okOps(); // idempotente (reconexión)
    const spawn = view.nav.nodos[view.scene.spawnNodeId];
    return okOps({
      op: 'actor:add',
      actor: {
        id: intent.actorId,
        kind: intent.kind === 'agent' || intent.kind === 'artefacto' ? intent.kind : 'player',
        tier: intent.tier === 'puppet' ? 'puppet' : 'stick',
        cloak: intent.cloak ?? null,
        zone: spawn.zone,
        nodeId: spawn.id,
        linkId: null,
        direction: null,
        progress: null,
        riding: null,
        pose: 'idle',
        emote: null,
        score: { labeled: 0, excavated: 0 }
      }
    });
  },

  move(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    if (actor.riding) return fail('montado_en_rio');
    if (actor.linkId) return fail('ya_caminando');
    const resolved = resolveLink(view, actor, intent);
    if (resolved.error) return fail(resolved.error);
    const { link, direction } = resolved;
    if (link.medium === 'agua' && !cloakModFor(actor.cloak?.presetId).swimAllowed) {
      return fail('nadar_no_permitido');
    }
    if (link.corridorId && view.corridors[link.corridorId]?.state !== 'open') {
      return fail('pasillo_cerrado');
    }
    const toNode = direction === 'a-to-b' ? link.to : link.from;
    return okOps({
      op: 'actor:patch',
      id: actor.id,
      patch: {
        nodeId: null,
        linkId: link.id,
        direction,
        progress: direction === 'a-to-b' ? 0 : 1,
        pose: link.medium === 'agua' ? 'swim' : 'walk',
        zone: view.nav.nodos[toNode].zone
      }
    });
  },

  swim(view, intent) {
    return HANDLERS.move(view, intent);
  },

  ride(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    if (actor.riding) return fail('ya_montado');
    const river = view.scene.rios[intent.riverId];
    if (!river) return fail('rio_invalido');
    if (actor.nodeId !== river.embarkNodeId) return fail('fuera_de_embarcadero');
    return okOps({
      op: 'actor:patch',
      id: actor.id,
      patch: {
        nodeId: null,
        linkId: null,
        direction: null,
        progress: null,
        riding: { riverId: river.id, progress: river.embarkProgress },
        pose: 'ride',
        zone: 'rio'
      }
    });
  },

  dismount(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    if (!actor.riding) return fail('no_montado');
    const river = view.scene.rios[actor.riding.riverId];
    const nodeId = actor.riding.progress < 0.75 ? river.embarkNodeId : river.mouthNodeId;
    return okOps({
      op: 'actor:patch',
      id: actor.id,
      patch: {
        riding: null,
        nodeId,
        pose: 'idle',
        zone: view.nav.nodos[nodeId].zone
      }
    });
  },

  'tap:set'(view, intent) {
    const tap = view.taps[intent.tapId];
    if (!tap) return fail('grifo_invalido');
    const aperture = Number(intent.aperture);
    if (!Number.isFinite(aperture) || aperture < 0 || aperture > 1) return fail('apertura_invalida');
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const [x, y] = [intent.actorId, intent.tapId].sort();
    const contactId = `c-${x}--${y}`;
    if (view.contacts[contactId]?.state !== 'open') return fail('sin_contacto');
    return okOps({ op: 'tap:aperture', tapId: tap.id, value: aperture });
  },

  'label:cast'(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    if (!actor.riding) return fail('no_montado');
    if (!view.scene.labelset.includes(intent.label)) return fail('etiqueta_invalida');
    const droplet = view.dropletUnder(actor.riding.riverId, actor.riding.progress);
    if (!droplet) return fail('sin_gota');
    if (intent.dropletId && intent.dropletId !== droplet.id) return fail('gota_lejana');
    if (droplet.label) return fail('ya_etiquetada');
    return okOps(
      { op: 'droplet:label', riverId: actor.riding.riverId, dropletId: droplet.id, label: intent.label, actorId: actor.id },
      { op: 'actor:score', id: actor.id, key: 'labeled' }
    );
  },

  excavate(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const corridor = view.corridors[intent.corridorId];
    if (!corridor) return fail('pasillo_invalido');
    if (corridor.state !== 'ghost') return fail(corridor.state === 'open' ? 'ya_abierto' : 'ya_excavando');
    if (actor.nodeId !== corridor.a && actor.nodeId !== corridor.b) return fail('fuera_de_camara');
    return okOps(
      { op: 'corridor:excavate', corridorId: intent.corridorId, actorId: actor.id, approval: intent.approval ?? null },
      { op: 'actor:score', id: actor.id, key: 'excavated' }
    );
  },

  'contact:request'(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const targetIsActor = Boolean(view.actors[intent.targetId]);
    const targetIsTap = Boolean(view.taps[intent.targetId]);
    if (!targetIsActor && !targetIsTap) return fail('objetivo_desconocido');
    if (intent.targetId === intent.actorId) return fail('contacto_consigo');
    const a = view.positionOf(intent.actorId);
    const b = view.positionOf(intent.targetId);
    if (!a || !b) return fail('sin_posicion');
    if (distance(a, b) > view.scene.contactRadius) return fail('fuera_de_alcance');
    const [x, y] = [intent.actorId, intent.targetId].sort();
    const id = `c-${x}--${y}`;
    if (view.contacts[id]?.state === 'open') return okOps(); // idempotente
    return okOps({
      op: 'contact:set',
      contact: { id, a: intent.actorId, b: intent.targetId, state: 'open', openedAt: intent.ts ?? null }
    });
  },

  'contact:close'(view, intent) {
    const contact = view.contacts[intent.contactId];
    if (!contact) return fail('contacto_desconocido');
    if (contact.a !== intent.actorId && contact.b !== intent.actorId) return fail('no_participa');
    return okOps({ op: 'contact:remove', contactId: intent.contactId });
  },

  emote(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    if (!EMOTES.includes(intent.name)) return fail('emote_invalido');
    return okOps({ op: 'actor:patch', id: actor.id, patch: { emote: intent.name, emoteTs: intent.ts ?? null } });
  },

  'cloak:equip'(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const presetId = intent.presetId;
    if (typeof presetId !== 'string' || !presetId) return fail('preset_requerido');
    const label = intent.label ?? presetId;
    return okOps({
      op: 'actor:patch',
      id: actor.id,
      patch: { cloak: { presetId, label } }
    });
  },

  salvage(view, intent) {
    if (view.sea?.collapsed) return fail('mar_colapsado');
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const droplet = view.seaDropletById?.(intent.dropletId);
    if (!droplet || droplet.state !== 'sunken') return fail('gota_invalida');
    if (!view.scene.labelset.includes(intent.label)) return fail('etiqueta_invalida');
    if (!actorNearSeaDroplet(view, actor, intent.dropletId)) return fail('fuera_de_alcance');
    return okOps(
      { op: 'sea:salvage', dropletId: intent.dropletId, label: intent.label, actorId: actor.id },
      { op: 'actor:score', id: actor.id, key: 'labeled' }
    );
  },

  'track:cast'(view, intent) {
    const actor = view.actors[intent.actorId];
    if (!actor) return fail('actor_desconocido');
    const droplet = view.seaDropletById?.(intent.dropletId);
    if (!droplet) return fail('gota_invalida');
    return { ok: true, ops: [], trackCast: { ref: droplet.ref } };
  }
};

export function reduceArgIntent(view, intent) {
  if (!intent || typeof intent.actorId !== 'string' || !intent.actorId) return fail('actor_requerido');
  if (!INTENTS.includes(intent.intent)) return fail('intent_desconocida');
  return HANDLERS[intent.intent](view, intent);
}
