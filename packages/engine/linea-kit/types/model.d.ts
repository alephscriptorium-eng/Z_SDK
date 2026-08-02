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
  /**
   * `| undefined` on purpose, not just `?`. `segmentar.mjs:74` writes the OWN
   * key with the value `undefined` (`bytes: raw.bytes`), so under
   * `exactOptionalPropertyTypes` a plain `bytes?: number` would forbid the
   * very value the tool produces.
   */
  bytes?: number | undefined;
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
 *
 * `schemas/manifest-tronco.json:22` declares partes as bare objects with
 * `additionalProperties: true` and NOT ONE declared property. So the schema
 * promises nothing at all here — not even the `id`. Measured:
 *
 *     validate('manifest-tronco',
 *       {meta:{corpus:'demo', partes:[{}, {titulo:'sin id'}]}, nodos:[{id:'N01'}]})
 *       -> ok: true,  partes[0].id === undefined
 *
 * and that manifest travels inside the `LineaInstance.manifest` that
 * `loadLineaData` hands back. `id` is therefore optional AND `unknown`: a
 * consumer writing `partes.map(p => p.id.toUpperCase())` must be stopped by
 * the compiler, because the runtime will not stop it.
 *
 * `resolveParte`'s own result is a different matter: it reaches an entry only
 * through `find(e => e.id === parteId)` with a `string` on the right of a
 * `===`, so `ResolvedParte.id` is soundly `string`.
 */
export interface ParteEntry {
  id?: unknown;
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
