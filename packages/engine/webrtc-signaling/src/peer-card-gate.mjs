/**
 * Torno peer-card del carril WebRTC (WP-U93 / D-20 · Z_SDK #4).
 * Exige card con forma, frescura y rol antes de offer/answer/ICE.
 * Extensión SSB: `ssbId` en handshake + verificación de `seatSignature`.
 *
 * WP-U197: el torno NO se retira ni se ablanda — `assertSignalingPeerCard`
 * conserva su semántica exacta (card ausente = denegada) porque terceros
 * lo consumen como portero de cosas protegidas. La antesala anónima se
 * pide EXPLÍCITAMENTE con `assertSignalingAdmission(card, { admission:
 * 'anonymous' })`, que admite sin card y devuelve `role: null`.
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

/**
 * Tipos abstractos que el torno bloquea sin card válida.
 *
 * Frontera confirmada (WP-U186 · paso 0, D-O11 — ver
 * plan/REPORTES/U186-paso0-frontera-room-join.md): los 4 tipos son
 * acciones de la capacidad OPT-IN WebRTC (antesala). `room-join` es el
 * anuncio wire `join-room` (ROOM_MESSAGE dentro de la sala de
 * señalización) que dispara ofertas entre pares — NO la membresía
 * genérica del runtime. El transporte base (CLIENT_REGISTER /
 * CLIENT_SUSCRIBE en socket-core/rooms) no pasa por este torno y admite
 * sesión anónima `role:null`; el rol se consulta EN LA ACCIÓN.
 */
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
 * Modos de **admisión** a la antesala WebRTC (WP-U197).
 *
 * `admisión ≠ permiso`. La admisión decide quién puede intercambiar
 * SDP/ICE en la antesala; NO concede rol ninguno. Corolario de U186
 * (transporte ≠ permiso): el rol se consulta EN LA ACCIÓN
 * (`getSessionRole()`), jamás se deriva de haber completado un
 * handshake.
 *
 * - `peer-card` (**por defecto**, statu quo U186): la antesala es una
 *   capacidad opt-in; sin card no hay offer/answer/ICE.
 * - `anonymous` (WP-U197): la antesala admite pares sin card. Elegirlo
 *   es decisión LOCAL de despliegue (dueño: O, contrato D-O11/O13 de
 *   `plan/REPORTES/U186-paso0-frontera-room-join.md`), nunca algo que
 *   un par remoto pueda presentar ni negociar por el cable.
 */
export const SIGNALING_ADMISSION = Object.freeze({
  peerCard: 'peer-card',
  anonymous: 'anonymous'
});

/**
 * ¿Hay card **presentada**? Regla de presencia idéntica a U186
 * (`socket-room-signaling.mjs:79` — `opts.peerCard != null`):
 * `null`/`undefined` = AUSENTE; cualquier otro valor (incluidos `false`,
 * `0`, `''`, `{}`) = PRESENTADO ⇒ se valida y, si no acredita, RECHAZA.
 * «Presentada y falsa» nunca degrada a «ausente».
 *
 * @param {unknown} card
 * @returns {boolean}
 */
export function isPeerCardPresented(card) {
  return card !== null && card !== undefined;
}

/**
 * Admisión a la antesala WebRTC (WP-U197) — envoltura EXPLÍCITA sobre el
 * torno de U186. `assertSignalingPeerCard` no cambia de semántica: quien
 * lo llama directo (p. ej. el carril LAN de blobs,
 * `packages/mesh/blob-sync-harness/src/lan-gate.mjs:23`) sigue exigiendo
 * card. Sólo se es anónimo si se pide `admission: 'anonymous'` aquí.
 *
 * Reglas (fail-closed en el medio):
 * - **sin claim y sin card** → anónimo admitido, `role: null`.
 * - **card presentada** → se valida con el torno U186; inválida = RECHAZA
 *   (jamás «degrada» a anónimo, aunque el modo sea anónimo).
 * - **claim de identidad sin card** (`ssbId` en el handshake, o `from`
 *   con forma de feed SSB) → DENIEGA: anónimo es anónimo, no un
 *   pasaporte sin sello.
 * - cualquier exigencia configurada (`role`, `requireSsbId`,
 *   `requireSeatSignature`) vuelve a exigir card aunque el modo sea
 *   anónimo: la ausencia deniega.
 *
 * @param {unknown} card
 * @param {{
 *   admission?: string,
 *   role?: string,
 *   now?: number,
 *   requireSsbId?: boolean,
 *   requireSeatSignature?: boolean,
 *   expectedSsbId?: string,
 *   claimedSsbId?: unknown,
 *   claimedFrom?: unknown
 * }} [opts]
 * @returns {{ ok: true, anonymous: true, role: null }
 *   | { ok: true, anonymous: false, role: string, ssbId?: string }
 *   | { ok: false, anonymous: false, error: string }}
 */
export function assertSignalingAdmission(card, opts = {}) {
  if (isPeerCardPresented(card)) {
    const check = assertSignalingPeerCard(card, opts);
    if (!check.ok) return { ok: false, anonymous: false, error: check.error };
    return { ...check, anonymous: false };
  }

  const anonymousMode = opts.admission === SIGNALING_ADMISSION.anonymous;
  const demandsCard =
    !anonymousMode ||
    Boolean(opts.role) ||
    opts.requireSsbId === true ||
    opts.requireSeatSignature === true;

  if (demandsCard) {
    // Mismo veredicto y mismo texto que el torno U186 ante card ausente:
    // una sola fuente de la denegación, sin ruta paralela.
    const denied = assertSignalingPeerCard(card, opts);
    return {
      ok: false,
      anonymous: false,
      error: denied.ok ? 'peer-card required' : denied.error
    };
  }

  if (opts.claimedSsbId != null || isSsbId(opts.claimedFrom)) {
    return {
      ok: false,
      anonymous: false,
      error: 'anonymous signaling carries an unproven identity claim (ssbId)'
    };
  }

  return { ok: true, anonymous: true, role: null };
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
