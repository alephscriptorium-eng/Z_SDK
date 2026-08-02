/**
 * Declarations for src/viaje/plan.mjs.
 * Breadth-first path planning over a GraphSource: candidates, choice, prune.
 */

import type { GraphSource, GraphSourceRefusal } from './graph-source.js';

/**
 * One hop of a recorrido, as `schemas/viaje-recorrido.json` promises it:
 * ONLY `from` and `to` are required. `buildRecorrido({pasos:[{from,to}]})`
 * validates `ok:true` and stores the paso with neither `via` nor
 * `chosen_from`, so a recorrido reread from cache can carry bare pasos.
 */
export interface Paso {
  from: string;
  to: string;
  via?: string | null;
  /** Neighbor ids that were available at `from` — the choice audit. */
  chosen_from?: string[];
  milestone?: boolean;
  milestone_reasons?: string[];
  [key: string]: unknown;
}

/**
 * A paso as `planPath` and `enrichPasosWithCandidates` BUILD it: those two
 * always set `via` and `chosen_from` in the object literal, so the planner's
 * output is stronger than what the schema requires of a stored recorrido.
 */
export interface PlannedPaso extends Paso {
  via: string | null;
  chosen_from: string[];
}

export interface PlanPathOptions {
  /** Defaults to 64. */
  maxDepth?: number;
  prune?: Set<string> | string[];
}

export interface PlanPathOk {
  ok: true;
  path: string[];
  pasos: PlannedPaso[];
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

/**
 * Replace each paso's `chosen_from` with the live neighbors of `paso.from`.
 * The result always carries `chosen_from`, hence `PlannedPaso`; `via` is
 * carried over from the input by spread, so bare pasos keep it absent.
 */
export declare function enrichPasosWithCandidates(
  source: GraphSource,
  pasos: readonly Paso[]
): Promise<Array<Paso & { chosen_from: string[] }>>;
