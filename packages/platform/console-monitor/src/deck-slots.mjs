/**
 * Deck slot constants for console-monitor (tablero-core demolished WP-U31).
 * Mirrors player-ui deck-kit ids — monitor satellite of the DJ board.
 */

export const DECK_IDS = Object.freeze(['A', 'B', 'C']);
export const WIKITEXT_DECK_IDS = Object.freeze(['A', 'B']);
export const FIREHOSE_DECK_ID = 'C';
export const PARTE_CUES = Object.freeze([
  Object.freeze({ id: 'I', label: 'I', year: 450 }),
  Object.freeze({ id: 'II', label: 'II', year: 1350 }),
  Object.freeze({ id: 'III', label: 'III', year: 1808 }),
  Object.freeze({ id: 'IV', label: 'IV', year: 1978 })
]);

export function emptyDeckSlots() {
  return Object.fromEntries(DECK_IDS.map((id) => [id, null]));
}

export function normalizeNodoId(nodoId) {
  const raw = String(nodoId).trim().toUpperCase();
  return raw.startsWith('P') ? raw : `P${raw}`;
}

export function findAnchorCell(anchors, nodoId) {
  const grid = anchors?.grid ?? anchors;
  const cells = grid?.cells;
  if (!Array.isArray(cells)) return null;
  const target = normalizeNodoId(nodoId);
  return cells.find((c) => normalizeNodoId(c.nodo_id) === target) ?? null;
}

export function summarizeDeck(deck) {
  if (!deck) return null;
  return {
    phase: deck.phase,
    serverName: deck.serverName,
    presetId: deck.presetId
  };
}

export function summarizeDecks(decks = {}) {
  return Object.fromEntries(DECK_IDS.map((id) => [id, summarizeDeck(decks[id])]));
}

export function normalizePresetsList(presets) {
  if (Array.isArray(presets)) return presets;
  if (presets?.presets) return presets.presets;
  if (presets?.items) return presets.items;
  return [];
}

export function resolveTableroDefaults({
  alephConfig = {},
  presets = [],
  lineaId = alephConfig.defaultLinea || 'espana',
  presetIdOverrides = {}
} = {}) {
  const servers = {
    A: alephConfig.lineaServers?.[lineaId]?.tronco ?? 'linea-espana',
    B: alephConfig.lineaServers?.[lineaId]?.satelite ?? 'linea-wp-historia',
    C: 'firehose-mcp-server'
  };
  const presetList = normalizePresetsList(presets);
  const presetIdByName = (name) => presetList.find((p) => p.name === name)?.id ?? null;
  const names = { A: 'aleph-tronco-puro', B: 'aleph-wp-cache', C: 'aleph-firehose-browse', ...(alephConfig.defaultPresets || {}) };
  const presetIds = Object.fromEntries(
    DECK_IDS.map((deckId) => {
      const override = presetIdOverrides[`presetId${deckId}`] ?? presetIdOverrides[deckId];
      if (override) return [deckId, override];
      return [deckId, presetIdByName(names[deckId])];
    })
  );
  return { servers, presetNames: names, presetIds, lineaId };
}

export function buildDeckLoadPayloads(tableroDefaults) {
  return Object.fromEntries(
    DECK_IDS.map((deckId) => [
      deckId,
      {
        deckId,
        serverName: tableroDefaults.servers[deckId],
        ...(tableroDefaults.presetIds[deckId] ? { presetId: tableroDefaults.presetIds[deckId] } : {})
      }
    ])
  );
}
