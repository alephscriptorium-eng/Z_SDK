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

export type { KitFailure } from '../common.js';
