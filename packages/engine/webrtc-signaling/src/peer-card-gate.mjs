/**
 * Torno peer-card del carril WebRTC (WP-U93 / D-20 · Z_SDK #4).
 * Exige card con forma, frescura y rol antes de offer/answer/ICE.
 * Extensión SSB: `ssbId` en handshake + verificación de `seatSignature`.
 *
 * Solo importa `@zeus/protocol` (browser-safe) + `@zeus/protocol/peer-card-seat`
 * (Node) para verify — usable desde subpath sin arrastrar `@zeus/rooms`.
 */

import {
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  isSsbId
} from '@zeus/protocol';
import { verifyTravelingPeerCard } from '@zeus/protocol/peer-card-seat';

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
 * (y rol concreto si se pide). Si hay `seatSignature`, verifica firma.
 * Con `requireSsbId` / `requireSeatSignature` endurece el torno federado.
 *
 * @param {unknown} card
 * @param {{
 *   role?: string,
 *   now?: number,
 *   requireSsbId?: boolean,
 *   requireSeatSignature?: boolean,
 *   expectedSsbId?: string
 * }} [opts]
 * @returns {{ ok: true, role: string, ssbId?: string } | { ok: false, error: string }}
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

  const ssbId = card.ssbId;
  if (opts.requireSsbId || ssbId != null) {
    if (!isSsbId(ssbId)) {
      return { ok: false, error: 'peer-card ssbId missing or malformed' };
    }
  }
  if (opts.expectedSsbId != null) {
    if (!isSsbId(opts.expectedSsbId)) {
      return { ok: false, error: 'expectedSsbId malformed' };
    }
    if (ssbId !== opts.expectedSsbId) {
      return { ok: false, error: 'peer-card ssbId does not match handshake' };
    }
  }

  const hasSeat = typeof card.seatSignature === 'string' && card.seatSignature.length > 0;
  if (opts.requireSeatSignature || hasSeat) {
    if (!hasSeat) {
      return { ok: false, error: 'peer-card seat signature missing' };
    }
    const seat = verifyTravelingPeerCard(card);
    if (!seat.ok) {
      return { ok: false, error: `peer-card seat signature rejected: ${seat.error}` };
    }
  }

  /** @type {{ ok: true, role: string, ssbId?: string }} */
  const ok = { ok: true, role: granted };
  if (isSsbId(ssbId)) ok.ssbId = ssbId;
  return ok;
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

/**
 * Extrae `ssbId` del handshake (top-level, data, o card).
 * @param {object} [messageOrPayload]
 * @returns {string|null}
 */
export function ssbIdFromMessage(messageOrPayload) {
  if (!messageOrPayload || typeof messageOrPayload !== 'object') return null;
  if (isSsbId(messageOrPayload.ssbId)) return messageOrPayload.ssbId;
  const data = messageOrPayload.data;
  if (data && typeof data === 'object' && isSsbId(data.ssbId)) return data.ssbId;
  const card = peerCardFromMessage(messageOrPayload);
  if (card && typeof card === 'object' && isSsbId(card.ssbId)) return card.ssbId;
  return null;
}
