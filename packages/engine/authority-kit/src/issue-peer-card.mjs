/**
 * Emisión de Peer Card por la autoridad de sala (WP-U93 / D-20).
 * Envuelve `makePeerCard` de `@zeus/protocol` con defaults de join.
 */

import { randomBytes } from 'node:crypto';
import { makePeerCard, roleScope, isRole } from '@zeus/protocol';

/** TTL por defecto: 1 h. */
export const DEFAULT_PEER_CARD_TTL_MS = 60 * 60 * 1000;

/** Intents que disparan emisión automática al aceptar. */
export const DEFAULT_JOIN_INTENTS = Object.freeze(['join']);

/**
 * Emite (construye) un peer-card de sala con rol y frescura.
 *
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint — URL del transport de room (p. ej. scriptorium)
 * @param {string} [input.role='player']
 * @param {string} [input.displayName]
 * @param {string} [input.sessionId]
 * @param {string} [input.token]
 * @param {string[]} [input.scopes]
 * @param {string|number|Date} [input.expiresAt]
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
  ttlMs = DEFAULT_PEER_CARD_TTL_MS,
  now = Date.now()
}) {
  if (!isRole(role)) {
    throw new TypeError(`issuePeerCard: rol desconocido ${role}`);
  }
  if (typeof endpoint !== 'string' || !endpoint) {
    throw new TypeError('issuePeerCard: endpoint requerido');
  }
  const cardScopes = scopes ?? [roleScope(role), 'presence:join', 'webrtc:signal'];
  const cardToken =
    token ??
    `pc-${sessionId || 'peer'}-${now}-${randomBytes(4).toString('hex')}`;
  return makePeerCard({
    roomId,
    endpoint,
    token: cardToken,
    scopes: cardScopes,
    expiresAt: expiresAt ?? now + ttlMs,
    displayName,
    sessionId
  });
}
