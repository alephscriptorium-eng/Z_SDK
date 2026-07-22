/**
 * Puerta de externos — cableado Node de peercard firmada (E02) +
 * @zeus/embajador-kit (f1) → startpack-ciudad-v0.1.0 como base default.
 *
 * No stubs: firma = signTravelingPeerCard / verifyTravelingPeerCard
 * (@zeus/protocol/peer-card-seat). Kit = emitirCredencial / consumirCredencial.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const operatorUiRoot = path.resolve(__dirname, '..');
const zeusRoot = path.resolve(operatorUiRoot, '../../..');

const embajadorUrl = pathToFileURL(
  path.join(zeusRoot, 'packages/engine/embajador-kit/src/index.mjs'),
).href;
const seatUrl = pathToFileURL(
  path.join(zeusRoot, 'packages/engine/protocol/src/peer-card-seat.mjs'),
).href;

const {
  emitirCredencial,
  consumirCredencial,
  DEFAULT_STARTPACK,
} = await import(embajadorUrl);
const {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard,
} = await import(seatUrl);

export { DEFAULT_STARTPACK, emitirCredencial, consumirCredencial };

/**
 * Emite credencial con peercard firmada (asiento E02) y startpack default.
 *
 * @param {object} [input]
 * @param {string} [input.roomId='CIUDAD_DEMO']
 * @param {string} [input.endpoint]
 * @param {string} [input.token='puerta-dev']
 * @param {string} [input.role='player']
 * @param {string} [input.displayName='amigo-externo']
 * @param {number|string|Date} [input.expiresAt]
 * @returns {Promise<{
 *   credencial: object,
 *   keys: { ssbId: string },
 *   startpackRef: string
 * }>}
 */
export async function emitirPuertaFirmada(input = {}) {
  const keys = generateSeatKeyPair();
  const expiresAt =
    input.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const unsigned = emitirCredencial({
    roomId: input.roomId ?? 'CIUDAD_DEMO',
    endpoint: input.endpoint ?? 'wss://rooms.example/runtime',
    token: input.token ?? 'puerta-dev',
    role: input.role ?? 'player',
    displayName: input.displayName ?? 'amigo-externo',
    expiresAt,
    signature: null,
  });
  const signedCard = signTravelingPeerCard(
    unsigned.peerCard,
    keys.privateKey,
    keys.ssbId,
  );
  const credencial = {
    ...unsigned,
    peerCard: signedCard,
    signature: {
      alg: 'ed25519-seat',
      value: signedCard.seatSignature,
      ssbId: keys.ssbId,
      pending: false,
    },
  };
  return {
    credencial,
    keys: { ssbId: keys.ssbId },
    startpackRef: credencial.startpack.ref,
  };
}

/**
 * Consume credencial por la puerta: kit (shape + startpack) + verify E02.
 *
 * @param {unknown} raw
 * @param {object} [opts]
 * @param {number} [opts.now]
 * @returns {{
 *   ok: boolean,
 *   errors: string[],
 *   startpack: object|null,
 *   defaultStartpack: boolean,
 *   role: string|null,
 *   seat: { ok: boolean, error?: string },
 *   peerCard: object|null,
 *   ssbId: string|null
 * }}
 */
export function entrarPorPuerta(raw, opts = {}) {
  const consumed = consumirCredencial(raw, {
    now: opts.now,
    requireFresh: opts.requireFresh !== false,
    requireSignature: false,
  });
  const seat = consumed.peerCard
    ? verifyTravelingPeerCard(consumed.peerCard)
    : { ok: false, error: 'peer-card missing' };

  const errors = [...consumed.errors];
  if (!seat.ok) {
    errors.push(`seat: ${seat.error ?? 'verify failed'}`);
  }

  const startpack = consumed.startpack;
  const defaultOk =
    consumed.defaultStartpack === true &&
    startpack?.ref === DEFAULT_STARTPACK.ref;

  if (consumed.ok && startpack && startpack.ref !== DEFAULT_STARTPACK.ref && opts.requireDefaultStartpack) {
    errors.push(
      `startpack: expected default ${DEFAULT_STARTPACK.ref}, got ${startpack.ref}`,
    );
  }

  return {
    ok: errors.length === 0 && consumed.ok && seat.ok,
    errors,
    startpack,
    defaultStartpack: defaultOk || startpack?.ref === DEFAULT_STARTPACK.ref,
    role: consumed.role,
    seat: seat.ok ? { ok: true } : { ok: false, error: seat.error },
    peerCard: consumed.peerCard,
    ssbId: consumed.peerCard?.ssbId ?? null,
  };
}

/** Payload inyectable en window.__ZEUS__ (sin claves privadas). */
export function puertaZeusSlice(entry) {
  return {
    enabled: true,
    startpack: entry?.startpack ?? { ...DEFAULT_STARTPACK },
    defaultStartpackRef: DEFAULT_STARTPACK.ref,
    role: entry?.role ?? null,
    ssbId: entry?.ssbId ?? null,
    seatOk: entry?.seat?.ok === true,
  };
}
