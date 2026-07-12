/**
 * Session master reducer (L-session M1+M2).
 * Pure reduction of inbound ROOM_MESSAGE events → actor/domain mutations.
 * IO side effects (deck resolve, MCP) are flagged for the master layer.
 */

import {
  ensureActorOnEngine,
  rebuildEngineFromSlice,
  resolveScene,
  sliceFromSnapshot
} from './map-slice.mjs';

/**
 * @typedef {object} DomainOp
 * @property {'gameIntent'|'materialPin'|'materialUnpin'|'ontologyPatch'} op
 * @property {object} payload
 */

/**
 * @typedef {object} SessionReduction
 * @property {object[]} actorEvents
 * @property {DomainOp[]} domainOps
 * @property {('deckLoad'|'registroSelect'|'micropostSelect'|'firehoseCorpus'|'wikitextCache'|'wikitextPoll'|'resolveAllDecks')[]} sideEffects
 * @property {boolean} broadcast
 * @property {object} [sideEffectPayload]
 */

const EMPTY = /** @type {SessionReduction} */ ({
  actorEvents: [],
  domainOps: [],
  sideEffects: [],
  broadcast: false
});

/**
 * Pure authoritative gamemap reducer (D1 / G-DM.1).
 * Invalid intents return the input slice unchanged (G-DM.2).
 * @param {object} mapSlice
 * @param {object} intent
 */
export function reduceDomain(mapSlice, intent) {
  if (!intent?.actorId || !intent?.intent) return mapSlice;

  const scene = resolveScene(mapSlice.sceneId);
  const engine = rebuildEngineFromSlice(scene, mapSlice);
  ensureActorOnEngine(engine, scene, intent.actorId);

  const snapBefore = engine.getSnapshot();
  const actorBefore = snapBefore.actors[intent.actorId];
  if (
    intent.intent === 'sit' &&
    actorBefore?.anchorId === intent.anchorId &&
    actorBefore?.pose === 'sit'
  ) {
    return sliceFromSnapshot(snapBefore);
  }

  const result = engine.applyIntent(intent.actorId, {
    intent: intent.intent,
    anchorId: intent.anchorId,
    linkId: intent.linkId,
    direction: intent.direction
  });

  if (!result.ok) return mapSlice;
  return sliceFromSnapshot(engine.getSnapshot());
}

/**
 * @param {string} event
 * @param {object} payload
 * @returns {SessionReduction}
 */
export function reduceSessionInbound(event, payload) {
  switch (event) {
    case 'domain:playhead:set':
      return {
        actorEvents: [{ type: 'PLAYHEAD_SET', year: Number(payload.year) }],
        domainOps: [],
        sideEffects: ['resolveAllDecks'],
        broadcast: true
      };

    case 'sync:toggle':
      return {
        actorEvents: [{ type: 'SYNC_TOGGLE' }],
        domainOps: [],
        sideEffects: [],
        broadcast: true
      };

    case 'transport:play':
      return {
        actorEvents: [{ type: 'TRANSPORT_PLAY' }],
        domainOps: [],
        sideEffects: [],
        broadcast: true
      };

    case 'transport:pause':
      return {
        actorEvents: [{ type: 'TRANSPORT_PAUSE' }],
        domainOps: [],
        sideEffects: [],
        broadcast: true
      };

    case 'caso:set':
      return {
        actorEvents: [{ type: 'CASO_SET', casoId: payload.casoId }],
        domainOps: [],
        sideEffects: [],
        broadcast: true
      };

    case 'selection:cast': {
      const kind = payload.kind ?? 'registro';
      const deckId = payload.deckId ?? 'B';
      const reduction = {
        actorEvents: [{
          type: 'SELECTION_CAST',
          ...payload,
          kind,
          deckId,
          ts: payload.ts ?? Date.now()
        }],
        domainOps: [],
        sideEffects: /** @type {SessionReduction['sideEffects']} */ ([]),
        broadcast: true
      };
      if (kind === 'registro' && payload.targetId != null) {
        reduction.sideEffects.push('registroSelect');
        reduction.sideEffectPayload = { deckId, oldid: payload.targetId };
        reduction.broadcast = false;
      }
      return reduction;
    }

    case 'game:intent':
      return {
        actorEvents: [],
        domainOps: [{ op: 'gameIntent', payload }],
        sideEffects: [],
        broadcast: true
      };

    case 'material:pin':
      return {
        actorEvents: [],
        domainOps: [{ op: 'materialPin', payload }],
        sideEffects: [],
        broadcast: true
      };

    case 'material:unpin':
      return {
        actorEvents: [],
        domainOps: [{ op: 'materialUnpin', payload }],
        sideEffects: [],
        broadcast: true
      };

    case 'node:ontology:set':
      return {
        actorEvents: [],
        domainOps: [{ op: 'ontologyPatch', payload }],
        sideEffects: [],
        broadcast: true
      };

    case 'domain:deck:load':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['deckLoad'],
        broadcast: false,
        sideEffectPayload: payload
      };

    case 'registro:select':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['registroSelect'],
        broadcast: false,
        sideEffectPayload: payload
      };

    case 'micropost:select':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['micropostSelect'],
        broadcast: false,
        sideEffectPayload: payload
      };

    case 'firehose:corpus':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['firehoseCorpus'],
        broadcast: false,
        sideEffectPayload: payload
      };

    case 'wikitext:cache':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['wikitextCache'],
        broadcast: false,
        sideEffectPayload: payload
      };

    case 'wikitext:poll':
      return {
        actorEvents: [],
        domainOps: [],
        sideEffects: ['wikitextPoll'],
        broadcast: false,
        sideEffectPayload: payload
      };

    default:
      return { ...EMPTY };
  }
}

/**
 * @param {import('xstate').Actor} actor
 * @param {object[]} actorEvents
 */
export function applyActorEvents(actor, actorEvents) {
  for (const ev of actorEvents) {
    actor.send(ev);
  }
}

/**
 * @param {ReturnType<import('./domain-state.mjs').createSessionDomainState>|null|undefined} domainState
 * @param {DomainOp[]} domainOps
 */
export function applyDomainOps(domainState, domainOps) {
  if (!domainState) return;
  for (const { op, payload } of domainOps) {
    switch (op) {
      case 'gameIntent':
        domainState.applyGameIntent(payload);
        break;
      case 'materialPin':
        domainState.applyMaterialPin(payload);
        break;
      case 'materialUnpin':
        domainState.applyMaterialUnpin(payload);
        break;
      case 'ontologyPatch':
        domainState.applyOntologyPatch(payload);
        break;
      default:
        break;
    }
  }
}
