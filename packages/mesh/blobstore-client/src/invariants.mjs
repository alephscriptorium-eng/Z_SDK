/**
 * Auditable invariants for the outbound VOLUMES/blobs lane (cara ciega §2).
 *
 * (i) room messages carry only cids/manifests — never bytes
 * (ii) no blob > 50 MB
 * (iii) same content ⇒ same cid
 * (iv) replication scope = follows graph (ops — documented, not enforced in code)
 */

import { cidOf, SSB_BLOB_SOFT_MAX_BYTES } from './cid.mjs';
import { validateVolumesCidFields } from './volumes-cid.mjs';

export const OUTBOUND_INVARIANTS = Object.freeze({
  i: 'room messages carry only cids/manifests, never bytes',
  ii: `no single blob exceeds ${SSB_BLOB_SOFT_MAX_BYTES} bytes`,
  iii: 'same content ⇒ same cid',
  iv: 'replication scope = follows graph (ops; not enforced in zeus)'
});

/**
 * @param {unknown} roomMessage
 */
export function checkInvariantRoomNoBytes(roomMessage) {
  return validateVolumesCidFields(roomMessage);
}

/**
 * @param {number} sizeBytes
 */
export function checkInvariantBlobSize(sizeBytes) {
  if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes)) {
    return { ok: false, error: 'size must be a finite number' };
  }
  if (sizeBytes > SSB_BLOB_SOFT_MAX_BYTES) {
    return {
      ok: false,
      error: `blob size ${sizeBytes} exceeds soft max ${SSB_BLOB_SOFT_MAX_BYTES} (invariant ii) — use chunk-as-blob`
    };
  }
  return { ok: true };
}

/**
 * @param {Uint8Array | Buffer | string} a
 * @param {Uint8Array | Buffer | string} b
 */
export function checkInvariantCidStable(a, b) {
  const ca = cidOf(a);
  const cb = cidOf(b);
  if (ca !== cb) {
    return { ok: false, error: 'same content must yield same cid (invariant iii)', ca, cb };
  }
  return { ok: true, cid: ca };
}

/**
 * Invariant (iv) is operational (follows). Zeus only documents the rule.
 * @returns {{ ok: true, pendingOps: true, note: string }}
 */
export function checkInvariantFollowsOps() {
  return {
    ok: true,
    pendingOps: true,
    note: OUTBOUND_INVARIANTS.iv
  };
}

/**
 * Runbook snapshot for README / CLI evidence.
 */
export function invariantsRunbook() {
  return {
    invariants: { ...OUTBOUND_INVARIANTS },
    controlPlane: '/x/blobstore/v0/{objetos,objetos/:cid,estado/:cid,deseos,salud}',
    dataPlane: 'ssb-blobs want/has/get (pub gossip — not in zeus monorepo)',
    lanPorter: 'peer-card U93 via assertLanBlobTransferAllowed',
    liveEnv: [
      'ZEUS_BLOB_SIDECAR_URL',
      'ZEUS_BLOB_SYNC_NODE_A',
      'ZEUS_BLOB_SYNC_NODE_B',
      'ZEUS_BLOB_HTTP_TOKEN (optional)'
    ]
  };
}
