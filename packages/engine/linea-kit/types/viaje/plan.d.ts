/**
 * Declarations for src/viaje/plan.mjs.
 * Breadth-first path planning over a GraphSource: candidates, choice, prune.
 */

import type { GraphSource, GraphSourceRefusal } from './graph-source.js';

/** One hop of a planned path. */
export interface Paso {
  from: string;
  to: string;
  via: string | null;
  /** Neighbor ids that were available at `from` — the choice audit. */
  chosen_from: string[];
  [key: string]: unknown;
}

export interface PlanPathOptions {
  /** Defaults to 64. */
  maxDepth?: number;
  prune?: Set<string> | string[];
}

export interface PlanPathOk {
  ok: true;
  path: string[];
  pasos: Paso[];
  hops: number;
  candidatos_podados: string[];
}

export interface PlanPathRefusal {
  ok: false;
  error: string;
  rule: string;
  candidatos_podados?: string[];
}

/**
 * Refusals carry rule `viaje.graph_source*`, `viaje.plan.args`,
 * `viaje.plan.neighbors` or `viaje.plan.unreachable`.
 */
export declare function planPath(
  source: GraphSource,
  origin: string,
  destination: string,
  opts?: PlanPathOptions
): Promise<PlanPathOk | PlanPathRefusal | GraphSourceRefusal>;

/** Replace each paso's `chosen_from` with the live neighbors of `paso.from`. */
export declare function enrichPasosWithCandidates(
  source: GraphSource,
  pasos: Paso[]
): Promise<Paso[]>;
