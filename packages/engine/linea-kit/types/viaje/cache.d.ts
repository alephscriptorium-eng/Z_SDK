/**
 * Declarations for src/viaje/cache.mjs.
 * Materialize and validate viaje recorridos against `schemas/viaje-recorrido.json`.
 */

import type { KitFailure } from '../common.js';
import type { CurationStatus } from '../curation.js';
import type { ViajeEtapa } from './etapas.js';
import type { Paso } from './plan.js';

/**
 * `schemas/viaje-recorrido.json` enumerates the four accepted values, and
 * `buildRecorrido` validates before returning — a source whose `kind` is
 * anything else produces a schema refusal, not a fifth token.
 */
export type ViajeSourceKind = 'linea' | 'wiki' | 'gamemap' | 'custom';

export interface ViajeSnapshot {
  node_id?: string;
  oldid?: number;
  wikitext_path?: string;
  meta_path?: string;
  /** When present, validated against `schemas/cache-sidecar-meta.json`. */
  meta?: unknown;
  [key: string]: unknown;
}

/** A materialized origin→destination path. `additionalProperties: true`. */
export interface ViajeRecorrido {
  id: string;
  origin: string;
  destination: string;
  source_kind: ViajeSourceKind;
  etapa: ViajeEtapa;
  pasos: Paso[];
  candidatos_podados: string[];
  milestones: string[];
  curation_status: CurationStatus;
  snapshots: ViajeSnapshot[];
  generated_at: string;
  tree_normalized_from?: string;
  [key: string]: unknown;
}

/** Input of `buildRecorrido`. Keys it does not know are dropped. */
export interface ViajeDraft {
  id: string;
  origin: string;
  destination: string;
  source_kind?: string;
  etapa?: string;
  pasos?: Paso[];
  candidatos_podados?: string[];
  milestones?: string[];
  curation_status?: string;
  snapshots?: ViajeSnapshot[];
  tree_normalized_from?: string;
  [key: string]: unknown;
}

export interface BuildRecorridoOk {
  ok: true;
  recorrido: ViajeRecorrido;
}

/**
 * Refusals carry rule `viaje.etapa` (unknown stage) or
 * `viaje.cache.schema` (the built object failed the schema).
 */
export declare function buildRecorrido(draft: ViajeDraft): BuildRecorridoOk | KitFailure;

export interface MaterializeRecorridoOptions {
  cacheDir: string;
  recorrido: ViajeDraft;
  curation_status?: string;
}

export interface MaterializeRecorridoOk {
  ok: true;
  /** Absolute path of the written `<cacheDir>/viajes/<id>.json`. */
  path: string;
  recorrido: ViajeRecorrido;
}

/** Write the recorrido under `cacheDir/viajes/<id>.json` after validation. */
export declare function materializeRecorrido(
  options: MaterializeRecorridoOptions
): MaterializeRecorridoOk | KitFailure;

export interface NormalizeTreeOptions {
  id?: string;
  origin?: string;
  destination?: string;
}

/**
 * Normalize a minimal `tree.json`-like object into a recorrido.
 * The argument is `unknown`: a departure format this package never wrote and
 * has no schema for.
 */
export declare function normalizeTreeJson(
  tree: unknown,
  opts?: NormalizeTreeOptions
): BuildRecorridoOk | KitFailure;

/** Advance the stage with the transition guard of `./etapas`. */
export declare function advanceEtapa(
  recorrido: ViajeDraft,
  nextEtapa: string
): BuildRecorridoOk | KitFailure;
