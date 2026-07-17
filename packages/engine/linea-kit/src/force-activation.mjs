/**
 * Pure force session activation (DATOS.md §8, D-19).
 * Browser-safe: no fs, no network. All force ids come from injected registry data.
 * Engine never hardcodes concrete corpus ids — only applies session_budget,
 * exclusions and boot rules from the registry view.
 */

/**
 * @typedef {{
 *   id: string,
 *   kind?: string,
 *   anchor_scene?: string|null,
 *   pairs_with?: string[]
 * }} ForceCard
 *
 * @typedef {{
 *   id: string,
 *   bound?: 'lower'|'upper'|string,
 *   pole?: string,
 *   anchor_scene?: string|null
 * }} CotaCard
 *
 * @typedef {{
 *   boot: string|null,
 *   activation: {
 *     session_budget: { max_active_forces: number, boot_always_on?: boolean },
 *     exclusions?: Array<{ pair: [string, string], reason?: string }>,
 *     cotas?: { lower?: string, upper?: string }
 *   },
 *   forcesById: Record<string, ForceCard>,
 *   cotasById: Record<string, CotaCard>
 * }} ForceRegistryView
 */

/**
 * Normalize a registry.json-shaped object (or already-normalized view) into
 * a lookup-friendly ForceRegistryView.
 *
 * @param {object} registry
 * @returns {ForceRegistryView}
 */
export function normalizeForceRegistry(registry) {
  if (!registry || typeof registry !== 'object') {
    throw new TypeError('normalizeForceRegistry: registry object required');
  }
  const activation = registry.activation ?? {};
  const session_budget = activation.session_budget ?? {};
  if (typeof session_budget.max_active_forces !== 'number') {
    throw new TypeError('normalizeForceRegistry: activation.session_budget.max_active_forces required');
  }

  /** @type {Record<string, ForceCard>} */
  const forcesById = { ...(registry.forcesById ?? {}) };
  for (const entry of registry.forces ?? []) {
    if (!entry?.id) continue;
    forcesById[entry.id] = {
      id: entry.id,
      kind: entry.kind,
      anchor_scene: entry.anchor_scene ?? null,
      pairs_with: Array.isArray(entry.pairs_with) ? [...entry.pairs_with] : []
    };
  }

  /** @type {Record<string, CotaCard>} */
  const cotasById = { ...(registry.cotasById ?? {}) };
  for (const entry of registry.cotas ?? []) {
    if (!entry?.id) continue;
    cotasById[entry.id] = {
      id: entry.id,
      bound: entry.bound,
      pole: entry.pole,
      anchor_scene: entry.anchor_scene ?? null
    };
  }

  return {
    boot: registry.boot ?? null,
    activation: {
      session_budget: {
        max_active_forces: session_budget.max_active_forces,
        boot_always_on: session_budget.boot_always_on !== false
      },
      exclusions: Array.isArray(activation.exclusions)
        ? activation.exclusions.map((e) => ({
            pair: /** @type {[string, string]} */ ([String(e.pair[0]), String(e.pair[1])]),
            ...(e.reason != null ? { reason: String(e.reason) } : {})
          }))
        : [],
      cotas: {
        ...(activation.cotas?.lower != null ? { lower: String(activation.cotas.lower) } : {}),
        ...(activation.cotas?.upper != null ? { upper: String(activation.cotas.upper) } : {})
      }
    },
    forcesById,
    cotasById
  };
}

/**
 * Initial active set: boot id when boot_always_on.
 * @param {ForceRegistryView} registry
 * @returns {string[]}
 */
export function initialActiveForces(registry) {
  const active = [];
  const boot = registry.boot;
  if (registry.activation.session_budget.boot_always_on && boot && registry.forcesById[boot]) {
    active.push(boot);
  }
  return active;
}

/**
 * Navigable track ref for a force/cota anchor scene (MCP force:// resource shape).
 * @param {string} forceId
 * @param {string|null|undefined} anchorScene — "session/slug"
 * @returns {{ kind: 'force-scene', uri: string, forceId: string, sceneKey: string }|null}
 */
export function forceAnchorTrackRef(forceId, anchorScene) {
  if (!forceId || typeof forceId !== 'string') return null;
  if (!anchorScene || typeof anchorScene !== 'string') return null;
  const sceneKey = anchorScene.replace(/^\/+|\/+$/g, '');
  if (!sceneKey.includes('/')) return null;
  return {
    kind: 'force-scene',
    uri: `force://${forceId}/scene/${sceneKey}`,
    forceId,
    sceneKey
  };
}

/**
 * Position between cotas (sima/cima poles) for round state.
 * @param {ForceRegistryView} registry
 * @param {{ collapsed?: boolean, victory?: boolean, t?: number }} [round]
 */
export function cotasSnapshot(registry, round = {}) {
  const lower = registry.activation.cotas?.lower ?? null;
  const upper = registry.activation.cotas?.upper ?? null;
  let t = 0.5;
  if (typeof round.t === 'number' && Number.isFinite(round.t)) {
    t = Math.max(0, Math.min(1, round.t));
  } else if (round.collapsed) {
    t = 0;
  } else if (round.victory) {
    t = 1;
  }
  /** @type {'colapso'|'victoria'|'entre'} */
  let pole = 'entre';
  if (t <= 0) pole = 'colapso';
  else if (t >= 1) pole = 'victoria';

  const lowerCard = lower ? registry.cotasById[lower] : null;
  const upperCard = upper ? registry.cotasById[upper] : null;

  return {
    lower,
    upper,
    t,
    pole,
    lowerTrack: lowerCard
      ? forceAnchorTrackRef(lower, lowerCard.anchor_scene)
      : null,
    upperTrack: upperCard
      ? forceAnchorTrackRef(upper, upperCard.anchor_scene)
      : null
  };
}

/**
 * @param {ForceRegistryView} registry
 * @param {Iterable<string>} activeIds
 * @param {string} forceId
 * @returns {{ ok: true, force: ForceCard, ref: object|null } | { ok: false, error: string, detail?: object }}
 */
export function explainActivate(registry, activeIds, forceId) {
  if (!forceId || typeof forceId !== 'string') {
    return { ok: false, error: 'force_id_requerido' };
  }
  const force = registry.forcesById[forceId];
  if (!force) {
    return { ok: false, error: 'force_desconocida', detail: { forceId } };
  }
  const active = activeIds instanceof Set ? activeIds : new Set(activeIds);
  if (active.has(forceId)) {
    return { ok: false, error: 'force_ya_activa', detail: { forceId } };
  }

  const max = registry.activation.session_budget.max_active_forces;
  if (active.size + 1 > max) {
    return {
      ok: false,
      error: 'session_budget_exceeded',
      detail: {
        forceId,
        active: [...active],
        max_active_forces: max,
        attempted: active.size + 1
      }
    };
  }

  for (const excl of registry.activation.exclusions ?? []) {
    const [a, b] = excl.pair;
    const other = forceId === a ? b : forceId === b ? a : null;
    if (other && active.has(other)) {
      return {
        ok: false,
        error: 'pair_excluded',
        detail: {
          forceId,
          other,
          pair: excl.pair,
          ...(excl.reason != null ? { reason: excl.reason } : {})
        }
      };
    }
  }

  return {
    ok: true,
    force,
    ref: forceAnchorTrackRef(forceId, force.anchor_scene)
  };
}

/**
 * @param {ForceRegistryView} registry
 * @param {Iterable<string>} activeIds
 * @param {string} forceId
 * @returns {{ ok: true, force: ForceCard } | { ok: false, error: string, detail?: object }}
 */
export function explainDeactivate(registry, activeIds, forceId) {
  if (!forceId || typeof forceId !== 'string') {
    return { ok: false, error: 'force_id_requerido' };
  }
  const force = registry.forcesById[forceId];
  if (!force) {
    return { ok: false, error: 'force_desconocida', detail: { forceId } };
  }
  const active = activeIds instanceof Set ? activeIds : new Set(activeIds);
  if (!active.has(forceId)) {
    return { ok: false, error: 'force_no_activa', detail: { forceId } };
  }
  if (
    registry.activation.session_budget.boot_always_on &&
    registry.boot &&
    forceId === registry.boot
  ) {
    return { ok: false, error: 'boot_no_desactivable', detail: { forceId } };
  }
  return { ok: true, force };
}

/**
 * @param {ForceRegistryView} registry
 * @param {Iterable<string>} activeIds
 * @param {string} forceId
 * @returns {{ ok: true, active: string[], force: ForceCard, ref: object|null } | { ok: false, error: string, detail?: object }}
 */
export function applyActivate(registry, activeIds, forceId) {
  const check = explainActivate(registry, activeIds, forceId);
  if (!check.ok) return check;
  const next = [...(activeIds instanceof Set ? activeIds : new Set(activeIds)), forceId];
  return { ok: true, active: next, force: check.force, ref: check.ref };
}

/**
 * @param {ForceRegistryView} registry
 * @param {Iterable<string>} activeIds
 * @param {string} forceId
 * @returns {{ ok: true, active: string[], force: ForceCard } | { ok: false, error: string, detail?: object }}
 */
export function applyDeactivate(registry, activeIds, forceId) {
  const check = explainDeactivate(registry, activeIds, forceId);
  if (!check.ok) return check;
  const next = [...(activeIds instanceof Set ? activeIds : activeIds)].filter((id) => id !== forceId);
  return { ok: true, active: next, force: check.force };
}
