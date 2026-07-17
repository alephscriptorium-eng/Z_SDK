/**
 * XState 5 session machine for the Zeus DJ deck.
 * Session: idle → preparada → activa → cierre
 * Deck actor phases: empty → loading → cued → playing → degraded
 */

import { setup, assign } from 'xstate';
import { PARTE_CUES, emptyDeckActor, emptyDecksActor } from './deck-kit.mjs';

export { PARTE_CUES };

function hasLoadedDeck(decks) {
  return Object.values(decks).some(d => d.phase !== 'empty' && d.phase !== 'loading');
}

function allCuedOrPlaying(decks) {
  const active = Object.values(decks).filter(d => d.phase !== 'empty');
  return active.length > 0 && active.every(d => ['cued', 'playing', 'degraded'].includes(d.phase));
}

export const sessionMachine = setup({
  types: {
    context: {},
    events: {}
  },
  actions: {
    assignDeckLoading: assign({
      decks: ({ context, event }) => ({
        ...context.decks,
        [event.deckId]: {
          ...emptyDeckActor(),
          phase: 'loading',
          serverName: event.serverName,
          presetId: event.presetId ?? null
        }
      })
    }),
    assignDeckLoaded: assign({
      decks: ({ context, event }) => ({
        ...context.decks,
        [event.deckId]: {
          ...context.decks[event.deckId],
          phase: event.phase,
          filtered: event.filtered,
          resolved: event.resolved ?? context.decks[event.deckId]?.resolved ?? null
        }
      })
    }),
    assignDeckResolved: assign({
      decks: ({ context, event }) => ({
        ...context.decks,
        [event.deckId]: {
          ...context.decks[event.deckId],
          resolved: event.resolved,
          phase: event.phase ?? context.decks[event.deckId]?.phase
        }
      })
    }),
    assignDeckDegraded: assign({
      decks: ({ context, event }) => ({
        ...context.decks,
        [event.deckId]: {
          ...context.decks[event.deckId],
          phase: 'degraded'
        }
      })
    }),
    assignPlayhead: assign({
      playhead: ({ context, event }) => ({
        ...context.playhead,
        year: event.year
      })
    }),
    setPlaying: assign({
      playhead: ({ context }) => ({ ...context.playhead, playing: true })
    }),
    setPaused: assign({
      playhead: ({ context }) => ({ ...context.playhead, playing: false })
    }),
    toggleSync: assign({
      sync: ({ context }) => !context.sync
    }),
    assignCaso: assign({
      activeCaso: ({ event }) => event.casoId
    }),
    assignSelection: assign({
      selections: ({ context, event }) => {
        const ts = event.ts ?? Date.now();
        const entry = {
          actorId: event.actorId,
          kind: event.kind ?? 'registro',
          deckId: event.deckId ?? 'B',
          targetId: event.targetId ?? null,
          label: event.label ?? null,
          ts
        };
        const prev = context.selections ?? { last: null, byActor: {}, log: [] };
        return {
          last: entry,
          byActor: { ...prev.byActor, [entry.actorId]: entry },
          log: [...prev.log, entry].slice(-20)
        };
      }
    })
  },
  guards: {
    hasLoadedDeck: ({ context }) => hasLoadedDeck(context.decks),
    allCuedOrPlaying: ({ context }) => allCuedOrPlaying(context.decks)
  }
}).createMachine({
  id: 'session',
  initial: 'idle',
  context: {
    playhead: { year: 2010, playing: false },
    sync: true,
    activeCaso: 'aeo-p24-linea',
    decks: emptyDecksActor(),
    selections: { last: null, byActor: {}, log: [] }
  },
  states: {
    idle: {
      on: {
        DECK_LOADING: { target: 'preparada', actions: 'assignDeckLoading' },
        CASO_SET: { actions: 'assignCaso' },
        SELECTION_CAST: { actions: 'assignSelection' }
      }
    },
    preparada: {
      on: {
        DECK_LOADING: { actions: 'assignDeckLoading' },
        DECK_LOADED: [
          { guard: 'allCuedOrPlaying', target: 'activa', actions: 'assignDeckLoaded' },
          { actions: 'assignDeckLoaded' }
        ],
        DECK_RESOLVED: { actions: 'assignDeckResolved' },
        DECK_DEGRADED: { actions: 'assignDeckDegraded' },
        PLAYHEAD_SET: { actions: 'assignPlayhead' },
        SYNC_TOGGLE: { actions: 'toggleSync' },
        TRANSPORT_PLAY: { target: 'activa', actions: 'setPlaying' },
        TRANSPORT_PAUSE: { actions: 'setPaused' },
        CASO_SET: { actions: 'assignCaso' },
        SELECTION_CAST: { actions: 'assignSelection' },
        SESSION_CLOSE: 'cierre'
      }
    },
    activa: {
      on: {
        DECK_LOADING: { actions: 'assignDeckLoading' },
        DECK_LOADED: { actions: 'assignDeckLoaded' },
        DECK_RESOLVED: { actions: 'assignDeckResolved' },
        DECK_DEGRADED: { actions: 'assignDeckDegraded' },
        PLAYHEAD_SET: { actions: 'assignPlayhead' },
        SYNC_TOGGLE: { actions: 'toggleSync' },
        TRANSPORT_PLAY: { actions: 'setPlaying' },
        TRANSPORT_PAUSE: { target: 'preparada', actions: 'setPaused' },
        CASO_SET: { actions: 'assignCaso' },
        SELECTION_CAST: { actions: 'assignSelection' },
        SESSION_CLOSE: 'cierre'
      }
    },
    cierre: { type: 'final' }
  }
});

/**
 * Local xstate snapshot (not shared via room — authority owns game state).
 * @param {import('xstate').Actor} actor
 */
export function snapshotFromActor(actor) {
  const { value, context } = actor.getSnapshot();
  return {
    phase: value,
    playhead: context.playhead,
    sync: context.sync,
    activeCaso: context.activeCaso,
    decks: context.decks,
    selections: context.selections,
    parteCues: PARTE_CUES
  };
}
