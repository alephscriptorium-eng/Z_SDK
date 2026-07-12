/** Deck slot → ARG node binding (vaiven-dos-nodos MVP). */
export const DECK_NODE_BINDINGS = {
  A: { nodeId: 'nodo-a', slot: 'deck-a' },
  B: { nodeId: 'nodo-b', slot: 'deck-b' },
  C: { nodeId: 'nodo-b', slot: 'firehose' }
};

/** @param {string} deckId */
export function nodeIdForDeck(deckId) {
  return DECK_NODE_BINDINGS[deckId]?.nodeId ?? null;
}

/** @param {string} deckId */
export function slotForDeck(deckId) {
  return DECK_NODE_BINDINGS[deckId]?.slot ?? null;
}
