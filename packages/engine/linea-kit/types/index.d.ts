/**
 * Declarations for `@zeus/linea-kit` (src/index.mjs).
 *
 * Browser-safe model: curation + pure resolve + force activation.
 * Node-only surfaces live behind `@zeus/linea-kit/loader`,
 * `@zeus/linea-kit/validate`, `/tools`, `/starterkits` and `/viaje`.
 *
 * The value re-exports below mirror `src/index.mjs` name for name — this
 * barrel is deliberately narrower than the sum of its three subpaths.
 */

export {
  CURATION_STATUSES,
  CURATION_STATUS_KEYS,
  normalizeCurationStatus,
  isCurationStatus,
  isCanonStatus,
  readCurationStatus,
  curationStatusFromCorpus,
  isCuratedSidecarPath
} from './curation.js';

export type { CurationStatus, CurationStatusKey } from './curation.js';

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
} from './resolve.js';

export type {
  CacheStats,
  Coverage,
  DatedRegistro,
  LineaData,
  LineaInstance,
  LineaRegistryEntry,
  ManifestSource,
  ManifestTronco,
  NodoEntry,
  NodoMeta,
  NodoSectionIssue,
  NodoSectionMapping,
  NodoSectionReport,
  NodosSource,
  OldidSource,
  ParteEntry,
  Registro,
  RegistroItem,
  RegistrosQueryOptions,
  ResolveError,
  ResolveNodoOk,
  ResolveNodoResult,
  ResolveOldidOk,
  ResolveRegistrosForNodoOk,
  ResolveRegistrosForYearOk,
  ResolvedNodo,
  ResolvedParte,
  SatelliteIndex,
  SatelliteSource,
  SlimRegistro,
  WaveAAnchor,
  WaveAIndex
} from './resolve.js';

export {
  normalizeForceRegistry,
  initialActiveForces,
  forceAnchorTrackRef,
  cotasSnapshot,
  explainActivate,
  explainDeactivate,
  applyActivate,
  applyDeactivate
} from './force-activation.js';

export type {
  ApplyActivateOk,
  ApplyDeactivateOk,
  CotaCard,
  CotasSnapshot,
  ExplainActivateOk,
  ExplainDeactivateOk,
  ForceActivationRules,
  ForceCard,
  ForceExclusion,
  ForceRefusal,
  ForceRegistryView,
  ForceTrackRef,
  RoundState,
  SessionBudget
} from './force-activation.js';
