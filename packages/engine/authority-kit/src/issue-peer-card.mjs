/**
 * Emisión de Peer Card por la autoridad de sala (WP-U93 / D-20).
 * Envuelve `makePeerCard` de `@zeus/protocol` con defaults de join + TTL.
 *
 * Guardarraíl de diseño: la emisión **nunca** escala scopes/rol hacia más
 * poder por su cuenta (niveles de federación = fase posterior). El caller
 * elige `role` / `scopes` explícitos.
 */

import { randomBytes } from 'node:crypto';
import {
  makePeerCard,
  roleScope,
  isRole,
  peerCardPhase,
  peerCardRemainingMs,
  PEER_CARD_PHASE
} from '@zeus/protocol';

/** TTL por defecto: 1 h. */
export const DEFAULT_PEER_CARD_TTL_MS = 60 * 60 * 1000;

/** Intents que disparan emisión automática al aceptar. */
export const DEFAULT_JOIN_INTENTS = Object.freeze(['join']);

/**
 * Resuelve `expiresAt` a partir de absoluto o TTL relativo.
 * @param {object} input
 * @param {string|number|Date} [input.expiresAt]
 * @param {number} [input.ttlMs]
 * @param {number} [input.now]
 * @returns {number} epoch ms
 */
export function resolvePeerCardExpiresAt({
  expiresAt,
  ttlMs = DEFAULT_PEER_CARD_TTL_MS,
  now = Date.now()
} = {}) {
  if (expiresAt != null) {
    const ms =
      typeof expiresAt === 'number'
        ? expiresAt
        : expiresAt instanceof Date
          ? expiresAt.getTime()
          : Date.parse(String(expiresAt));
    if (!Number.isFinite(ms)) {
      throw new TypeError('resolvePeerCardExpiresAt: expiresAt inválido');
    }
    return ms;
  }
  if (typeof ttlMs !== 'number' || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new TypeError('resolvePeerCardExpiresAt: ttlMs positivo requerido');
  }
  return now + ttlMs;
}

/**
 * Emite (construye) un peer-card de sala con rol, `issuedAt` y caducidad.
 *
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint — URL del transport de room (p. ej. scriptorium)
 * @param {string} [input.role='player']
 * @param {string} [input.displayName]
 * @param {string} [input.sessionId]
 * @param {string} [input.token]
 * @param {string[]} [input.scopes] — si se pasa, se usa tal cual (sin upgrade)
 * @param {string|number|Date} [input.expiresAt]
 * @param {string|number|Date} [input.issuedAt] — default = `now`
 * @param {number} [input.ttlMs]
 * @param {number} [input.now]
 */
export function issuePeerCard({
  roomId,
  endpoint,
  role = 'player',
  displayName,
  sessionId,
  token,
  scopes,
  expiresAt,
  issuedAt,
  ttlMs = DEFAULT_PEER_CARD_TTL_MS,
  now = Date.now()
}) {
  if (!isRole(role)) {
    throw new TypeError(`issuePeerCard: rol desconocido ${role}`);
  }
  if (typeof endpoint !== 'string' || !endpoint) {
    throw new TypeError('issuePeerCard: endpoint requerido');
  }
  // Caller-chosen scopes only — never auto-escalate toward more power.
  const cardScopes = scopes ?? [roleScope(role), 'presence:join', 'webrtc:signal'];
  const cardToken =
    token ??
    `pc-${sessionId || 'peer'}-${now}-${randomBytes(4).toString('hex')}`;
  const expiresMs = resolvePeerCardExpiresAt({ expiresAt, ttlMs, now });
  let issuedMs = now;
  if (issuedAt != null) {
    issuedMs =
      typeof issuedAt === 'number'
        ? issuedAt
        : issuedAt instanceof Date
          ? issuedAt.getTime()
          : Date.parse(String(issuedAt));
    if (!Number.isFinite(issuedMs)) {
      throw new TypeError('issuePeerCard: issuedAt inválido');
    }
  }
  return makePeerCard({
    roomId,
    endpoint,
    token: cardToken,
    scopes: cardScopes,
    expiresAt: expiresMs,
    issuedAt: issuedMs,
    displayName,
    sessionId
  });
}

export { peerCardPhase, peerCardRemainingMs, PEER_CARD_PHASE };
