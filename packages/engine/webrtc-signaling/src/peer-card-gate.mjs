/**
 * Torno peer-card del carril WebRTC (WP-U93 / D-20).
 * Exige card con forma, frescura y rol antes de offer/answer/ICE.
 *
 * Solo importa `@zeus/protocol` (browser-safe) — usable desde subpath
 * sin arrastrar `@zeus/rooms`.
 */

import {
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole
} from '@zeus/protocol';

/** Tipos abstractos que el torno bloquea sin card válida. */
export const PEER_CARD_GATED_TYPES = Object.freeze([
  'offer',
  'answer',
  'ice-candidate',
  'room-join'
]);

const GATED = new Set(PEER_CARD_GATED_TYPES);

/**
 * @param {string} abstractType
 */
export function isPeerCardGatedType(abstractType) {
  return GATED.has(abstractType);
}

/**
 * Valida peer-card para señalización: forma + fresca + con rol
 * (y rol concreto si se pide).
 *
 * @param {unknown} card
 * @param {{ role?: string, now?: number }} [opts]
 * @returns {{ ok: true, role: string } | { ok: false, error: string }}
 */
export function assertSignalingPeerCard(card, opts = {}) {
  const now = opts.now ?? Date.now();
  if (!isPeerCardShaped(card)) {
    return { ok: false, error: 'peer-card missing or malformed' };
  }
  if (!isPeerCardFresh(card, now)) {
    return { ok: false, error: 'peer-card expired' };
  }
  const granted = roleFromPeerCard(card);
  if (!granted) {
    return { ok: false, error: 'peer-card has no role' };
  }
  if (opts.role && !peerCardGrantsRole(card, opts.role, now)) {
    return { ok: false, error: `peer-card does not grant role:${opts.role}` };
  }
  return { ok: true, role: granted };
}

/**
 * Extrae peer-card de un mensaje abstracto o payload wire.
 * @param {object} [messageOrPayload]
 * @returns {unknown}
 */
export function peerCardFromMessage(messageOrPayload) {
  if (!messageOrPayload || typeof messageOrPayload !== 'object') return null;
  if (messageOrPayload.peerCard != null) return messageOrPayload.peerCard;
  const data = messageOrPayload.data;
  if (data && typeof data === 'object' && data.peerCard != null) {
    return data.peerCard;
  }
  return null;
}
