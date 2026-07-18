/**
 * In-process 2-node content-addressed sync (fixture CA for WP-U100).
 * Models want/get by cid — the contract Zeus will validate against the
 * pub sidecar later. Does not dial SSB or implement `blobs.*`.
 */

import { cidOf, buildBlobManifest, chunkBytes } from './content-address.mjs';

/**
 * @typedef {{ id: string, blobs: Map<string, Buffer>, manifests: Map<string, object> }} BlobNode
 */

/**
 * @param {string} id
 * @returns {BlobNode}
 */
export function createBlobNode(id) {
  if (typeof id !== 'string' || !id) {
    throw new TypeError('createBlobNode: id required');
  }
  return { id, blobs: new Map(), manifests: new Map() };
}

/**
 * Put payload on a node: store whole blob + each chunk under its cid.
 * @param {BlobNode} node
 * @param {Uint8Array | Buffer | string} data
 * @param {{ chunkBytes?: number }} [opts]
 */
export function putBlob(node, data, opts = {}) {
  const buf =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  const manifest = buildBlobManifest(buf, opts);
  node.blobs.set(manifest.cid, Buffer.from(buf));
  const pieces = chunkBytes(buf, manifest.chunkBytes);
  for (const piece of pieces) {
    node.blobs.set(cidOf(piece), Buffer.from(piece));
  }
  node.manifests.set(manifest.cid, manifest);
  return manifest;
}

/**
 * @param {BlobNode} node
 * @param {string} cid
 * @returns {Buffer | null}
 */
export function getBlob(node, cid) {
  const hit = node.blobs.get(cid);
  return hit ? Buffer.from(hit) : null;
}

/**
 * @param {BlobNode} node
 * @param {string} cid
 */
export function hasBlob(node, cid) {
  return node.blobs.has(cid);
}

/**
 * Sync one manifest (whole + chunks) from `from` → `to` by cid.
 * Fails if source missing or reconstructed cid mismatches.
 *
 * @param {BlobNode} from
 * @param {BlobNode} to
 * @param {string} rootCid
 */
export function syncBlobByCid(from, to, rootCid) {
  const manifest = from.manifests.get(rootCid);
  if (!manifest) {
    return { ok: false, error: `manifest missing on ${from.id}: ${rootCid}` };
  }
  const whole = getBlob(from, rootCid);
  if (!whole) {
    return { ok: false, error: `blob missing on ${from.id}: ${rootCid}` };
  }
  if (cidOf(whole) !== rootCid) {
    return { ok: false, error: 'source cid mismatch' };
  }

  const transferred = [];
  for (const chunk of manifest.chunks) {
    const piece = getBlob(from, chunk.cid);
    if (!piece) {
      return {
        ok: false,
        error: `chunk missing on ${from.id}: ${chunk.cid}`
      };
    }
    if (cidOf(piece) !== chunk.cid) {
      return { ok: false, error: `chunk cid mismatch: ${chunk.cid}` };
    }
    to.blobs.set(chunk.cid, piece);
    transferred.push(chunk.cid);
  }

  to.blobs.set(rootCid, whole);
  to.manifests.set(rootCid, structuredClone(manifest));
  transferred.push(rootCid);

  const check = getBlob(to, rootCid);
  if (!check || cidOf(check) !== rootCid) {
    return { ok: false, error: `receiver cid mismatch on ${to.id}` };
  }

  return {
    ok: true,
    from: from.id,
    to: to.id,
    rootCid,
    transferred,
    size: manifest.size,
    chunks: manifest.chunks.length
  };
}
