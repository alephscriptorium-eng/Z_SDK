/**
 * Emitir credencial de peer (peercard + startpack default).
 * Usa makePeerCard de @zeus/protocol — no reimplementa crypto ni TTL de sala.
 */

import { makePeerCard, roleScope, isRole } from '@zeus/protocol';
import {
  CREDENCIAL_VERSION,
  resolveStartpack
} from './tipos.mjs';
import { FIRMA_STUB_PENDIENTE } from './firma-stub.mjs';

/**
 * @param {object} input
 * @param {string} input.roomId
 * @param {string} input.endpoint
 * @param {string} input.token
 * @param {string} [input.role='player']
 * @param {string[]} [input.scopes]
 * @param {string|number|Date} input.expiresAt
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
  displayName,
  sessionId,
  startpack,
  signature = FIRMA_STUB_PENDIENTE
}) {
  if (!isRole(role)) {
    throw new TypeError(`emitirCredencial: rol desconocido ${role}`);
  }
  const cardScopes = scopes ?? [roleScope(role), 'presence:join', 'webrtc:signal'];
  const peerCard = makePeerCard({
    roomId,
    endpoint,
    token,
    scopes: cardScopes,
    expiresAt,
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
