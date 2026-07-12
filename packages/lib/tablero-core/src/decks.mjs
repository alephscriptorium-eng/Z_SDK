import { DECK_IDS } from './constants.mjs';

/** Empty deck actor context (XState session machine). */
export function emptyDeckActor() {
  return {
    phase: 'empty',
    serverName: null,
    presetId: null,
    filtered: null,
    resolved: null
  };
}

/** Initial decks map for the session machine. */
export function emptyDecksActor() {
  return Object.fromEntries(DECK_IDS.map((id) => [id, emptyDeckActor()]));
}

/** Null slots for monitor snapshots when session is not yet available. */
export function emptyDeckSlots() {
  return Object.fromEntries(DECK_IDS.map((id) => [id, null]));
}

/**
 * @param {object|null|undefined} deck
 */
export function summarizeDeck(deck) {
  if (!deck) return null;
  const resolved = deck.resolved;
  const base = {
    phase: deck.phase,
    serverName: deck.serverName,
    presetId: deck.presetId,
    year: resolved?.year ?? null
  };

  if (resolved?.kind === 'firehose') {
    return {
      ...base,
      kind: 'firehose',
      corpus: resolved.corpus ?? null,
      path: resolved.path ?? null,
      selectedHandle: resolved.selected?.handle ?? null,
      postsCount: Array.isArray(resolved.posts?.items) ? resolved.posts.items.length : null
    };
  }

  const nodoId = resolved?.nodo?.nodo?.id || resolved?.nodo?.id || null;
  return {
    ...base,
    kind: 'linea',
    nodoId,
    wikitextCached: resolved?.wikitext?.cached === true,
    registrosCount: resolved?.registros?.total ?? null
  };
}

/**
 * @param {Record<string, object|null|undefined>} decks
 */
export function summarizeDecks(decks = {}) {
  return Object.fromEntries(DECK_IDS.map((id) => [id, summarizeDeck(decks[id])]));
}
