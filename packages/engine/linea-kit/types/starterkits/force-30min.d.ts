/**
 * Declarations for src/starterkits/force-30min.mjs.
 * Synthetic force corpus plus its two cota stubs and a toy `registry.json`.
 */

import type { KitFailure } from '../common.js';
import type { CoverageReport } from '../tools/segmentar-force.js';

export interface CreateForceJugueteOptions {
  forcesRoot: string;
  /** Defaults to `force-juguete`. */
  forceId?: string;
  /** Set to `false` to skip the sima/cima cota stubs. */
  withCotas?: boolean;
  overwrite?: boolean;
}

export interface CreateForceJugueteOk {
  ok: true;
  forceId: string;
  forcesRoot: string;
  forceDir: string;
  coverage: CoverageReport;
  /** Ids of the cotas created, in creation order. */
  cotas: string[];
  registryPath: string;
}

/**
 * Failures of `segmentarForce` / `crearCotas` are forwarded unchanged, and an
 * invalid generated registry is reported with rule `starterkit.force.registry`.
 */
export declare function createForceJuguete(
  options: CreateForceJugueteOptions
): CreateForceJugueteOk | KitFailure;
