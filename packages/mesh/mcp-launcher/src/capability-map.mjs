/**
 * Capability (RNFP) → catalog id resolution.
 * Consumed by Z04: inactive capability → launch(server that serves it).
 */

import { resolveCatalog } from './catalog.mjs';

/**
 * Default map: capability tag → preferred catalog id.
 * Extend without touching process spawn logic.
 */
export const DEFAULT_CAPABILITY_MAP = {
  'linea.tronco': 'linea-espana',
  'linea.satelite': 'linea-wp-historia',
  'rnfp.linea': 'linea-espana',
  'rnfp.linea.satelite': 'linea-wp-historia',
  'fleet.lineas': 'linea-espana',
  'fleet.solar': 'solar-sun',
  'fleet.forces': 'forces',
  'fleet.ssb': 'ssb',
  'fleet.firehose': 'firehose',
  'fleet.consoleMonitor': 'console-monitor',
  'fleet.argPlayer': 'arg-player-uno',
  'fleet.pozoPlayer': 'pozo-player',
  'fleet.solvePlayer': 'solve-player'
};

/**
 * @param {string} capability
 * @param {{
 *   map?: Record<string, string>,
 *   catalog?: ReturnType<typeof resolveCatalog>
 * }} [opts]
 */
export function resolveCapability(capability, opts = {}) {
  const map = opts.map || DEFAULT_CAPABILITY_MAP;
  const catalog = opts.catalog || resolveCatalog();
  const id = map[capability];
  if (!id) {
    return { ok: false, error: `Unknown capability "${capability}"`, rule: 'capability.map' };
  }
  const entry = catalog.find((e) => e.id === id);
  if (!entry) {
    return { ok: false, error: `Mapped id "${id}" missing from catalog`, rule: 'capability.catalog' };
  }
  return { ok: true, capability, serverId: id, entry };
}

/**
 * List capabilities declared on catalog entries (+ default map keys).
 * @param {ReturnType<typeof resolveCatalog>} [catalog]
 */
export function listCapabilities(catalog = resolveCatalog()) {
  const fromEntries = new Set();
  for (const e of catalog) {
    for (const c of e.capabilities || []) fromEntries.add(c);
  }
  return {
    fromCatalog: [...fromEntries].sort(),
    fromMap: Object.keys(DEFAULT_CAPABILITY_MAP).sort()
  };
}
