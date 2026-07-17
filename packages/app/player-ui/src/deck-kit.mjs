/**
 * DJ deck slots — presentación del manipulador (player-ui).
 * Absorbido desde @zeus/tablero-core (WP-U31 demolición).
 */

export const DECK_IDS = Object.freeze(['A', 'B', 'C']);

/** Default MCP catalog server id per deck slot. */
export const DEFAULT_SERVERS_BY_DECK = Object.freeze({
  A: 'linea-espana',
  B: 'linea-wp-historia',
  C: 'firehose-mcp-server'
});

export const FIREHOSE_SERVER_NAME = DEFAULT_SERVERS_BY_DECK.C;

/** Decks that support registro/wikitext (not firehose C). */
export const WIKITEXT_DECK_IDS = Object.freeze(['A', 'B']);

export const FIREHOSE_DECK_ID = 'C';

export const DEFAULT_PRESET_NAMES_BY_DECK = Object.freeze({
  A: 'aleph-tronco-puro',
  B: 'aleph-wp-cache',
  C: 'aleph-firehose-browse'
});

export const DEFAULT_LINEA_SERVERS = Object.freeze({
  espana: Object.freeze({ tronco: 'linea-espana', satelite: 'linea-wp-historia' })
});

/** Parte I–IV cue years on the shared playhead strip. */
export const PARTE_CUES = Object.freeze([
  Object.freeze({ id: 'I', label: 'I', year: 450 }),
  Object.freeze({ id: 'II', label: 'II', year: 1350 }),
  Object.freeze({ id: 'III', label: 'III', year: 1808 }),
  Object.freeze({ id: 'IV', label: 'IV', year: 1978 })
]);

export const DEFAULT_TRONCO_RANGE = Object.freeze({ min: 450, max: 2026 });
export const DEFAULT_PLAYHEAD_YEAR = 2010;

export function emptyDeckActor() {
  return {
    phase: 'empty',
    serverName: null,
    presetId: null,
    filtered: null,
    resolved: null
  };
}

export function emptyDecksActor() {
  return Object.fromEntries(DECK_IDS.map((id) => [id, emptyDeckActor()]));
}

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

export function normalizeNodoId(nodoId) {
  const raw = String(nodoId).trim().toUpperCase();
  return raw.startsWith('P') ? raw : `P${raw}`;
}

/**
 * @param {object} anchors
 * @param {string} nodoId
 */
export function findAnchorCell(anchors, nodoId) {
  const grid = anchors?.grid ?? anchors;
  const cells = grid?.cells;
  if (!Array.isArray(cells)) return null;
  const target = normalizeNodoId(nodoId);
  return cells.find((c) => normalizeNodoId(c.nodo_id) === target) ?? null;
}

/**
 * @param {unknown} presets
 * @returns {object[]}
 */
export function normalizePresetsList(presets) {
  if (Array.isArray(presets)) return presets;
  if (presets && Array.isArray(presets.presets)) return presets.presets;
  if (presets && Array.isArray(presets.items)) return presets.items;
  return [];
}

/**
 * @param {{
 *   alephConfig?: object,
 *   presets?: unknown,
 *   lineaId?: string,
 *   presetIdOverrides?: Record<string, string|undefined>
 * }} [opts]
 */
export function resolveTableroDefaults({
  alephConfig = {},
  presets = [],
  lineaId = alephConfig.defaultLinea || 'espana',
  presetIdOverrides = {}
} = {}) {
  const lineaServers = alephConfig.lineaServers?.[lineaId] || DEFAULT_LINEA_SERVERS[lineaId];
  const servers = {
    A: lineaServers?.tronco ?? DEFAULT_SERVERS_BY_DECK.A,
    B: lineaServers?.satelite ?? DEFAULT_SERVERS_BY_DECK.B,
    C: DEFAULT_SERVERS_BY_DECK.C
  };

  const presetNames = {
    ...DEFAULT_PRESET_NAMES_BY_DECK,
    ...(alephConfig.defaultPresets || {})
  };

  const presetList = normalizePresetsList(presets);
  const presetIdByName = (name) => {
    if (!name) return null;
    return presetList.find((p) => p.name === name)?.id ?? null;
  };

  const presetIds = Object.fromEntries(
    DECK_IDS.map((deckId) => {
      const override = presetIdOverrides[`presetId${deckId}`] ?? presetIdOverrides[deckId];
      if (override) return [deckId, override];
      return [deckId, presetIdByName(presetNames[deckId])];
    })
  );

  return { servers, presetNames, presetIds, lineaId };
}

/**
 * @param {ReturnType<typeof resolveTableroDefaults>} tableroDefaults
 */
export function buildDeckLoadPayloads(tableroDefaults) {
  return Object.fromEntries(
    DECK_IDS.map((deckId) => [
      deckId,
      {
        deckId,
        serverName: tableroDefaults.servers[deckId],
        ...(tableroDefaults.presetIds[deckId]
          ? { presetId: tableroDefaults.presetIds[deckId] }
          : {})
      }
    ])
  );
}
