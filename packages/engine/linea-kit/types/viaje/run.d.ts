/**
 * Declarations for src/viaje/run.mjs.
 * High-level runner: plan → (optional materialize) → cache → segment.
 */

import type { ValidationResult } from '../common.js';
import type { GraphSource } from './graph-source.js';
import type { ViajeRecorrido, ViajeSnapshot } from './cache.js';
import type { SegmentarViajeOptions } from './segmentar-viaje.js';

/**
 * What `materializeNode` is expected to hand back. Only `ok` is consulted as
 * a gate; the remaining members are read opportunistically, in both
 * snake_case and camelCase, so all of them are optional.
 */
export interface MaterializeNodeResult {
  ok?: boolean;
  node_id?: string;
  oldid?: number;
  wikitext_path?: string;
  wikitextPath?: string;
  meta_path?: string;
  metaPath?: string;
  error?: string;
  rule?: string;
  [key: string]: unknown;
}

export interface RunViajeOptions {
  id: string;
  origin: string;
  destination: string;
  source: GraphSource;
  /** When given, the recorrido is written under `<cacheDir>/viajes/`. */
  cacheDir?: string;
  prune?: string[] | Set<string>;
  maxDepth?: number;
  curation_status?: string;
  materializeNode?: (
    nodeId: string
  ) => MaterializeNodeResult | Promise<MaterializeNodeResult>;
  /** `true` for defaults, or the `segmentarViaje` options object. */
  segment?: boolean | SegmentarViajeOptions;
}

export interface RunViajeOk {
  ok: true;
  path: string[];
  hops: number;
  recorrido: ViajeRecorrido;
  /** Present only when `cacheDir` was given. */
  cachePath?: string;
  snapshots: ViajeSnapshot[];
}

/**
 * Every refusal of the pipeline, flattened: the graph-source check, the
 * argument check, an unreachable plan, a failed node materialization, and every
 * schema refusal from `buildRecorrido` / `materializeRecorrido`.
 */
export interface RunViajeRefusal {
  ok: false;
  error: string;
  rule: string;
  /** The recorrido as far as it got — usually at the `blocked` stage. */
  recorrido?: ViajeRecorrido;
  candidatos_podados?: string[];
  nodeId?: string;
  detail?: unknown;
  validation?: ValidationResult;
  hint?: string;
}

export declare function runViaje(
  options: RunViajeOptions
): Promise<RunViajeOk | RunViajeRefusal>;
