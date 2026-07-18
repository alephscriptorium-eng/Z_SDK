/**
 * Bulk cache transfer helpers (D-14 / U80).
 * DataChannel carries objects; validation uses @zeus/linea-kit/validate.
 */

import { validate } from '@zeus/linea-kit/validate';

export const BULK_CACHE_TYPE = 'bulk-cache';
export const DEFAULT_CACHE_SCHEMA = 'cache-sidecar-meta';

/**
 * @param {unknown} object
 * @param {string} [schemaId]
 * @returns {{ ok: boolean, schemaId: string, errors: object[]|null, object: unknown }}
 */
export function validateCacheObject(object, schemaId = DEFAULT_CACHE_SCHEMA) {
  const result = validate(schemaId, object);
  return {
    ok: result.ok,
    schemaId: result.schemaId,
    errors: result.errors,
    object
  };
}

/**
 * Build DataChannel envelope for a cache object.
 * @param {object} object
 * @param {string} [schemaId]
 */
export function buildBulkCacheEnvelope(object, schemaId = DEFAULT_CACHE_SCHEMA) {
  return {
    type: BULK_CACHE_TYPE,
    schemaId,
    object,
    timestamp: Date.now()
  };
}

/**
 * Parse + validate an inbound DataChannel payload.
 * @param {unknown} payload
 */
export function receiveAndValidateCache(payload) {
  const msg =
    typeof payload === 'string'
      ? (() => {
          try {
            return JSON.parse(payload);
          } catch {
            return null;
          }
        })()
      : payload;

  if (!msg || msg.type !== BULK_CACHE_TYPE) {
    return {
      ok: false,
      schemaId: null,
      errors: [{ message: 'Not a bulk-cache envelope' }],
      object: null
    };
  }

  return validateCacheObject(msg.object, msg.schemaId || DEFAULT_CACHE_SCHEMA);
}
