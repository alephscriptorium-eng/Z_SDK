/**
 * Local deck inbound reducer (xstate + MCP side effects).
 * Pure table — no shared session domain / map slice (demolished WP-U31).
 */

const EMPTY = Object.freeze({
  actorEvents: Object.freeze([]),
  sideEffects: Object.freeze([]),
  broadcast: false
});

/**
 * @typedef {object} DeckReduction
 * @property {object[]} actorEvents
 * @property {('deckLoad'|'registroSelect'|'micropostSelect'|'firehoseCorpus'|'wikitextCache'|'wikitextPoll'|'resolveAllDecks'|'djCache'|'djCurate'|'djMilestone')[]} sideEffects
 * @property {boolean} broadcast
 * @property {object} [sideEffectPayload]
 */

/** @type {Record<string, (payload: object) => DeckReduction>} */
const INBOUND = {
  'domain:playhead:set': (payload) => ({
    actorEvents: [{ type: 'PLAYHEAD_SET', year: Number(payload.year) }],
    sideEffects: ['resolveAllDecks'],
    broadcast: true
  }),

  'sync:toggle': () => ({
    actorEvents: [{ type: 'SYNC_TOGGLE' }],
    sideEffects: [],
    broadcast: true
  }),

  'transport:play': () => ({
    actorEvents: [{ type: 'TRANSPORT_PLAY' }],
    sideEffects: [],
    broadcast: true
  }),

  'transport:pause': () => ({
    actorEvents: [{ type: 'TRANSPORT_PAUSE' }],
    sideEffects: [],
    broadcast: true
  }),

  'caso:set': (payload) => ({
    actorEvents: [{ type: 'CASO_SET', casoId: payload.casoId }],
    sideEffects: [],
    broadcast: true
  }),

  'selection:cast': (payload) => {
    const kind = payload.kind ?? 'registro';
    const deckId = payload.deckId ?? 'B';
    /** @type {DeckReduction} */
    const reduction = {
      actorEvents: [
        {
          type: 'SELECTION_CAST',
          ...payload,
          kind,
          deckId,
          ts: payload.ts ?? Date.now()
        }
      ],
      sideEffects: [],
      broadcast: true
    };
    if (kind === 'registro' && payload.targetId != null) {
      reduction.sideEffects = ['registroSelect'];
      reduction.sideEffectPayload = { deckId, oldid: payload.targetId };
      reduction.broadcast = false;
    }
    return reduction;
  },

  'domain:deck:load': (payload) => ({
    actorEvents: [],
    sideEffects: ['deckLoad'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'registro:select': (payload) => ({
    actorEvents: [],
    sideEffects: ['registroSelect'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'micropost:select': (payload) => ({
    actorEvents: [],
    sideEffects: ['micropostSelect'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'firehose:corpus': (payload) => ({
    actorEvents: [],
    sideEffects: ['firehoseCorpus'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'wikitext:cache': (payload) => ({
    actorEvents: [],
    sideEffects: ['wikitextCache', 'djCache'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'wikitext:poll': (payload) => ({
    actorEvents: [],
    sideEffects: ['wikitextPoll'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'dj:cache': (payload) => ({
    actorEvents: [],
    sideEffects: ['djCache'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'dj:curate': (payload) => ({
    actorEvents: [],
    sideEffects: ['djCurate'],
    broadcast: false,
    sideEffectPayload: payload
  }),

  'dj:milestone': (payload) => ({
    actorEvents: [],
    sideEffects: ['djMilestone'],
    broadcast: false,
    sideEffectPayload: payload
  })
};

/**
 * @param {string} event
 * @param {object} payload
 * @returns {DeckReduction}
 */
export function reduceDeckInbound(event, payload = {}) {
  const handler = INBOUND[event];
  if (!handler) return { ...EMPTY, actorEvents: [], sideEffects: [] };
  return handler(payload ?? {});
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
