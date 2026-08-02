/**
 * Declarations for src/viaje/adapters/gamemap.mjs.
 * Reproduce a viaje as walk intents between anchors. Generic engine terms only.
 */

import type { GraphSource } from '../graph-source.js';
import type { ViajeDraft } from '../cache.js';

export interface WalkIntent {
  kind: 'walk';
  from: string;
  to: string;
  street?: string | null;
  hop: number;
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

export interface AcceptWalksOk {
  ok: true;
  accepted: WalkIntent[];
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
 * (pendingAuthority). Takes `unknown` because it is the shape check itself.
 */
export declare function acceptWalks(walks: unknown): AcceptWalksOk | AcceptWalksRefusal;

export interface GamemapGraphSourceOptions {
  /** Anchor id → reachable anchor ids. */
  streets: Record<string, string[]>;
  labels?: Record<string, string>;
}

export declare function createGamemapGraphSource(
  options: GamemapGraphSourceOptions
): GraphSource;
