import { decksToMaterialsByNode } from './materials.mjs';
import { buildOntologia } from './ontology.mjs';
import { createEmptyMapSlice } from './map-slice.mjs';

export const MANIFEST_VERSION = '2.0.0';

/**
 * Legacy snapshot from session-machine (pre-v2).
 * @typedef {object} LegacySessionSnapshot
 * @property {string} phase
 * @property {object} playhead
 * @property {boolean} sync
 * @property {string} activeCaso
 * @property {Record<string, object>} decks
 * @property {object} selections
 * @property {unknown[]} [parteCues]
 */

/**
 * @param {LegacySessionSnapshot} legacy
 * @param {object} [domainState]
 * @param {object} [domainState.map]
 * @param {Map<string, object>} [domainState.materialPins]
 * @param {Record<string, object>} [domainState.ontologyPatches]
 * @param {number} [ts]
 */
export function buildSessionManifest(legacy, domainState = {}, ts = Date.now()) {
  const map = domainState.map ?? createEmptyMapSlice();
  const materialPins = domainState.materialPins ?? new Map();
  const ontologyPatches = domainState.ontologyPatches ?? {};

  const session = {
    phase: legacy.phase,
    playhead: legacy.playhead,
    sync: legacy.sync,
    activeCaso: legacy.activeCaso
  };

  const materiales = {
    byNode: decksToMaterialsByNode(legacy.decks, materialPins)
  };

  const ontologia = buildOntologia(legacy.selections, legacy.decks, ontologyPatches);

  const manifest = {
    version: MANIFEST_VERSION,
    ts,
    session,
    map,
    materiales,
    ontologia,
  };

  if (legacy.decks) manifest.decks = legacy.decks;
  if (legacy.parteCues) manifest.parteCues = legacy.parteCues;

  // Compat mirrors for consumers not yet on v2 (retire in v2.1).
  manifest.phase = session.phase;
  manifest.playhead = session.playhead;
  manifest.sync = session.sync;
  manifest.activeCaso = session.activeCaso;
  manifest.selections = ontologia.selections;

  return manifest;
}

/** @param {object} manifest */
export function projectMap(manifest) {
  return manifest.map ?? createEmptyMapSlice();
}

/** @param {object} manifest */
export function projectLifecycle(manifest) {
  return manifest.session ?? {
    phase: manifest.phase,
    playhead: manifest.playhead,
    sync: manifest.sync,
    activeCaso: manifest.activeCaso
  };
}
