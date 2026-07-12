import { DeckId } from '@zeus/session-protocol/schemas';

/** Tablero deck slot ids (canonical; mirrors @zeus/session-protocol DeckId). */
export const DECK_IDS = DeckId.options;

/** Default MCP catalog server id per deck slot. */
export const DEFAULT_SERVERS_BY_DECK = {
  A: 'linea-espana',
  B: 'linea-wp-historia',
  C: 'firehose-mcp-server'
};

export const FIREHOSE_SERVER_NAME = DEFAULT_SERVERS_BY_DECK.C;

/** Decks that support registro/wikitext socket events (not firehose C). */
export const WIKITEXT_DECK_IDS = ['A', 'B'];

export const FIREHOSE_DECK_ID = 'C';

/** Default preset names per deck (resolved to ids via preset store). */
export const DEFAULT_PRESET_NAMES_BY_DECK = {
  A: 'aleph-tronco-puro',
  B: 'aleph-wp-cache',
  C: 'aleph-firehose-browse'
};

/** Linea registry → MCP server names for topology / deck A-B. */
export const DEFAULT_LINEA_SERVERS = {
  espana: { tronco: 'linea-espana', satelite: 'linea-wp-historia' }
};

/** Parte I–IV cue years on the shared playhead strip. */
export const PARTE_CUES = [
  { id: 'I', label: 'I', year: 450 },
  { id: 'II', label: 'II', year: 1350 },
  { id: 'III', label: 'III', year: 1808 },
  { id: 'IV', label: 'IV', year: 1978 }
];

export const DEFAULT_TRONCO_RANGE = { min: 450, max: 2026 };
export const DEFAULT_PLAYHEAD_YEAR = 2010;
