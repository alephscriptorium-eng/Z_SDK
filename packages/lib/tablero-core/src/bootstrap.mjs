import {
  DECK_IDS,
  DEFAULT_LINEA_SERVERS,
  DEFAULT_PRESET_NAMES_BY_DECK,
  DEFAULT_SERVERS_BY_DECK
} from './constants.mjs';

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
 * Build servers + preset ids for bootstrap_decks / browser autoLoad.
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
