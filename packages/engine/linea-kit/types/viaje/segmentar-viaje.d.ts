/**
 * Declarations for src/viaje/segmentar-viaje.mjs.
 * Mark pasos as milestones using the same rule family as historial segmentation.
 */

import type { KitFailure } from '../common.js';
import type { BuildRecorridoOk, ViajeDraft } from './cache.js';

export interface SegmentarViajeOptions {
  byteDeltaThreshold?: number;
  keywords?: string[];
  /**
   * A `Set`, NOT an array — and here the asymmetry is worth naming, because
   * the JSDoc of `src/viaje/segmentar-viaje.mjs` says `Set<string>|string[]`
   * and the runtime does not honour the second half.
   *
   * `segmentarHistorial` normalizes an array into a `Set`
   * (`src/tools/segmentar.mjs:48-52`); `segmentarViaje` does NOT — it forwards
   * `opts.editorAllowlist` straight into `applyMilestoneRules`, whose `editor`
   * rule calls `.size` / `.has()`. Measured:
   * `segmentarViaje(recorrido, {editorAllowlist:['bob']})` throws
   * `TypeError: ctx.editorAllowlist.has is not a function`, while the same
   * call with `new Set(['bob'])` returns `ok:true`.
   *
   * Declared as `Set<string>` because that is the half that works. Closing the
   * asymmetry the other way (normalizing in the tool, as its sibling does) is
   * a `src/` change and therefore out of this WP.
   */
  editorAllowlist?: Set<string>;
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
