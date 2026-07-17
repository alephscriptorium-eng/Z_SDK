/**
 * @zeus/protocol — contrato único (browser-safe).
 * Eventos state|intent|track|ledger con `game` en el envelope.
 * Sin imports de Node. Sin nombres de juego concretos.
 */

import { assertIntentRole } from './roles.mjs';

export const PROTOCOL_VERSION = 1;

/** Kinds canónicos del contrato (campo `event` / channel message). */
export const EVENT_KINDS = Object.freeze(['state', 'intent', 'track', 'ledger']);

export const EVENTS = Object.freeze({
  STATE: 'state',
  INTENT: 'intent',
  TRACK: 'track',
  LEDGER: 'ledger'
});

/**
 * @param {object} opts
 * @param {string} opts.game — id de juego (lo aporta el consumidor; el engine no lo hardcodea)
 * @param {string} opts.kind — uno de EVENT_KINDS
 * @param {string} [opts.from]
 * @param {number} [opts.ts]
 * @param {number} [opts.v]
 * @param {object} [opts.body]
 */
export function makeEnvelope({ game, kind, from, ts = Date.now(), v = PROTOCOL_VERSION, ...body }) {
  if (typeof game !== 'string' || !game) {
    throw new TypeError('makeEnvelope: game (string no vacío) es obligatorio');
  }
  if (!EVENT_KINDS.includes(kind)) {
    throw new TypeError(`makeEnvelope: kind inválido (${kind})`);
  }
  return {
    v,
    game,
    kind,
    ...(from != null ? { from } : {}),
    ts,
    ...body
  };
}

/**
 * Construye un intent bien formado.
 * Firma flexible: el 4º arg puede ser `from` (string) u options object
 * `{ from, game, role, ts, v }` — los juegos que aún pasan `from` string siguen OK.
 *
 * @param {string} actorId
 * @param {string} intent
 * @param {object} [args]
 * @param {string|object} [fromOrOpts]
 */
export function makeIntent(actorId, intent, args = {}, fromOrOpts = actorId) {
  const opts =
    typeof fromOrOpts === 'string' || fromOrOpts == null
      ? { from: fromOrOpts ?? actorId }
      : fromOrOpts;
  const {
    from = actorId,
    game,
    role,
    ts = Date.now(),
    v = PROTOCOL_VERSION
  } = opts;

  const payload = {
    v,
    from,
    ts,
    actorId,
    intent,
    ...args
  };
  if (game != null) payload.game = game;
  if (role != null) payload.role = role;
  return payload;
}

/**
 * Forma mínima de un intent (transporte). Si se pasa `catalog`, el `intent`
 * debe existir en el catálogo; si no, solo se exige string no vacío.
 *
 * @param {unknown} payload
 * @param {Map<string, object>|Record<string, object>|string[]|null} [catalog]
 */
export function isIntentShaped(payload, catalog = null) {
  if (!payload || typeof payload !== 'object') return false;
  if (typeof payload.actorId !== 'string' || !payload.actorId) return false;
  if (typeof payload.intent !== 'string' || !payload.intent) return false;
  if (catalog == null) return true;
  if (Array.isArray(catalog)) return catalog.includes(payload.intent);
  if (catalog instanceof Map) return catalog.has(payload.intent);
  if (typeof catalog.has === 'function') return catalog.has(payload.intent);
  return Object.prototype.hasOwnProperty.call(catalog, payload.intent);
}

/**
 * Valida forma + rol en un solo paso (para authorities / domain-state).
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateIntent(payload, catalog) {
  if (!isIntentShaped(payload, catalog)) {
    return { ok: false, error: 'intent_malformada' };
  }
  return assertIntentRole(payload, catalog);
}
