/**
 * Content-address helpers for WP-U100 spike (D-21 fila 2 / D-14).
 * Hash = cid (sha256 hex). Chunking mirrors Oasis contract (>50 MB blob
 * limit → chunk-as-blob); encryption stays in the pub sidecar — not here.
 */

import { createHash } from 'node:crypto';

/** Oasis `ssb-blobs` soft max per blob (bytes). Chunks stay under this. */
export const SSB_BLOB_SOFT_MAX_BYTES = 50 * 1024 * 1024;

/** Oasis chunk size cited in A-11 / D-21 (bytes). */
export const OASIS_CHUNK_BYTES = 5 * 1024 * 1024;

/**
 * @param {Uint8Array | Buffer | string} data
 * @returns {string} sha256 hex — the `cid` VOLUMES manifests already tolerate
 */
export function cidOf(data) {
  const buf =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Split payload into fixed-size chunks (last may be shorter).
 * @param {Uint8Array | Buffer} data
 * @param {number} [chunkBytes=OASIS_CHUNK_BYTES]
 * @returns {Buffer[]}
 */
export function chunkBytes(data, chunkBytes = OASIS_CHUNK_BYTES) {
  if (!Number.isInteger(chunkBytes) || chunkBytes < 1) {
    throw new TypeError('chunkBytes: chunkBytes must be a positive integer');
  }
  const buf = Buffer.from(data);
  if (buf.length === 0) return [Buffer.alloc(0)];
  const out = [];
  for (let i = 0; i < buf.length; i += chunkBytes) {
    out.push(buf.subarray(i, i + chunkBytes));
  }
  return out;
}

/**
 * Build a content-addressed manifest for a payload (pointer + chunk cids).
 * @param {Uint8Array | Buffer | string} data
 * @param {{ chunkBytes?: number }} [opts]
 */
export function buildBlobManifest(data, opts = {}) {
  const chunkSize = opts.chunkBytes ?? OASIS_CHUNK_BYTES;
  const buf =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const pieces = chunkBytes(buf, chunkSize);
  const chunks = pieces.map((piece, index) => ({
    index,
    size: piece.length,
    cid: cidOf(piece)
  }));
  if (chunks.some((c) => c.size > SSB_BLOB_SOFT_MAX_BYTES)) {
    throw new Error('chunk exceeds ssb-blobs soft max — raise chunking');
  }
  return {
    algorithm: 'sha256',
    size: buf.length,
    cid: cidOf(buf),
    chunkBytes: chunkSize,
    chunks
  };
}
