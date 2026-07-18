/**
 * Validate optional `cid` / `manifestCid` on VOLUMES-style records (D-14).
 * Room messages may carry cids/manifests only — never raw bytes (invariant i).
 */

import { assertSsbBlobCid, isSsbBlobCid } from './cid.mjs';
import { validateOutboundManifest } from './manifest.mjs';

const FORBIDDEN_BYTE_KEYS = Object.freeze([
  'bytes',
  'blob',
  'payload',
  'data',
  'buffer',
  'contentBytes'
]);

/**
 * @param {unknown} record — manifest, room message body, or volumes annotation
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateVolumesCidFields(record) {
  if (!record || typeof record !== 'object') {
    return { ok: false, error: 'record missing or not an object' };
  }
  const r = /** @type {Record<string, unknown>} */ (record);

  for (const key of FORBIDDEN_BYTE_KEYS) {
    if (r[key] != null) {
      return {
        ok: false,
        error: `room/volumes record must not carry bytes field "${key}" (invariant i)`
      };
    }
  }

  if (r.cid != null) {
    const gate = assertSsbBlobCid(r.cid);
    if (!gate.ok) return gate;
  }

  if (r.manifestCid != null) {
    const gate = assertSsbBlobCid(r.manifestCid);
    if (!gate.ok) return { ok: false, error: `manifestCid: ${gate.error}` };
  }

  if (Array.isArray(r.chunks)) {
    return validateOutboundManifest(r);
  }

  if (r.cid == null && r.manifestCid == null) {
    // Optional fields absent — valid for manifests that only use relative paths.
    return { ok: true };
  }

  return { ok: true };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function hasValidVolumesCid(value) {
  if (!value || typeof value !== 'object') return false;
  const r = /** @type {Record<string, unknown>} */ (value);
  return isSsbBlobCid(r.cid) || isSsbBlobCid(r.manifestCid);
}
