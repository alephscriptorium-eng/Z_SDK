/**
 * Peer Card — credencial revocable de rol (patrón transmedia-system).
 *
 * Forma mínima:
 *   { roomId, endpoint, token, scopes, expiresAt, displayName?, sessionId?,
 *     issuedAt? }
 *
 * Ciclo de vida (no-crypto): issuedAt → active mientras expiresAt > now →
 * expired. Fases vía `peerCardPhase` / `peerCardRemainingMs`.
 * Niveles / escalado automático de poder = fuera de este módulo (fase
 * posterior; la emisión nunca muta scopes hacia más poder por su cuenta).
 *
 * Extensión SSB / federación (Z_SDK #4):
 *   { ssbId?, seatSignature? }
 *   - `ssbId` = feed id `@….ed25519` (clave pública en el saludo)
 *   - `seatSignature` = firma ed25519 (base64) del asiento / tarjeta viajera
 *     sobre el payload canónico (`travelingPeerCardPayload`)
 *
 * La firma del conector v0 (D-40: «visor pide card») sigue siendo emisión
 * de autoridad + torno de forma/frescura/rol. La firma de asiento es el
 * hook D-20 paso 3 — verificar con `peer-card-seat` (Node) / torno signaling.
 *
 * scopes tipicos: `role:player` | `role:dj` | `role:operator` más
 * permisos de transporte (`presence:join`, `events:publish`, …).
 */

import { ROLES, isRole } from './roles.mjs';

const ROLE_SCOPE_PREFIX = 'role:';

/** Fases del ciclo de vida de la tarjeta (TTL / caducidad). */
export const PEER_CARD_PHASE = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  NOT_YET_VALID: 'not_yet_valid',
  MALFORMED: 'malformed'
});

/** Feed id SSB: `@` + base64(32-byte pubkey) + `.ed25519`. */
export const SSB_ID_RE = /^@[A-Za-z0-9+/]+={0,2}\.ed25519$/;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isSsbId(value) {
  return typeof value === 'string' && SSB_ID_RE.test(value);
}

/**
 * @param {Uint8Array|Buffer} publicKeyBytes — 32 raw ed25519 pubkey bytes
 * @returns {string}
 */
export function ssbIdFromPublicKeyBytes(publicKeyBytes) {
  if (!publicKeyBytes || publicKeyBytes.length !== 32) {
    throw new TypeError('ssbIdFromPublicKeyBytes: expected 32-byte public key');
  }
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(publicKeyBytes).toString('base64')
      : uint8ToBase64(publicKeyBytes);
  return `@${b64}.ed25519`;
}

/**
 * @param {string} ssbId
 * @returns {Uint8Array}
 */
export function publicKeyBytesFromSsbId(ssbId) {
  if (!isSsbId(ssbId)) {
    throw new TypeError(`publicKeyBytesFromSsbId: invalid ssbId ${ssbId}`);
  }
  const b64 = ssbId.slice(1, -'.ed25519'.length);
  const bytes =
    typeof Buffer !== 'undefined'
      ? new Uint8Array(Buffer.from(b64, 'base64'))
      : base64ToUint8(b64);
  if (bytes.length !== 32) {
    throw new TypeError('publicKeyBytesFromSsbId: decoded key must be 32 bytes');
  }
  return bytes;
}

/**
 * Payload canónico de la tarjeta viajera (sin `seatSignature`).
 * Claves ordenadas — base estable para firmar/verificar.
 * @param {object} card
 * @returns {Record<string, unknown>}
 */
export function travelingPeerCardPayload(card) {
  if (!card || typeof card !== 'object') {
    throw new TypeError('travelingPeerCardPayload: card object required');
  }
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of Object.keys(card).sort()) {
    if (key === 'seatSignature') continue;
    out[key] = card[key];
  }
  return out;
}

/**
 * Bytes UTF-8 del JSON canónico (hook de firma).
 * @param {object} card
 * @returns {Uint8Array}
 */
export function travelingPeerCardBytes(card) {
  return new TextEncoder().encode(JSON.stringify(travelingPeerCardPayload(card)));
}

/**
 * Adjunta identidad SSB + firma de asiento (no verifica).
 * @param {object} card
 * @param {{ ssbId: string, seatSignature: string }} seat
 */
export function attachTravelingSeat(card, { ssbId, seatSignature }) {
  if (!isPeerCardShaped(card)) {
    throw new TypeError('attachTravelingSeat: peer-card malformed');
  }
  if (!isSsbId(ssbId)) {
    throw new TypeError('attachTravelingSeat: ssbId inválido');
  }
  if (typeof seatSignature !== 'string' || !seatSignature) {
    throw new TypeError('attachTravelingSeat: seatSignature requerida');
  }
  return { ...card, ssbId, seatSignature };
}

/**
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint
 * @param {string} input.token
 * @param {string[]} input.scopes
 * @param {string|number|Date} input.expiresAt — ISO string o epoch ms
 * @param {string|number|Date} [input.issuedAt] — inicio de validez (ISO / epoch)
 * @param {string} [input.displayName]
 * @param {string} [input.sessionId]
 * @param {string} [input.ssbId] — feed id `@….ed25519`
 * @param {string} [input.seatSignature] — firma ed25519 base64 del asiento
 */
export function makePeerCard({
  roomId,
  endpoint,
  token,
  scopes,
  expiresAt,
  issuedAt,
  displayName,
  sessionId,
  ssbId,
  seatSignature
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
  let issuedMs;
  if (issuedAt != null) {
    issuedMs = toEpochMs(issuedAt);
    if (!Number.isFinite(issuedMs)) {
      throw new TypeError('makePeerCard: issuedAt inválido');
    }
  }
  if (ssbId != null && !isSsbId(ssbId)) {
    throw new TypeError('makePeerCard: ssbId inválido');
  }
  if (seatSignature != null && (typeof seatSignature !== 'string' || !seatSignature)) {
    throw new TypeError('makePeerCard: seatSignature inválida');
  }
  const card = {
    roomId,
    endpoint,
    token,
    scopes: [...scopes],
    expiresAt: new Date(expiresMs).toISOString()
  };
  if (issuedMs != null) card.issuedAt = new Date(issuedMs).toISOString();
  if (displayName != null) card.displayName = displayName;
  if (sessionId != null) card.sessionId = sessionId;
  if (ssbId != null) card.ssbId = ssbId;
  if (seatSignature != null) card.seatSignature = seatSignature;
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
 * Fase del ciclo TTL: active | expired | not_yet_valid | malformed.
 * @param {object} card
 * @param {number} [now=Date.now()]
 * @returns {typeof PEER_CARD_PHASE[keyof typeof PEER_CARD_PHASE]}
 */
export function peerCardPhase(card, now = Date.now()) {
  if (!isPeerCardShaped(card)) return PEER_CARD_PHASE.MALFORMED;
  const expiresMs = toEpochMs(card.expiresAt);
  if (!Number.isFinite(expiresMs)) return PEER_CARD_PHASE.MALFORMED;
  if (card.issuedAt != null) {
    const issuedMs = toEpochMs(card.issuedAt);
    if (Number.isFinite(issuedMs) && now < issuedMs) {
      return PEER_CARD_PHASE.NOT_YET_VALID;
    }
  }
  if (expiresMs <= now) return PEER_CARD_PHASE.EXPIRED;
  return PEER_CARD_PHASE.ACTIVE;
}

/**
 * Ms restantes hasta caducar (≥0). `null` si shape/expiresAt inválidos.
 * @param {object} card
 * @param {number} [now=Date.now()]
 * @returns {number|null}
 */
export function peerCardRemainingMs(card, now = Date.now()) {
  if (!isPeerCardShaped(card)) return null;
  const expiresMs = toEpochMs(card.expiresAt);
  if (!Number.isFinite(expiresMs)) return null;
  return Math.max(0, expiresMs - now);
}

/**
 * ¿La card está en fase active (TTL vigente y ya emitida)?
 * @param {object} card
 * @param {number} [now=Date.now()]
 */
export function isPeerCardFresh(card, now = Date.now()) {
  return peerCardPhase(card, now) === PEER_CARD_PHASE.ACTIVE;
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

function uint8ToBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToUint8(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
