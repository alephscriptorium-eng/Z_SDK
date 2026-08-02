/**
 * Declarations for src/viaje/adapters/gamemap.mjs.
 * Reproduce a viaje as walk intents between anchors. Generic engine terms only.
 */

import type { GraphSource } from '../graph-source.js';
import type { ViajeDraft } from '../cache.js';

/**
 * A walk intent as `viajeToWalkIntents` BUILDS it. Every member is set by the
 * object literal, so `street` is present-and-nullable rather than optional.
 */
export interface WalkIntent {
  kind: 'walk';
  from: string;
  to: string;
  street: string | null;
  hop: number;
}

/**
 * A walk intent as `acceptWalks` VERIFIES it — which is much less.
 *
 * The acceptor checks three things and returns the input array untouched:
 * the element is non-null, `kind === 'walk'`, and `from` / `to` are truthy.
 * It never looks at `hop`, and it never looks at the TYPE of `from` / `to`.
 * Measured:
 *
 *     acceptWalks([{kind:'walk',from:'A',to:'B'}])
 *       -> ok:true, accepted[0].hop === undefined
 *     acceptWalks([{kind:'walk',from:1,to:2,hop:'x'}])
 *       -> ok:true, typeof accepted[0].from === 'number'
 *
 * So this is what an accepted element promises, and no more. A caller that
 * already holds `WalkIntent[]` keeps its own stronger type — see the generic
 * overload of `acceptWalks`.
 */
export interface ShapeCheckedWalk {
  kind: 'walk';
  from: unknown;
  to: unknown;
}

export interface WalkIntentsOptions {
  streetForHop?: (from: string, to: string, hop: number) => string | null;
  anchors?: Set<string> | string[];
}

export interface WalkIntentsOk {
  ok: true;
  walks: WalkIntent[];
}

export interface WalkIntentsRefusal {
  ok: false;
  error: string;
  rule: string;
  /** Present on rule `viaje.gamemap.anchor`. */
  from?: string;
  to?: string;
}

/**
 * Refusals carry rule `viaje.gamemap.args`, `viaje.gamemap.paso` or
 * `viaje.gamemap.anchor`.
 */
export declare function viajeToWalkIntents(
  recorrido: ViajeDraft,
  opts?: WalkIntentsOptions
): WalkIntentsOk | WalkIntentsRefusal;

export interface AcceptWalksOk<T = ShapeCheckedWalk> {
  ok: true;
  /**
   * The SAME array object that came in (`accepted === walks`), not a copy and
   * not a reshaped projection.
   */
  accepted: T[];
}

export interface AcceptWalksRefusal {
  ok: false;
  error: string;
  rule: string;
  /** Index of the offending intent. */
  at?: number;
}

/**
 * Local acceptor: shape-checks walk intents when room authority is absent
 * (pendingAuthority).
 *
 * This function exists so a consumer can stop checking, which is exactly why
 * its declaration must not promise more than it verifies. It returns the input
 * array unchanged, so the result is typed by the INPUT:
 *
 * - hand it a `WalkIntent[]` (what `viajeToWalkIntents` builds) and you get
 *   `WalkIntent[]` back — sound, because the builder really did set `hop`;
 * - hand it anything else and you get `ShapeCheckedWalk[]`, where `from` and
 *   `to` are `unknown` and `hop` does not exist at all, because the acceptor
 *   never looked at them.
 */
export declare function acceptWalks<T extends ShapeCheckedWalk>(
  walks: readonly T[]
): AcceptWalksOk<T> | AcceptWalksRefusal;
export declare function acceptWalks(
  walks: unknown
): AcceptWalksOk<ShapeCheckedWalk> | AcceptWalksRefusal;

export interface GamemapGraphSourceOptions {
  /** Anchor id → reachable anchor ids. */
  streets: Record<string, string[]>;
  labels?: Record<string, string>;
}

export declare function createGamemapGraphSource(
  options: GamemapGraphSourceOptions
): GraphSource;
