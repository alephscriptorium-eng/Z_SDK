/**
 * LAN DataChannel lane — peer-card U93 is the portero.
 * Reuses `@zeus/blob-sync-harness` (which wraps `assertSignalingPeerCard`).
 * Does not reimplement the torno. Residual viewer-fabricated cards → cola U93.
 */

import {
  BLOB_LANES,
  assertLanBlobTransferAllowed
} from '@zeus/blob-sync-harness';

export { BLOB_LANES, assertLanBlobTransferAllowed };

/**
 * Explicit reject helper for the outbound lane CA.
 * @param {unknown} peerCard
 * @param {{ role?: string, now?: number }} [opts]
 */
export function requireLanPeerCard(peerCard, opts = {}) {
  const gate = assertLanBlobTransferAllowed(peerCard, opts);
  if (!gate.ok) {
    return {
      ok: false,
      lane: gate.lane,
      error: gate.error || 'peer-card required for LAN blob lane'
    };
  }
  return gate;
}
