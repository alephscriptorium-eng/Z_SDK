/**
 * Emitir credencial de peer (peercard + startpack default).
 * Usa makePeerCard de @zeus/protocol — TTL/ciclo vía issuedAt + expiresAt/ttlMs.
 * No reimplementa crypto ni issuePeerCard de sala (authority-kit).
 */

import { makePeerCard, roleScope, isRole } from '@zeus/protocol';
import {
  CREDENCIAL_VERSION,
  resolveStartpack
} from './tipos.mjs';
import { FIRMA_STUB_PENDIENTE } from './firma-stub.mjs';

/** TTL default alineado a authority-kit (1 h) cuando el caller pasa ttlMs. */
export const DEFAULT_CREDENCIAL_TTL_MS = 60 * 60 * 1000;

/**
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint
 * @param {string} input.token
 * @param {string} [input.role='player']
 * @param {string[]} [input.scopes]
 * @param {string|number|Date} [input.expiresAt] — requerido si no hay ttlMs
 * @param {number} [input.ttlMs] — relativo a `now` si no hay expiresAt
 * @param {string|number|Date} [input.issuedAt]
 * @param {number} [input.now]
 * @param {string} [input.displayName]
 * @param {string} [input.sessionId]
 * @param {import('./tipos.mjs').StartpackRef|Partial<import('./tipos.mjs').StartpackRef>} [input.startpack]
 * @param {object|null} [input.signature] — omit → stub pendiente; null → sin firma
 * @returns {import('./tipos.mjs').CredencialEmbajador}
 */
export function emitirCredencial({
  roomId,
  endpoint,
  token,
  role = 'player',
  scopes,
  expiresAt,
  ttlMs,
  issuedAt,
  now = Date.now(),
  displayName,
  sessionId,
  startpack,
  signature = FIRMA_STUB_PENDIENTE
}) {
  if (!isRole(role)) {
    throw new TypeError(`emitirCredencial: rol desconocido ${role}`);
  }
  const cardScopes = scopes ?? [roleScope(role), 'presence:join', 'webrtc:signal'];
  let expiresMs = expiresAt;
  if (expiresMs == null) {
    const ttl = ttlMs ?? DEFAULT_CREDENCIAL_TTL_MS;
    if (typeof ttl !== 'number' || !Number.isFinite(ttl) || ttl <= 0) {
      throw new TypeError('emitirCredencial: ttlMs positivo o expiresAt requerido');
    }
    expiresMs = now + ttl;
  }
  const peerCard = makePeerCard({
    roomId,
    endpoint,
    token,
    scopes: cardScopes,
    expiresAt: expiresMs,
    issuedAt: issuedAt ?? now,
    displayName,
    sessionId
  });
  /** @type {import('./tipos.mjs').CredencialEmbajador} */
  const credencial = {
    version: CREDENCIAL_VERSION,
    peerCard,
    startpack: resolveStartpack(startpack)
  };
  if (signature !== undefined && signature !== null) {
    credencial.signature = signature;
  }
  return credencial;
}

/** Alias EN (contrato kit). */
export const emitPeerCredential = emitirCredencial;
