/**
 * Gamemap adapter — reproduce a viaje as walk intents between anchors.
 *
 * Generic engine terms only (anchors / streets / walk). No game pack names.
 * Authority acceptance for live rooms is a consumer concern; until then this
 * module validates intent shape locally (pendingAuthority / stub).
 */

/**
 * @typedef {{
 *   kind: 'walk',
 *   from: string,
 *   to: string,
 *   street?: string|null,
 *   hop: number
 * }} WalkIntent
 */

/**
 * @param {object} recorrido — viaje with pasos[]
 * @param {{
 *   streetForHop?: (from: string, to: string, hop: number) => string|null,
 *   anchors?: Set<string>|string[]
 * }} [opts]
 * @returns {{ ok: true, walks: WalkIntent[] }|{ ok: false, error: string, rule: string }}
 */
export function viajeToWalkIntents(recorrido, opts = {}) {
  if (!recorrido || !Array.isArray(recorrido.pasos)) {
    return {
      ok: false,
      error: 'recorrido.pasos required',
      rule: 'viaje.gamemap.args'
    };
  }

  const anchorSet = opts.anchors
    ? new Set(Array.isArray(opts.anchors) ? opts.anchors : [...opts.anchors])
    : null;

  /** @type {WalkIntent[]} */
  const walks = [];
  for (let i = 0; i < recorrido.pasos.length; i += 1) {
    const paso = recorrido.pasos[i];
    if (!paso?.from || !paso?.to) {
      return {
        ok: false,
        error: `paso[${i}] missing from/to`,
        rule: 'viaje.gamemap.paso'
      };
    }
    if (anchorSet) {
      if (!anchorSet.has(paso.from) || !anchorSet.has(paso.to)) {
        return {
          ok: false,
          error: `paso[${i}] references unknown anchor`,
          rule: 'viaje.gamemap.anchor',
          from: paso.from,
          to: paso.to
        };
      }
    }
    const street =
      opts.streetForHop?.(paso.from, paso.to, i) ?? paso.via ?? null;
    walks.push({
      kind: 'walk',
      from: paso.from,
      to: paso.to,
      street,
      hop: i
    });
  }

  return { ok: true, walks };
}

/**
 * Local acceptor: shape-check walk intents when room authority is absent (pendingAuthority).
 * @param {WalkIntent[]} walks
 * @returns {{ ok: true, accepted: WalkIntent[] }|{ ok: false, error: string, rule: string, at?: number }}
 */
export function acceptWalks(walks) {
  if (!Array.isArray(walks)) {
    return { ok: false, error: 'walks array required', rule: 'viaje.gamemap.accept' };
  }
  for (let i = 0; i < walks.length; i += 1) {
    const w = walks[i];
    if (!w || w.kind !== 'walk' || !w.from || !w.to) {
      return {
        ok: false,
        error: `invalid walk intent at ${i}`,
        rule: 'viaje.gamemap.accept.shape',
        at: i
      };
    }
  }
  return { ok: true, accepted: walks };
}

/**
 * GraphSource from anchor→street adjacency (caller supplies map).
 * @param {{
 *   streets: Record<string, string[]>,
 *   labels?: Record<string, string>
 * }} options
 */
export function createGamemapGraphSource(options) {
  const streets = options.streets ?? {};
  const labels = options.labels ?? {};
  return {
    kind: 'gamemap',
    getNode(id) {
      const known =
        id in streets ||
        Object.values(streets).some((arr) => arr.includes(id));
      if (!known) return null;
      return { id, label: labels[id] ?? id, meta: { source: 'gamemap-anchors' } };
    },
    neighbors(id) {
      return (streets[id] ?? []).map((to) => ({
        id: `${id}->${to}`,
        to,
        label: 'street'
      }));
    }
  };
}
