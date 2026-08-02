/**
 * Declarations for src/viaje/segmentar-viaje.mjs.
 * Mark pasos as milestones using the same rule family as historial segmentation.
 */

import type { KitFailure } from '../common.js';
import type { BuildRecorridoOk, ViajeDraft } from './cache.js';

export interface SegmentarViajeOptions {
  byteDeltaThreshold?: number;
  keywords?: string[];
  editorAllowlist?: Set<string> | string[];
  /** Force a milestone every N hops, on top of the rule table. */
  everyNHops?: number;
}

/**
 * Each paso may carry `byte_delta`, `summary` and `user`, either at the top
 * level or under `meta`, as rule input.
 *
 * Refuses with rule `viaje.segmentar.args` when `recorrido.pasos` is missing.
 */
export declare function segmentarViaje(
  recorrido: ViajeDraft,
  opts?: SegmentarViajeOptions
): BuildRecorridoOk | KitFailure;
