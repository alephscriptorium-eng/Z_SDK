/**
 * Optional Mundo A/B wake bridge (Z03 consumer).
 *
 * Z06 exposes resolution only — does not edit the city game reducer.
 * Z03 may call `resolveWakeLaunch(barrioId)` then `ProcessManager.launch`.
 * Tree rollup / XState remains Z12.
 */

import { resolveCatalog } from './catalog.mjs';

/**
 * Seed map barrio → catalog server ids to launch on wake.
 * Empty by default; Z02/Z12 fill real barrios. Example shape for consumers.
 */
export const DEFAULT_WAKE_MAP = {
  // Example (not live game data): 'linea-poder': ['linea-espana', 'linea-wp-historia']
};

/**
 * @param {string} barrioId
 * @param {{
 *   map?: Record<string, string[]>,
 *   catalog?: ReturnType<typeof resolveCatalog>
 * }} [opts]
 */
export function resolveWakeLaunch(barrioId, opts = {}) {
  const map = opts.map || DEFAULT_WAKE_MAP;
  const catalog = opts.catalog || resolveCatalog();
  const ids = map[barrioId];
  if (!ids || !ids.length) {
    return {
      ok: false,
      error: `No wake mapping for barrio "${barrioId}"`,
      rule: 'wake.map',
      hint: 'Z03/Z12 supply map; Z06 only launches catalog ids'
    };
  }
  const entries = [];
  for (const id of ids) {
    const entry = catalog.find((e) => e.id === id);
    if (!entry) {
      return { ok: false, error: `Wake target "${id}" not in catalog`, rule: 'wake.catalog' };
    }
    entries.push(entry);
  }
  return { ok: true, barrioId, serverIds: ids, entries };
}
