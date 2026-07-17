/**
 * Thin facade: mesh defaults (presets paths + coverage) over @zeus/linea-kit.
 * Demolition WP-U80: loader implementation lives in the kit.
 */

import {
  loadZeusEnv,
  resolveLineasBasePath,
  resolveLineasSatCacheDir
} from '@zeus/presets-sdk';
import {
  loadLineaData as loadLineaDataCore,
  rescanSatelliteCache as rescanSatelliteCacheCore,
  readWikitext as readWikitextCore,
  readRegistro,
  parseWpTimestamp,
  resolveNodo,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings
} from '@zeus/linea-kit/loader';
import { TRONCO_COVERAGE, SATELITE_COVERAGE } from './lineas.mjs';

loadZeusEnv();

export const DEFAULT_BASE_PATH = resolveLineasBasePath();

const kitOptions = {
  resolveCacheDir: resolveLineasSatCacheDir,
  troncoCoverage: TRONCO_COVERAGE,
  sateliteCoverage: SATELITE_COVERAGE
};

/**
 * Loads registry.yaml and all line instances under basePath (read-only).
 * @param {string} [basePath]
 */
export async function loadLineaData(basePath = DEFAULT_BASE_PATH) {
  return loadLineaDataCore(basePath, kitOptions);
}

/**
 * @param {object} satellite
 */
export async function rescanSatelliteCache(satellite) {
  return rescanSatelliteCacheCore(satellite, {
    resolveCacheDir: resolveLineasSatCacheDir
  });
}

/**
 * @param {object} satellite
 * @param {number|string} oldid
 */
export async function readWikitext(satellite, oldid) {
  return readWikitextCore(satellite, oldid, {
    resolveCacheDir: resolveLineasSatCacheDir
  });
}

export {
  readRegistro,
  parseWpTimestamp,
  resolveNodo,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings
};
