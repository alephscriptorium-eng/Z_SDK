/**
 * In-memory model of a LINEAS corpus.
 *
 * Two different promises are mixed here and they are marked as such:
 * - shapes read off disk are described by the JSON Schemas under `schemas/`
 *   (`additionalProperties: true` everywhere, hence the index signatures);
 * - shapes built in memory are described by the object literals that
 *   `src/loader.mjs` constructs, which is the stronger promise of the two.
 *
 * Not an `exports` subpath: re-exported from `./resolve` and `./loader`.
 */

import type { CurationStatus } from './curation.js';

/** Inclusive year window. */
export interface Coverage {
  min: number;
  max: number;
}

/** One historial edit registro — `schemas/registro.json`. */
export interface Registro {
  id: string;
  oldid: number;
  slug?: string;
  parent_oldid?: number | null;
  timestamp?: string;
  user?: string;
  bytes?: number;
  byte_delta?: number;
  section?: string | null;
  summary?: string;
  milestone?: boolean;
  milestone_reasons?: string[];
  urls?: Record<string, unknown>;
  files?: Record<string, string>;
  source?: Record<string, unknown>;
  delta_status?: CurationStatus;
  curation_status?: CurationStatus;
  status?: CurationStatus;
  [key: string]: unknown;
}

/** Projection built by `slimRegistro`. */
export interface SlimRegistro {
  id: string;
  oldid: number;
  timestamp: string | undefined;
  section: string | null;
  milestone: boolean;
}

/** `slimRegistro` plus the parsed timestamp, as built by the loader's `byDate`. */
export interface DatedRegistro extends SlimRegistro {
  dateMs: number;
}

/** `nodos/<id>/meta.json` — `schemas/nodo-meta.json`. */
export interface NodoMeta {
  id: string;
  parte?: string;
  año_ini: number;
  año_fin?: number | null;
  etiqueta?: string;
  tesis?: string;
  tesis_villacañas?: string;
  articulos_wp?: string[];
  años_display?: string;
  urls?: Record<string, unknown>;
  [key: string]: unknown;
}

/** A trunk manifest nodo reference merged with its `meta.json` (loader). */
export interface NodoEntry extends NodoMeta {
  paths?: Record<string, string>;
}

/**
 * One entry of `manifest.meta.partes`.
 * `schemas/manifest-tronco.json` declares partes as bare objects with
 * `additionalProperties: true` and NO declared properties, so nothing beyond
 * the `id` that `resolveParte` matches on is promised by the schema.
 */
export interface ParteEntry {
  id: string;
  [key: string]: unknown;
}

/** Trunk `manifest.json` — `schemas/manifest-tronco.json`. */
export interface ManifestTronco {
  meta: {
    corpus: string;
    version?: string;
    generated_at?: string;
    source?: string;
    autor_tronco?: string;
    referencia_wp_cima?: string;
    nodo_count?: number;
    partes?: ParteEntry[];
    satelite_wp?: string;
    links?: Record<string, unknown>;
    [key: string]: unknown;
  };
  nodos: Array<{
    id: string;
    paths?: Record<string, string>;
    urls?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/** Satellite/historial `manifest.json` — `schemas/manifest-satelite.json`. */
export interface ManifestSatelite {
  meta: {
    corpus: string;
    title?: string;
    source?: string;
    generated_at?: string;
    registro_count?: number;
    ordering?: string;
    snapshots?: Record<string, unknown>;
    ontology_sections?: unknown[];
    milestones?: Array<string | Record<string, unknown>>;
    preamble?: Record<string, unknown>;
    [key: string]: unknown;
  };
  registros: Registro[];
  [key: string]: unknown;
}

/** One entry of `registry.yaml` — `schemas/lineas-registry.json`. */
export interface LineaRegistryEntry {
  id: string;
  path: string;
  etiqueta?: string;
  autor_tronco?: string;
  nodo_prefix?: string;
  nodo_count?: number;
  referencia_wp_cima?: string;
  medidor_linea_ref?: string;
  [key: string]: unknown;
}

/** One `nodo-sections.json` mapping entry. */
export interface NodoSectionMapping {
  sections: string[];
  notes?: string;
  [key: string]: unknown;
}

/** A wave-A nodo anchor, as built by the loader. */
export interface WaveAAnchor {
  nodo_id: string;
  oldid: number;
  note: string | undefined;
  anchor_year: number | null;
}

/**
 * Anchors read from `scripts/fetch-priority-viaje1.json`. That file has no
 * schema in this package, so the raw entries stay `unknown`; only the
 * projection the loader itself builds (`byNodoId`) is described.
 */
export interface WaveAIndex {
  anchors: unknown[];
  byNodoId: Record<string, WaveAAnchor>;
}

/** Cache counters recomputed by the loader and by `rescanSatelliteCache`. */
export interface CacheStats {
  registro_count: number;
  curated_registros: number;
  cached_wikitexts: number;
  cached_oldids: number[];
  milestone_count: number;
  milestones_sin_cuerpo: number;
  coverage_pct: number;
}

/** The satellite index the loader builds for one line. */
export interface SatelliteIndex {
  meta: {
    corpus: string | undefined;
    title: string | undefined;
    registro_count: number | undefined;
    milestones: Array<string | Record<string, unknown>>;
    extremes: Record<string, unknown>;
  };
  milestones: Array<string | Record<string, unknown>>;
  extremes: Record<string, unknown>;
  registroIndex: SlimRegistro[];
  byDate: DatedRegistro[];
  nodoSections: Record<string, NodoSectionMapping>;
  sectionIndex: Record<string, SlimRegistro[]>;
  waveA: WaveAIndex;
  curatedRegistroIds: Set<string>;
  coverage: Coverage | null;
  cacheStats: CacheStats;
  satDir: string;
}

/** One loaded line instance. */
export interface LineaInstance {
  entry: LineaRegistryEntry;
  manifest: ManifestTronco;
  nodos: Record<string, NodoEntry>;
  satellite: SatelliteIndex | null;
  linePath: string;
  coverage: Coverage | null;
}

/** Result of `loadLineaData`. */
export interface LineaData {
  basePath: string;
  registry: LineaRegistryEntry[];
  lineas: Record<string, LineaInstance>;
}
