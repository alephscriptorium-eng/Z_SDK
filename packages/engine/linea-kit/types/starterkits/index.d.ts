/**
 * Declarations for `@zeus/linea-kit/starterkits` (src/starterkits/index.mjs).
 * Dramaturg starterkits (node-only). WP-U81.
 */

export { createLineaJuguete, toyHistorialRegistros } from './linea-30min.js';
export type {
  CreateLineaJugueteOk,
  CreateLineaJugueteOptions,
  StarterkitValidationFailure
} from './linea-30min.js';

export { createForceJuguete } from './force-30min.js';
export type {
  CreateForceJugueteOk,
  CreateForceJugueteOptions
} from './force-30min.js';

/**
 * Named because they appear in the SIGNATURES above: `CreateLineaJugueteOk`
 * carries `fetches: FetchSnapshotOk[]`, `StarterkitValidationFailure` carries
 * `failed: ValidationResult[]`, and `CreateForceJugueteOk` carries
 * `coverage: CoverageReport`. A consumer that cannot name them cannot type a
 * variable holding one.
 */
export type { KitFailure, ValidationIssue, ValidationResult } from '../common.js';
export type { FetchSnapshotOk } from '../tools/fetch.js';
export type { CoverageReport } from '../tools/segmentar-force.js';
export type { RawRegistro } from '../tools/segmentar.js';
