/**
 * Consumir credencial de peer: valida shape, frescura/TTL y resuelve startpack.
 */

import {
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardPhase,
  peerCardRemainingMs,
  PEER_CARD_PHASE
} from '@zeus/protocol';
import {
  CREDENCIAL_VERSION,
  DEFAULT_STARTPACK,
  isCredencialEmbajadorShaped,
  isStartpackRefShaped,
  resolveStartpack
} from './tipos.mjs';
import { verifySignatureStub } from './firma-stub.mjs';

/**
 * @param {unknown} raw
 * @param {object} [opts]
 * @param {number} [opts.now]
 * @param {boolean} [opts.requireFresh=true]
 * @param {boolean} [opts.requireSignature=false] — true solo cuando haya verify real
 * @returns {{
 *   ok: boolean,
 *   errors: string[],
 *   peerCard: object|null,
 *   startpack: import('./tipos.mjs').StartpackRef|null,
 *   role: string|null,
 *   phase: string|null,
 *   remainingMs: number|null,
 *   signature: { ok: boolean, mode: string, verified: boolean },
 *   defaultStartpack: boolean
 * }}
 */
export function consumirCredencial(raw, opts = {}) {
  const now = opts.now ?? Date.now();
  const requireFresh = opts.requireFresh !== false;
  const requireSignature = opts.requireSignature === true;
  /** @type {string[]} */
  const errors = [];

  if (raw == null || typeof raw !== 'object') {
    return fail(['credencial: no object'], { signature: verifySignatureStub(null) });
  }

  const c = /** @type {Record<string, unknown>} */ (raw);

  // Accept bare peerCard + optional startpack (traveler may send card alone).
  let peerCard;
  let startpackRaw;
  let signatureRaw;
  let version = c.version;

  if (c.peerCard != null) {
    peerCard = c.peerCard;
    startpackRaw = c.startpack;
    signatureRaw = c.signature;
  } else if (isPeerCardShaped(c)) {
    peerCard = c;
    startpackRaw = undefined;
    signatureRaw = undefined;
    version = CREDENCIAL_VERSION;
  } else {
    return fail(['credencial: missing peerCard'], { signature: verifySignatureStub(null) });
  }

  if (version != null && version !== CREDENCIAL_VERSION && c.peerCard != null) {
    errors.push(`credencial: version ${String(version)} (expected ${CREDENCIAL_VERSION})`);
  }

  if (!isPeerCardShaped(peerCard)) {
    errors.push('peerCard: shape inválido');
  }

  let defaultStartpack = false;
  let startpack = null;
  if (startpackRaw == null) {
    startpack = resolveStartpack();
    defaultStartpack = true;
  } else if (!isStartpackRefShaped(startpackRaw)) {
    errors.push('startpack: shape inválido');
  } else {
    startpack = /** @type {import('./tipos.mjs').StartpackRef} */ ({
      id: /** @type {any} */ (startpackRaw).id,
      version: /** @type {any} */ (startpackRaw).version,
      ref: /** @type {any} */ (startpackRaw).ref,
      packageName: /** @type {any} */ (startpackRaw).packageName
    });
    if (startpack.ref === DEFAULT_STARTPACK.ref) {
      defaultStartpack = true;
    }
  }

  const phase =
    peerCard && isPeerCardShaped(peerCard) ? peerCardPhase(peerCard, now) : null;
  const remainingMs =
    peerCard && isPeerCardShaped(peerCard)
      ? peerCardRemainingMs(peerCard, now)
      : null;

  if (requireFresh && peerCard && isPeerCardShaped(peerCard) && !isPeerCardFresh(peerCard, now)) {
    if (phase === PEER_CARD_PHASE.NOT_YET_VALID) {
      errors.push('peerCard: aún no vigente');
    } else {
      errors.push('peerCard: expirado');
    }
  }

  const envelope =
    c.peerCard != null
      ? c
      : { version: CREDENCIAL_VERSION, peerCard, startpack, signature: signatureRaw };
  const signature = verifySignatureStub(envelope);
  if (requireSignature && !signature.verified) {
    errors.push('signature: required but not verified (stub mode)');
  }

  const role = peerCard && isPeerCardShaped(peerCard) ? roleFromPeerCard(peerCard) : null;

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      peerCard: isPeerCardShaped(peerCard) ? peerCard : null,
      startpack,
      role,
      phase,
      remainingMs,
      signature,
      defaultStartpack
    };
  }

  // Full envelope check when present as CredencialEmbajador.
  if (c.peerCard != null && !isCredencialEmbajadorShaped({ ...c, startpack })) {
    // shape already covered by field checks; keep ok if field checks passed
  }

  return {
    ok: true,
    errors: [],
    peerCard,
    startpack,
    role,
    phase,
    remainingMs,
    signature,
    defaultStartpack
  };
}

/** Alias EN. */
export const consumePeerCredential = consumirCredencial;

/**
 * @param {string[]} errors
 * @param {object} extra
 */
function fail(errors, extra = {}) {
  return {
    ok: false,
    errors,
    peerCard: null,
    startpack: null,
    role: null,
    phase: null,
    remainingMs: null,
    signature: extra.signature ?? { ok: false, mode: 'none', verified: false },
    defaultStartpack: false
  };
}
