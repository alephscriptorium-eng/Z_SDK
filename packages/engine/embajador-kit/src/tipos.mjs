/**
 * CredencialEmbajador v1 — contrato canónico emitir/consumir peercard.
 * Destino único (eje II): no duplicar este shape fuera del kit.
 *
 * Firma criptográfica real = paquete de privacidad federada (stub tipado aquí).
 * Emisión de sala (`issuePeerCard`) = `@zeus/authority-kit`; este kit cablea
 * TTL/ciclo vía campos protocol (`issuedAt` / `expiresAt` / `ttlMs`).
 *
 * @typedef {object} StartpackRef
 * @property {string} id
 * @property {string} version
 * @property {string} ref — tag/ref canónico (p. ej. startpack-ciudad-v0.1.0)
 * @property {string} packageName
 *
 * @typedef {object} FirmaStub
 * @property {'stub'} alg
 * @property {null|string} value
 * @property {true} pending
 *
 * @typedef {object} CredencialEmbajador
 * @property {'embajador/1'} version
 * @property {object} peerCard — shape de @zeus/protocol makePeerCard
 * @property {StartpackRef} startpack — base default del entrante
 * @property {FirmaStub|object|null} [signature]
 */

export const CREDENCIAL_VERSION = 'embajador/1';

/** Base default del entrante (norte CA experiencia). */
export const DEFAULT_STARTPACK = Object.freeze({
  id: 'startpack-ciudad',
  version: '0.1.0',
  ref: 'startpack-ciudad-v0.1.0',
  packageName: '@zeus/startpack-ciudad'
});

/**
 * @param {unknown} value
 * @returns {value is StartpackRef}
 */
export function isStartpackRefShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const s = /** @type {Record<string, unknown>} */ (value);
  return (
    typeof s.id === 'string' &&
    s.id.length > 0 &&
    typeof s.version === 'string' &&
    s.version.length > 0 &&
    typeof s.ref === 'string' &&
    s.ref.length > 0 &&
    typeof s.packageName === 'string' &&
    s.packageName.length > 0
  );
}

/**
 * @param {unknown} value
 * @returns {value is CredencialEmbajador}
 */
export function isCredencialEmbajadorShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const c = /** @type {Record<string, unknown>} */ (value);
  if (c.version !== CREDENCIAL_VERSION) return false;
  if (c.peerCard == null || typeof c.peerCard !== 'object') return false;
  if (!isStartpackRefShaped(c.startpack)) return false;
  if (c.signature != null && typeof c.signature !== 'object') return false;
  return true;
}

/**
 * @param {Partial<StartpackRef>} [override]
 * @returns {StartpackRef}
 */
export function resolveStartpack(override) {
  if (override == null) {
    return { ...DEFAULT_STARTPACK };
  }
  return {
    id: typeof override.id === 'string' && override.id ? override.id : DEFAULT_STARTPACK.id,
    version:
      typeof override.version === 'string' && override.version
        ? override.version
        : DEFAULT_STARTPACK.version,
    ref: typeof override.ref === 'string' && override.ref ? override.ref : DEFAULT_STARTPACK.ref,
    packageName:
      typeof override.packageName === 'string' && override.packageName
        ? override.packageName
        : DEFAULT_STARTPACK.packageName
  };
}
