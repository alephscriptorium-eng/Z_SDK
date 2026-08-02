/**
 * Declarations for src/forces-loader.mjs.
 *
 * Not an `exports` subpath of its own: reached through `./loader`, which
 * re-exports all five functions.
 *
 * `resolveForce` / `resolveForceScene` use the `error` envelope: narrow with
 * `if (result.error !== undefined)`, not with a bare truthiness test.
 */

/** A typed `pairs_with` ref that could not be resolved yet. */
export interface PendingRef {
  ref: string;
  status: 'pending';
  reason: string;
}

/** A typed `pairs_with` ref that resolved against the volume. */
export interface ResolvedRef {
  ref: string;
  status: 'ok';
  kind: string;
}

export interface PairsClassification {
  pairs_with: string[];
  pending_refs: PendingRef[];
  resolved_refs: ResolvedRef[];
}

export interface PairsContext {
  localIds?: Set<string> | Iterable<string>;
  mountedLineaIds?: Set<string> | Iterable<string>;
}

/**
 * Classify typed `pairs_with` refs. Unmounted `linea:*` refs are pending,
 * never hard errors; so are local force/cota/boot refs missing from the volume.
 */
export declare function classifyPairsWith(
  pairs: string[],
  ctx?: PairsContext
): PairsClassification;

/**
 * One loaded force/cota corpus.
 *
 * `card` is the parsed `force.json` / `cota.json` and `manifest` the parsed
 * `manifest.json`; both are read without validating, so they stay `unknown`.
 * Use `@zeus/linea-kit/validate` to promote them to a known form.
 */
export interface ForceCorpus {
  id: string;
  kind: string;
  bound: string | undefined;
  entry: unknown;
  card: unknown;
  manifest: unknown;
  corpusDir: string;
  scenesByKey: Map<string, unknown>;
  anchor_scene: string | undefined;
  pairs_with?: string[];
  pending_refs?: PendingRef[];
  resolved_refs?: ResolvedRef[];
}

/** Result of `loadForcesData`. */
export interface ForcesData {
  basePath: string;
  /** Parsed `registry.json`; see `schemas/force-registry.json`. */
  registry: unknown;
  forces: Record<string, ForceCorpus>;
  cotas: Record<string, ForceCorpus>;
  localIds: Set<string>;
  mountedLineaIds: Set<string>;
  pairCtx: { localIds: Set<string>; mountedLineaIds: Set<string> };
}

export interface LoadForcesOptions {
  mountedLineaIds?: Iterable<string>;
  lineasBasePath?: string;
}

/** Load the FORCES registry plus every force/cota corpus under `basePath`. */
export declare function loadForcesData(
  basePath: string,
  options?: LoadForcesOptions
): Promise<ForcesData>;

/**
 * Flattened registry view for the `force://registry` resource.
 *
 * `activation` / `session_budget` are copied straight out of the parsed
 * registry, which this function does not validate — pass them through
 * `normalizeForceRegistry` to obtain the declared `ForceRegistryView`.
 */
export interface ForcesRegistryView {
  registry: unknown;
  version: unknown;
  description: unknown;
  imported_at: unknown;
  boot: unknown;
  activation: unknown;
  session_budget: unknown;
  force_ids: string[];
  cota_ids: string[];
  force_count: number;
  cota_count: number;
}

export declare function buildForcesRegistryView(data: ForcesData): ForcesRegistryView;

/** Failure envelope of the forces loader queries. */
export interface ForcesError {
  error: string;
  hint?: string;
}

export interface ResolvedForce {
  id: string;
  kind: string;
  bound?: string | undefined;
  pole?: unknown;
  card: unknown;
  anchor_scene: string | undefined;
  scene_count: unknown;
  scene_ids: unknown[];
  pairs_with: string[] | undefined;
  pending_refs: PendingRef[] | undefined;
  resolved_refs: ResolvedRef[] | undefined;
  error?: undefined;
}

export declare function resolveForce(
  data: ForcesData,
  id: string
): ResolvedForce | ForcesError;

export interface ResolvedForceScene {
  force_id: string;
  scene_key: string;
  /** Copied from the unvalidated `manifest.json` scene entry. */
  scene: {
    id: unknown;
    session: unknown;
    slug: unknown;
    title: unknown;
    tags: unknown;
    rol: unknown;
    anomalies: unknown;
  };
  /**
   * Layer name → file contents, `null` when the layer is absent or unreadable.
   * An unreadable layer also adds a `<layer>_error` entry with the message.
   */
  layers: Record<string, string | null>;
  is_anchor: boolean;
  error?: undefined;
}

export declare function resolveForceScene(
  data: ForcesData,
  id: string,
  session: string,
  slug: string
): Promise<ResolvedForceScene | ForcesError>;
