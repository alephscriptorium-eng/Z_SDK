/**
 * Peer Card — credencial revocable de rol (patrón transmedia-system).
 *
 * Forma mínima:
 *   { roomId, endpoint, token, scopes, expiresAt, displayName?, sessionId? }
 *
 * scopes tipicos: `role:player` | `role:dj` | `role:operator` más
 * permisos de transporte (`presence:join`, `events:publish`, …).
 *
 * No es identidad fuerte (eso es SSB / horizonte U73); es un ticket de room
 * con rol y caducidad, reutilizable luego por WebRTC (ola 10).
 */

import { ROLES, isRole } from './roles.mjs';

const ROLE_SCOPE_PREFIX = 'role:';

/**
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint
 * @param {string} input.token
 * @param {string[]} input.scopes
 * @param {string|number|Date} input.expiresAt — ISO string o epoch ms
 * @param {string} [input.displayName]
 * @param {string} [input.sessionId]
 */
export function makePeerCard({
  roomId,
  endpoint,
  token,
  scopes,
  expiresAt,
  displayName,
  sessionId
}) {
  if (typeof roomId !== 'string' || !roomId) {
    throw new TypeError('makePeerCard: roomId requerido');
  }
  if (typeof endpoint !== 'string' || !endpoint) {
    throw new TypeError('makePeerCard: endpoint requerido');
  }
  if (typeof token !== 'string' || !token) {
    throw new TypeError('makePeerCard: token requerido');
  }
  if (!Array.isArray(scopes) || scopes.length === 0) {
    throw new TypeError('makePeerCard: scopes[] no vacío requerido');
  }
  const expiresMs = toEpochMs(expiresAt);
  if (!Number.isFinite(expiresMs)) {
    throw new TypeError('makePeerCard: expiresAt inválido');
  }
  const card = {
    roomId,
    endpoint,
    token,
    scopes: [...scopes],
    expiresAt: new Date(expiresMs).toISOString()
  };
  if (displayName != null) card.displayName = displayName;
  if (sessionId != null) card.sessionId = sessionId;
  return card;
}

/**
 * @param {unknown} card
 */
export function isPeerCardShaped(card) {
  return Boolean(
    card &&
      typeof card === 'object' &&
      typeof card.roomId === 'string' &&
      card.roomId &&
      typeof card.endpoint === 'string' &&
      card.endpoint &&
      typeof card.token === 'string' &&
      card.token &&
      Array.isArray(card.scopes) &&
      card.scopes.length > 0 &&
      card.expiresAt != null
  );
}

/**
 * @param {object} card
 * @param {number} [now=Date.now()]
 */
export function isPeerCardFresh(card, now = Date.now()) {
  if (!isPeerCardShaped(card)) return false;
  const expiresMs = toEpochMs(card.expiresAt);
  return Number.isFinite(expiresMs) && expiresMs > now;
}

/**
 * Extrae el primer rol declarado en scopes (`role:player` …).
 * @param {string[]|object} scopesOrCard
 * @returns {string|null}
 */
export function roleFromPeerCard(scopesOrCard) {
  const scopes = Array.isArray(scopesOrCard)
    ? scopesOrCard
    : scopesOrCard?.scopes;
  if (!Array.isArray(scopes)) return null;
  for (const scope of scopes) {
    if (typeof scope !== 'string' || !scope.startsWith(ROLE_SCOPE_PREFIX)) continue;
    const role = scope.slice(ROLE_SCOPE_PREFIX.length);
    if (isRole(role)) return role;
  }
  return null;
}

/**
 * ¿La card acredita un rol concreto y sigue vigente?
 * @param {object} card
 * @param {string} role
 * @param {number} [now]
 */
export function peerCardGrantsRole(card, role, now = Date.now()) {
  if (!isRole(role)) return false;
  if (!isPeerCardFresh(card, now)) return false;
  return roleFromPeerCard(card) === role || card.scopes.includes(`${ROLE_SCOPE_PREFIX}${role}`);
}

/**
 * Scope helper: lista canónica de roles como scopes.
 * @param {string} role
 */
export function roleScope(role) {
  if (!isRole(role)) throw new TypeError(`roleScope: rol desconocido ${role}`);
  return `${ROLE_SCOPE_PREFIX}${role}`;
}

export { ROLES };

function toEpochMs(value) {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : NaN;
  }
  return NaN;
}
