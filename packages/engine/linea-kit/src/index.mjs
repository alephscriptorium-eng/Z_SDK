/**
 * @zeus/linea-kit — browser-safe model (curation + pure resolve).
 * Node-only: import `@zeus/linea-kit/loader` and `@zeus/linea-kit/validate`.
 */

export {
  CURATION_STATUSES,
  CURATION_STATUS_KEYS,
  normalizeCurationStatus,
  isCurationStatus,
  isCanonStatus,
  readCurationStatus,
  curationStatusFromCorpus
} from './curation.mjs';

export {
  parseWpTimestamp,
  slimRegistro,
  buildSectionIndex,
  resolveNodo,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings
} from './resolve.mjs';
