/**
 * Declarations for `@zeus/linea-kit/resolve` (src/resolve.mjs).
 * Pure resolution helpers for line corpora — browser-safe, no fs.
 *
 * Every function here returns EITHER a payload carrying `error?: undefined`
 * OR a `{ error: string }` envelope. Narrow with an explicit
 *
 *     if (result.error !== undefined) { … }   // failure branch
 *
 * and NOT with a bare `if (result.error)`: the failure `error` is typed
 * `string`, which includes `''`, so a truthiness test does not remove the
 * failure constituent from the false branch. The same rule applies to
 * `./loader` and to the forces-loader queries it re-exports.
 */

import type {
  Coverage,
  DatedRegistro,
  ManifestTronco,
  NodoEntry,
  Registro,
  SatelliteIndex,
  SlimRegistro,
  WaveAAnchor
} from './model.js';

export type {
  CacheStats,
  Coverage,
  DatedRegistro,
  LineaData,
  LineaInstance,
  LineaRegistryEntry,
  ManifestSatelite,
  ManifestTronco,
  NodoEntry,
  NodoMeta,
  NodoSectionMapping,
  ParteEntry,
  Registro,
  SatelliteIndex,
  SlimRegistro,
  WaveAAnchor,
  WaveAIndex
} from './model.js';

/** Failure envelope of the resolve layer. */
export interface ResolveError {
  error: string;
  coverage?: Coverage | null;
}

/**
 * Parse Wikipedia-ES historial timestamps (`20:30 24 jun 2026` / `28 sep 2007`).
 * @returns UTC milliseconds, or `null` when the string does not match.
 */
export declare function parseWpTimestamp(ts: string | null | undefined): number | null;

/** Narrow a registro down to the fields the in-memory index needs. */
export declare function slimRegistro(registro: Registro): SlimRegistro;

/**
 * Group registros by their `section`. Entries without a section are dropped.
 * Generic so the loader's `SlimRegistro[]` and a caller's own registros both
 * keep their element type in the result.
 */
export declare function buildSectionIndex<T extends { section?: string | null }>(
  registroIndex: readonly T[]
): Record<string, T[]>;

/** Minimal shape `resolveNodo` reads. `LineaInstance` satisfies it. */
export interface NodosSource {
  nodos: Record<string, NodoEntry>;
  coverage?: Coverage | null;
}

/** Minimal shape `resolveParte` reads. */
export interface ManifestSource {
  manifest: ManifestTronco;
}

/** Minimal shape the registro queries read. */
export interface SatelliteSource {
  nodos: Record<string, NodoEntry>;
  satellite?: SatelliteIndex | null;
}

/** The nodo projection `resolveNodo` returns. */
export interface ResolvedNodo {
  id: string;
  parte: string | undefined;
  etiqueta: string | undefined;
  tesis: string | null;
  tesis_villacañas: string | undefined;
  articulos_wp: string[] | undefined;
  año_ini: number;
  año_fin: number | null | undefined;
}

export interface ResolveNodoOk {
  year: number;
  nodo: ResolvedNodo;
  error?: undefined;
}

export type ResolveNodoResult = ResolveNodoOk | ResolveError;

/**
 * Find the nodo whose year window contains `year`.
 * `coverage` defaults to `lineData.coverage`.
 */
export declare function resolveNodo(
  lineData: NodosSource,
  year: number | string,
  coverage?: Coverage | null
): ResolveNodoResult;

/**
 * The parte projection `resolveParte` returns.
 *
 * Only `id` is typed: `schemas/manifest-tronco.json` declares
 * `meta.partes` items as open objects with no declared properties, so the
 * other four fields are copied from a shape nothing promises.
 */
export interface ResolvedParte {
  id: string;
  titulo: unknown;
  año_ini: unknown;
  año_fin: unknown;
  nodos: unknown;
  error?: undefined;
}

export declare function resolveParte(
  lineData: ManifestSource,
  parteId: string
): ResolvedParte | ResolveError;

/** Minimal shape `resolveOldid` reads. */
export interface OldidSource {
  byDate: DatedRegistro[];
  coverage?: Coverage | null;
}

export interface ResolveOldidOk {
  year: number;
  oldid: number;
  timestamp: string | undefined;
  registro_id: string;
  error?: undefined;
}

/** Latest registro at or before 31 Dec of `year` (binary search over byDate). */
export declare function resolveOldid(
  satellite: OldidSource,
  year: number | string
): ResolveOldidOk | ResolveError;

/** One row of the registro listings. */
export interface RegistroItem {
  registro_id: string | null;
  oldid: number;
  timestamp: string | null | undefined;
  section: string | null | undefined;
  milestone: boolean;
  cached: boolean;
  curated: boolean;
  is_anchor: boolean;
}

export interface RegistrosQueryOptions {
  limit?: number;
  milestonesOnly?: boolean;
}

export interface ResolveRegistrosForNodoOk {
  nodo_id: string;
  nodo: {
    id: string;
    etiqueta: string | undefined;
    año_ini: number;
    año_fin: number | null | undefined;
  };
  anchor: WaveAAnchor | null;
  sections: string[];
  registros: RegistroItem[];
  total: number;
  cached_count: number;
  error?: undefined;
}

export declare function resolveRegistrosForNodo(
  lineData: SatelliteSource,
  nodoId: string,
  options?: RegistrosQueryOptions
): ResolveRegistrosForNodoOk | ResolveError;

export interface ResolveRegistrosForYearOk {
  year: number;
  nodo: ResolvedNodo;
  anchor: WaveAAnchor | null;
  sections: string[];
  registros: RegistroItem[];
  total: number;
  cached_count: number;
  error?: undefined;
}

/**
 * Year → nodo → registros. On a registro-level failure the envelope still
 * carries `year` and `nodo` alongside `error`.
 */
export declare function resolveRegistrosForYear(
  lineData: NodosSource & SatelliteSource,
  year: number | string,
  options?: RegistrosQueryOptions
): ResolveRegistrosForYearOk | (ResolveError & { year?: number; nodo?: ResolvedNodo });

export type NodoSectionIssue =
  | { nodo_id: string; kind: 'missing_mapping' }
  | { nodo_id: string; kind: 'unknown_sections'; sections: string[] }
  | { nodo_id: string; kind: 'resolve_error'; error: string }
  | { nodo_id: string; kind: 'empty_registros'; sections: string[] };

export interface NodoSectionReport {
  ok: boolean;
  nodo_count: number;
  issues: NodoSectionIssue[];
  error?: undefined;
}

/** Audit every nodo's section mapping against the satellite index. */
export declare function validateNodoSectionMappings(
  lineData: SatelliteSource
): NodoSectionReport | ResolveError;
