/**
 * Firma / verificación de la tarjeta viajera (asiento SSB).
 * Node-only (`node:crypto` ed25519) — no importar desde navegador.
 *
 * Usa los hooks canónicos de `peer-card.mjs` (`travelingPeerCardBytes`,
 * `isSsbId`, `ssbIdFromPublicKeyBytes`, …).
 *
 * Z_SDK #4 · WP-E02 — distinto de la firma del conector v0 (D-40).
 */

import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify
} from 'node:crypto';
import {
  attachTravelingSeat,
  isSsbId,
  isPeerCardShaped,
  publicKeyBytesFromSsbId,
  ssbIdFromPublicKeyBytes,
  travelingPeerCardBytes
} from './peer-card.mjs';

/** SPKI prefix for a raw 32-byte ed25519 public key (RFC 8410). */
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * @typedef {object} SeatKeyPair
 * @property {string} ssbId
 * @property {import('node:crypto').KeyObject} publicKey
 * @property {import('node:crypto').KeyObject} privateKey
 * @property {Buffer} publicKeyBytes
 */

/**
 * @returns {SeatKeyPair}
 */
export function generateSeatKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyBytes = publicKey.export({ type: 'spki', format: 'der' }).subarray(12);
  return {
    ssbId: ssbIdFromPublicKeyBytes(publicKeyBytes),
    publicKey,
    privateKey,
    publicKeyBytes
  };
}

/**
 * @param {Buffer|Uint8Array} publicKeyBytes
 * @returns {import('node:crypto').KeyObject}
 */
export function publicKeyFromRaw(publicKeyBytes) {
  const raw = Buffer.from(publicKeyBytes);
  if (raw.length !== 32) {
    throw new TypeError('publicKeyFromRaw: expected 32-byte ed25519 public key');
  }
  return createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
    format: 'der',
    type: 'spki'
  });
}

/**
 * Firma la tarjeta viajera y adjunta `ssbId` + `seatSignature`.
 *
 * @param {object} card — peer-card sin firma (o a re-firmar)
 * @param {import('node:crypto').KeyObject|string|Buffer} privateKey — KeyObject ed25519 o PEM/DER
 * @param {string} [ssbId] — default: derivado si se pasa SeatKeyPair vía opts; si no, card.ssbId
 * @returns {object}
 */
export function signTravelingPeerCard(card, privateKey, ssbId) {
  if (!isPeerCardShaped(card)) {
    throw new TypeError('signTravelingPeerCard: peer-card malformed');
  }
  const key =
    privateKey && typeof privateKey === 'object' && privateKey.type
      ? privateKey
      : createPrivateKey(privateKey);
  const id = ssbId ?? card.ssbId;
  if (!isSsbId(id)) {
    throw new TypeError('signTravelingPeerCard: ssbId `@….ed25519` requerido');
  }
  const unsigned = { ...card, ssbId: id };
  delete unsigned.seatSignature;
  const msg = Buffer.from(travelingPeerCardBytes(unsigned));
  const signature = sign(null, msg, key);
  return attachTravelingSeat(unsigned, {
    ssbId: id,
    seatSignature: signature.toString('base64')
  });
}

/**
 * Verifica la firma de asiento de la tarjeta viajera.
 * @param {unknown} card
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function verifyTravelingPeerCard(card) {
  if (!isPeerCardShaped(card)) {
    return { ok: false, error: 'peer-card missing or malformed' };
  }
  if (!isSsbId(card.ssbId)) {
    return { ok: false, error: 'ssbId missing or malformed' };
  }
  if (typeof card.seatSignature !== 'string' || !card.seatSignature) {
    return { ok: false, error: 'seatSignature missing' };
  }
  let sig;
  try {
    sig = Buffer.from(card.seatSignature, 'base64');
  } catch {
    return { ok: false, error: 'seatSignature malformed' };
  }
  if (sig.length !== 64) {
    return { ok: false, error: 'seatSignature malformed' };
  }
  let pub;
  try {
    pub = publicKeyFromRaw(publicKeyBytesFromSsbId(card.ssbId));
  } catch {
    return { ok: false, error: 'ssbId public key invalid' };
  }
  const msg = Buffer.from(travelingPeerCardBytes(card));
  const ok = verify(null, msg, pub, sig);
  return ok ? { ok: true } : { ok: false, error: 'seatSignature mismatch' };
}
