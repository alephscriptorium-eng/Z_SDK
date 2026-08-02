/**
 * Declarations for `@zeus/linea-kit/force-activation` (src/force-activation.mjs).
 * Pure force session activation (DATOS.md §8, D-19). Browser-safe.
 *
 * The typedef names below (`ForceCard`, `CotaCard`, `ForceRegistryView`) are
 * the ones the source JSDoc already uses.
 */

/** A force as the activation engine sees it. */
export interface ForceCard {
  id: string;
  kind?: string;
  anchor_scene?: string | null;
  pairs_with?: string[];
}

/** A cota (sima/cima pole) as the activation engine sees it. */
export interface CotaCard {
  id: string;
  bound?: 'lower' | 'upper' | string;
  pole?: string;
  anchor_scene?: string | null;
}

export interface SessionBudget {
  max_active_forces: number;
  boot_always_on?: boolean;
}

export interface ForceExclusion {
  pair: [string, string];
  reason?: string;
}

export interface ForceActivationRules {
  session_budget: SessionBudget;
  exclusions?: ForceExclusion[];
  cotas?: { lower?: string; upper?: string };
}

/** Lookup-friendly registry view — the output of `normalizeForceRegistry`. */
export interface ForceRegistryView {
  boot: string | null;
  activation: ForceActivationRules;
  forcesById: Record<string, ForceCard>;
  cotasById: Record<string, CotaCard>;
}

/**
 * Normalize a `registry.json`-shaped object (or an already-normalized view).
 *
 * The argument is `unknown`: this accepts both the on-disk
 * `schemas/force-registry.json` shape and a pre-built view, and the two do not
 * share a declared form.
 *
 * @throws {TypeError} when the object is missing
 *   `activation.session_budget.max_active_forces`.
 */
export declare function normalizeForceRegistry(registry: unknown): ForceRegistryView;

/** Initial active set: the boot id when `boot_always_on`. */
export declare function initialActiveForces(registry: ForceRegistryView): string[];

/** A navigable `force://` scene reference. */
export interface ForceTrackRef {
  kind: 'force-scene';
  uri: string;
  forceId: string;
  sceneKey: string;
}

/**
 * Track ref for a force/cota anchor scene (MCP `force://` resource shape).
 * Returns `null` when the anchor is absent or is not a `session/slug` pair.
 */
export declare function forceAnchorTrackRef(
  forceId: string,
  anchorScene: string | null | undefined
): ForceTrackRef | null;

export interface RoundState {
  collapsed?: boolean;
  victory?: boolean;
  t?: number;
}

export interface CotasSnapshot {
  lower: string | null;
  upper: string | null;
  t: number;
  pole: 'colapso' | 'victoria' | 'entre';
  lowerTrack: ForceTrackRef | null;
  upperTrack: ForceTrackRef | null;
}

/** Position between cotas for a round state. */
export declare function cotasSnapshot(
  registry: ForceRegistryView,
  round?: RoundState
): CotasSnapshot;

/**
 * Refusal of an activation/deactivation. `error` is a stable token:
 * `force_id_requerido`, `force_desconocida`, `force_ya_activa`,
 * `session_budget_exceeded`, `pair_excluded`, `force_no_activa`,
 * `boot_no_desactivable`.
 *
 * `detail` varies per token and is left `unknown` on purpose.
 */
export interface ForceRefusal {
  ok: false;
  error: string;
  detail?: unknown;
}

export interface ExplainActivateOk {
  ok: true;
  force: ForceCard;
  ref: ForceTrackRef | null;
}

export interface ExplainDeactivateOk {
  ok: true;
  force: ForceCard;
}

export interface ApplyActivateOk {
  ok: true;
  active: string[];
  force: ForceCard;
  ref: ForceTrackRef | null;
}

export interface ApplyDeactivateOk {
  ok: true;
  active: string[];
  force: ForceCard;
}

/** Dry-run of an activation against budget, exclusions and current set. */
export declare function explainActivate(
  registry: ForceRegistryView,
  activeIds: Iterable<string>,
  forceId: string
): ExplainActivateOk | ForceRefusal;

/** Dry-run of a deactivation (boot is not deactivable when always-on). */
export declare function explainDeactivate(
  registry: ForceRegistryView,
  activeIds: Iterable<string>,
  forceId: string
): ExplainDeactivateOk | ForceRefusal;

/** `explainActivate` plus the resulting active list. */
export declare function applyActivate(
  registry: ForceRegistryView,
  activeIds: Iterable<string>,
  forceId: string
): ApplyActivateOk | ForceRefusal;

/** `explainDeactivate` plus the resulting active list. */
export declare function applyDeactivate(
  registry: ForceRegistryView,
  activeIds: Iterable<string>,
  forceId: string
): ApplyDeactivateOk | ForceRefusal;
