/**
 * SSB blob refs as VOLUMES `cid` (D-14 / D-21 cara ciega).
 * Format: `&<base64>.sha256` — never reimplements ssb-blobs gossip.
 */

import { createHash } from 'node:crypto';

/** @see Oasis / ssb-blobs soft max — invariant (ii) */
export const SSB_BLOB_SOFT_MAX_BYTES = 50 * 1024 * 1024;

/** Canonical chunk size for objects > soft max (cara ciega / D-21). */
export const OASIS_CHUNK_BYTES = 5 * 1024 * 1024;

const CID_RE = /^&([A-Za-z0-9+/]+=*)\.sha256$/;

/**
 * @param {Uint8Array | Buffer | string} data
 * @returns {string} `&<base64>.sha256`
 */
export function cidOf(data) {
  const buf =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const digest = createHash('sha256').update(buf).digest();
  return `&${digest.toString('base64')}.sha256`;
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isSsbBlobCid(value) {
  return typeof value === 'string' && CID_RE.test(value);
}

/**
 * @param {unknown} value
 * @returns {{ ok: true, cid: string } | { ok: false, error: string }}
 */
export function assertSsbBlobCid(value) {
  if (!isSsbBlobCid(value)) {
    return {
      ok: false,
      error:
        'cid must be SSB blob ref `&<base64>.sha256` (D-14 / blobstore v0)'
    };
  }
  return { ok: true, cid: value };
}

/**
 * Encode a cid for use in an HTTP path segment (`&` → %26, …).
 * @param {string} cid
 */
export function encodeCidPath(cid) {
  const gate = assertSsbBlobCid(cid);
  if (!gate.ok) throw new TypeError(gate.error);
  return encodeURIComponent(cid);
}
