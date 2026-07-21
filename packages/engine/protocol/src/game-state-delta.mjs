/**
 * GAME_STATE_DELTA — contrato de parches de estado (gamechannel v0.2).
 * Browser-safe. Sin nombres de juego (D-8): opera sobre snapshots genéricos
 * con mapas `actors` / `anchors` (u otras claves Record declaradas).
 *
 * Full snapshot = `mode: 'full'` (o ausencia de mode, legado).
 * Delta = `mode: 'delta'` + `baseTick` + entradas cambiadas (`null` = borrado).
 */

/** Nombre wire gamechannel (alias Rooms). */
export const GAME_STATE_DELTA = 'GAME_STATE_DELTA';

/** Versión de mensaje gamechannel para deltas (TOPICS v0.2). */
export const GAME_STATE_DELTA_V = 2;

/** Claves Record por defecto que se difan entrada-a-entrada. */
export const DEFAULT_DELTA_MAP_KEYS = Object.freeze(['actors', 'anchors']);

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function deepEqualJson(a, b) {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * @param {object} map
 * @returns {boolean}
 */
function isPlainObject(map) {
  return map != null && typeof map === 'object' && !Array.isArray(map);
}

/**
 * Diff de dos snapshots autoritativos → cuerpo de delta (sin envelope).
 *
 * @param {object|null|undefined} prev — último estado conocido del viewer/autoridad
 * @param {object} next — snapshot completo actual
 * @param {object} [opts]
 * @param {string[]} [opts.mapKeys] — claves Record a difar (default actors/anchors)
 * @param {string} [opts.reason]
 * @returns {object} delta con `mode: 'delta'`
 */
export function diffGameState(prev, next, opts = {}) {
  if (!isPlainObject(next)) {
    throw new TypeError('diffGameState: next debe ser objeto');
  }
  const mapKeys = opts.mapKeys ?? DEFAULT_DELTA_MAP_KEYS;
  const reason = opts.reason ?? next.reason;
  const baseTick =
    prev != null && Number.isInteger(prev.tick) ? prev.tick : next.tick ?? 0;

  /** @type {Record<string, unknown>} */
  const delta = {
    mode: 'delta',
    baseTick,
    tick: next.tick,
    ts: next.ts,
    sceneId: next.sceneId,
    ...(reason != null ? { reason } : {})
  };

  for (const key of mapKeys) {
    const prevMap = isPlainObject(prev?.[key]) ? prev[key] : {};
    const nextMap = isPlainObject(next[key]) ? next[key] : {};
    /** @type {Record<string, unknown>} */
    const patch = {};
    let changed = false;

    for (const id of new Set([...Object.keys(prevMap), ...Object.keys(nextMap)])) {
      const hasPrev = Object.prototype.hasOwnProperty.call(prevMap, id);
      const hasNext = Object.prototype.hasOwnProperty.call(nextMap, id);
      if (!hasNext && hasPrev) {
        patch[id] = null;
        changed = true;
        continue;
      }
      if (hasNext && (!hasPrev || !deepEqualJson(prevMap[id], nextMap[id]))) {
        patch[id] = nextMap[id];
        changed = true;
      }
    }
    if (changed) delta[key] = patch;
  }

  return delta;
}

/**
 * Aplica un delta sobre un snapshot base → nuevo estado (modo full).
 *
 * @param {object} base
 * @param {object} delta
 * @param {object} [opts]
 * @param {string[]} [opts.mapKeys]
 * @returns {{ ok: true, state: object } | { ok: false, error: string }}
 */
export function applyGameStateDelta(base, delta, opts = {}) {
  if (!isPlainObject(base)) {
    return { ok: false, error: 'base_invalida' };
  }
  if (!isGameStateDeltaShaped(delta)) {
    return { ok: false, error: 'delta_malformada' };
  }
  if (
    Number.isInteger(base.tick) &&
    Number.isInteger(delta.baseTick) &&
    base.tick !== delta.baseTick
  ) {
    return { ok: false, error: 'base_tick_mismatch' };
  }

  const mapKeys = opts.mapKeys ?? DEFAULT_DELTA_MAP_KEYS;
  /** @type {Record<string, unknown>} */
  const state = {
    ...base,
    mode: 'full',
    tick: delta.tick ?? base.tick,
    ts: delta.ts ?? base.ts,
    ...(delta.sceneId != null ? { sceneId: delta.sceneId } : {}),
    ...(delta.reason != null ? { reason: delta.reason } : {})
  };

  for (const key of mapKeys) {
    if (!Object.prototype.hasOwnProperty.call(delta, key)) continue;
    const patch = delta[key];
    if (!isPlainObject(patch)) {
      return { ok: false, error: `delta_${key}_invalida` };
    }
    const prevMap = isPlainObject(base[key]) ? { ...base[key] } : {};
    for (const [id, value] of Object.entries(patch)) {
      if (value === null) delete prevMap[id];
      else prevMap[id] = value;
    }
    state[key] = prevMap;
  }

  return { ok: true, state };
}

/**
 * ¿El payload es un delta wire (mode delta + baseTick + tick)?
 * No exige envelope `game`/`kind` (sirve para cuerpo domain o mensaje Rooms).
 *
 * @param {unknown} data
 * @returns {boolean}
 */
export function isGameStateDeltaShaped(data) {
  if (!isPlainObject(data)) return false;
  if (data.mode !== 'delta') return false;
  if (!Number.isInteger(data.baseTick)) return false;
  if (!Number.isInteger(data.tick)) return false;
  if (data.actors != null && !isPlainObject(data.actors)) return false;
  if (data.anchors != null && !isPlainObject(data.anchors)) return false;
  return true;
}

/**
 * Delta vacío (sin mapas parcheados) — útil para omitir publish en heartbeat.
 *
 * @param {object} delta
 * @param {string[]} [mapKeys]
 * @returns {boolean}
 */
export function isEmptyGameStateDelta(delta, mapKeys = DEFAULT_DELTA_MAP_KEYS) {
  if (!isGameStateDeltaShaped(delta)) return false;
  return mapKeys.every((key) => {
    const patch = delta[key];
    return patch == null || Object.keys(patch).length === 0;
  });
}

/**
 * Construye mensaje gamechannel GAME_STATE_DELTA (sin campo `game` de protocol).
 *
 * @param {object} body — salida de diffGameState (+ from)
 * @returns {object}
 */
export function makeGameStateDeltaMessage(body) {
  if (!isGameStateDeltaShaped(body)) {
    throw new TypeError('makeGameStateDeltaMessage: body no es delta válido');
  }
  const { mode: _mode, ...rest } = body;
  return {
    type: GAME_STATE_DELTA,
    v: GAME_STATE_DELTA_V,
    mode: 'delta',
    ...rest
  };
}
