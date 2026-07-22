/**
 * Firma tipada en stub — la verificación real la aporta el WP de privacidad
 * federada (ssbId / handshake). Hasta entonces: no afirma crypto.
 */

/** @type {import('./tipos.mjs').FirmaStub} */
export const FIRMA_STUB_PENDIENTE = Object.freeze({
  alg: 'stub',
  value: null,
  pending: true
});

/**
 * Adjunta stub de firma (o un objeto de firma real cuando exista verify).
 * @param {import('./tipos.mjs').CredencialEmbajador} credencial
 * @param {object} [firma]
 * @returns {import('./tipos.mjs').CredencialEmbajador}
 */
export function attachSignatureStub(credencial, firma = FIRMA_STUB_PENDIENTE) {
  if (credencial == null || typeof credencial !== 'object') {
    throw new TypeError('attachSignatureStub: credencial requerida');
  }
  return {
    ...credencial,
    peerCard: { ...credencial.peerCard },
    startpack: { ...credencial.startpack },
    signature: { ...firma }
  };
}

/**
 * Verify stub: acepta ausencia o `alg:'stub'`; nunca marca `verified:true`.
 * Cuando exista verify real, este módulo reexportará o delegará sin cambiar
 * la firma pública de consumirCredencial.
 *
 * @param {unknown} credencialOrNull
 * @returns {{ ok: boolean, mode: 'stub'|'none'|'foreign', verified: false }}
 */
export function verifySignatureStub(credencialOrNull) {
  if (credencialOrNull == null || typeof credencialOrNull !== 'object') {
    return { ok: true, mode: 'none', verified: false };
  }
  const sig = /** @type {Record<string, unknown>} */ (credencialOrNull).signature;
  if (sig == null) {
    return { ok: true, mode: 'none', verified: false };
  }
  if (typeof sig !== 'object') {
    return { ok: false, mode: 'foreign', verified: false };
  }
  const s = /** @type {Record<string, unknown>} */ (sig);
  if (s.alg === 'stub' || s.pending === true) {
    return { ok: true, mode: 'stub', verified: false };
  }
  // Objeto de firma desconocido: tipado ok para transporte; no verificado aquí.
  return { ok: true, mode: 'foreign', verified: false };
}
