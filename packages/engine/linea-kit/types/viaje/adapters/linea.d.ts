/**
 * Declarations for src/viaje/adapters/linea.mjs.
 * Trunk nodos as a sequential path graph.
 */

import type { GraphSource } from '../graph-source.js';

export interface LineaGraphSourceOptions {
  nodoIds: string[];
  labels?: Record<string, string>;
  /** Defaults to `true`: adds the `tronco-prev` edges. */
  bidirectional?: boolean;
}

export declare function createLineaGraphSource(
  options: LineaGraphSourceOptions
): GraphSource;

/**
 * Build a nodo id list from a trunk manifest, from loader data, or from an
 * already-keyed `nodos` object. Takes `unknown` because it deliberately
 * accepts all three shapes and probes them in turn.
 */
export declare function nodoIdsFromTrunk(trunkOrLoaded: unknown): string[];
