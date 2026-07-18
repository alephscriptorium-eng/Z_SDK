/**
 * Chunk-as-blob manifests for objects that exceed the ssb-blobs soft max.
 * `manifestCid` is the canonical reference when chunked (cara ciega §2).
 */

import {
  cidOf,
  assertSsbBlobCid,
  OASIS_CHUNK_BYTES,
  SSB_BLOB_SOFT_MAX_BYTES
} from './cid.mjs';

/**
 * @param {Uint8Array | Buffer} data
 * @param {number} [chunkBytes=OASIS_CHUNK_BYTES]
 * @returns {Buffer[]}
 */
export function chunkBytes(data, chunkBytes = OASIS_CHUNK_BYTES) {
  if (!Number.isInteger(chunkBytes) || chunkBytes < 1) {
    throw new TypeError('chunkBytes: chunkBytes must be a positive integer');
  }
  if (chunkBytes > SSB_BLOB_SOFT_MAX_BYTES) {
    throw new TypeError('chunkBytes exceeds ssb-blobs soft max (invariant ii)');
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
 * Build a content-addressed outbound manifest.
 * - size ≤ soft max → single blob; `cid` is canonical; no `manifestCid`.
 * - size > soft max → chunks + manifest blob; `manifestCid` is canonical.
 *
 * @param {Uint8Array | Buffer | string} data
 * @param {{ chunkBytes?: number, softMaxBytes?: number }} [opts]
 *        `softMaxBytes` defaults to Oasis 50 MiB; override only in fixtures.
 */
export function buildOutboundManifest(data, opts = {}) {
  const chunkSize = opts.chunkBytes ?? OASIS_CHUNK_BYTES;
  const softMax = opts.softMaxBytes ?? SSB_BLOB_SOFT_MAX_BYTES;
  if (!Number.isInteger(softMax) || softMax < 1) {
    throw new TypeError('softMaxBytes must be a positive integer');
  }
  const buf =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const rootCid = cidOf(buf);

  if (buf.length <= softMax) {
    return {
      algorithm: 'sha256',
      size: buf.length,
      cid: rootCid,
      chunkBytes: chunkSize,
      chunks: [{ index: 0, size: buf.length, cid: rootCid }]
    };
  }

  const pieces = chunkBytes(buf, chunkSize);
  const chunks = pieces.map((piece, index) => ({
    index,
    size: piece.length,
    cid: cidOf(piece)
  }));
  for (const c of chunks) {
    if (c.size > SSB_BLOB_SOFT_MAX_BYTES) {
      throw new Error('chunk exceeds ssb-blobs soft max — raise chunking');
    }
  }

  const manifestBody = {
    algorithm: 'sha256',
    size: buf.length,
    cid: rootCid,
    chunkBytes: chunkSize,
    chunks
  };
  const manifestCid = cidOf(Buffer.from(JSON.stringify(manifestBody), 'utf8'));
  return { ...manifestBody, manifestCid };
}

/**
 * Validate a manifest against the outbound contract (fields + invariant ii).
 * @param {unknown} manifest
 * @param {{ softMaxBytes?: number }} [opts]
 * @returns {{ ok: true, canonicalCid: string } | { ok: false, error: string }}
 */
export function validateOutboundManifest(manifest, opts = {}) {
  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, error: 'manifest missing or not an object' };
  }
  const softMax = opts.softMaxBytes ?? SSB_BLOB_SOFT_MAX_BYTES;
  const m = /** @type {Record<string, unknown>} */ (manifest);
  const root = assertSsbBlobCid(m.cid);
  if (!root.ok) return root;

  if (typeof m.size !== 'number' || !Number.isFinite(m.size) || m.size < 0) {
    return { ok: false, error: 'manifest.size must be a non-negative number' };
  }

  if (!Array.isArray(m.chunks) || m.chunks.length < 1) {
    return { ok: false, error: 'manifest.chunks must be a non-empty array' };
  }

  for (const chunk of m.chunks) {
    if (!chunk || typeof chunk !== 'object') {
      return { ok: false, error: 'manifest chunk malformed' };
    }
    const c = /** @type {Record<string, unknown>} */ (chunk);
    const cidGate = assertSsbBlobCid(c.cid);
    if (!cidGate.ok) {
      return { ok: false, error: `chunk cid: ${cidGate.error}` };
    }
    if (typeof c.size !== 'number' || c.size > SSB_BLOB_SOFT_MAX_BYTES) {
      return {
        ok: false,
        error: `chunk size violates soft max ${SSB_BLOB_SOFT_MAX_BYTES}`
      };
    }
  }

  const needsManifestCid = m.size > softMax;
  if (needsManifestCid || m.manifestCid != null) {
    const mc = assertSsbBlobCid(m.manifestCid);
    if (!mc.ok) {
      return {
        ok: false,
        error: needsManifestCid
          ? 'objects > soft max require manifestCid (chunk-as-blob)'
          : `manifestCid: ${mc.error}`
      };
    }
    return { ok: true, canonicalCid: mc.cid };
  }

  return { ok: true, canonicalCid: root.cid };
}
