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
 * The three shapes whose nodo ids are actually promised to be strings:
 * a trunk manifest's `nodos` array, an already-keyed `nodos` record (the
 * loader's `LineaInstance`), or a wrapper carrying the manifest.
 */
export type TrunkNodoSource =
  | { nodos: ReadonlyArray<string | { id: string }> }
  | { nodos: Record<string, unknown> }
  | { manifest: { nodos: ReadonlyArray<string | { id: string }> } };

/**
 * Build a nodo id list from a trunk manifest, from loader data, or from an
 * already-keyed `nodos` object.
 *
 * The array branch is `map(n => typeof n === 'string' ? n : n?.id)` followed
 * by `filter(Boolean)` — a TRUTHINESS filter, not a type filter. So the ids
 * come out with whatever type they had. Measured:
 *
 *     nodoIdsFromTrunk({nodos:[{id:42},{id:true},'N01']})
 *       -> [42, true, 'N01']   (number, boolean, string)
 *
 * Hence the two signatures: give it a source whose ids are declared `string`
 * and you get `string[]` — the shape `createLineaGraphSource` needs; give it
 * anything else and you get `unknown[]`, which has to be narrowed first.
 */
export declare function nodoIdsFromTrunk(trunkOrLoaded: TrunkNodoSource): string[];
export declare function nodoIdsFromTrunk(trunkOrLoaded: unknown): unknown[];
