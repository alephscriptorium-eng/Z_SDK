/**
 * Declarations for `@zeus/linea-kit/loader` (src/loader.mjs).
 * Node-only fs loader for line corpora under a DISK_02/LINEAS layout.
 *
 * Re-exports the whole pure `./resolve` surface and the forces loader, exactly
 * as `src/loader.mjs` does.
 *
 * `readWikitext` discriminates on `cached` (a literal `true` / `false`);
 * `readRegistro` uses the `error` envelope, so narrow it with
 * `if (result.error !== undefined)` and not with a bare truthiness test.
 */

import type { CacheStats, SatelliteIndex, SlimRegistro } from './model.js';

export * from './resolve.js';
export * from './forces-loader.js';

export interface CacheDirResolver {
  (satDir: string): string;
}

export interface LoadLineaDataOptions {
  resolveCacheDir?: CacheDirResolver;
  troncoCoverage?: { min: number; max: number };
  sateliteCoverage?: { min: number; max: number };
}

/**
 * Load `registry.yaml` and every line instance under `basePath` (read-only).
 * @throws {Error} when `basePath` is missing or not a string.
 */
export declare function loadLineaData(
  basePath: string,
  options?: LoadLineaDataOptions
): Promise<import('./model.js').LineaData>;

/** Re-scan `cache/snapshots` and update `satellite.cacheStats` in place. */
export declare function rescanSatelliteCache(
  satellite: SatelliteIndex,
  options?: { resolveCacheDir?: CacheDirResolver }
): Promise<CacheStats>;

/** The uncached branch of `readWikitext`: a refusal plus the poll hint. */
export interface WikitextNotCached {
  error: string;
  cached: false;
  oldid: number;
  stats: CacheStats;
  hint: string;
  action: {
    tool: 'cache_wikitext';
    server: 'linea-wp-historia';
    arguments: { oldid: number };
    poll: string;
  };
}

export interface WikitextCached {
  oldid: number;
  cached: true;
  wikitext_length: number;
  wikitext: string;
  /** Parsed `<oldid>.meta.json`, `null` when absent. Read without validating. */
  meta: unknown;
  error?: undefined;
}

/** Bare failure (invalid oldid, unreadable file). */
export interface WikitextError {
  error: string;
  cached?: undefined;
}

/** Minimal shape the wikitext / registro readers need. */
export interface SatelliteReadSource {
  satDir: string;
  cacheStats: CacheStats;
  registroIndex: SlimRegistro[];
}

export declare function readWikitext(
  satellite: SatelliteReadSource,
  oldid: number | string,
  options?: { resolveCacheDir?: CacheDirResolver }
): Promise<WikitextCached | WikitextNotCached | WikitextError>;

export interface RegistroSidecars {
  registro_id: string;
  oldid: number;
  timestamp: string | undefined;
  milestone: boolean;
  /** `registro.md` (or the first `registro*` sidecar), `null` when absent. */
  registro_md: string | null;
  /** The second `*.md` sidecar of the directory, `null` when absent. */
  delta_md: string | null;
  /** Every `*.md` of the registro directory, by file name. */
  markdown: Record<string, string>;
  error?: undefined;
}

export interface RegistroReadError {
  error: string;
  stats?: CacheStats;
  hint?: string;
}

/**
 * Read the curated markdown sidecars of a registro (every `*.md` of its
 * directory — no game-named filenames in engine code).
 */
export declare function readRegistro(
  satellite: SatelliteReadSource,
  registroId: string
): Promise<RegistroSidecars | RegistroReadError>;
