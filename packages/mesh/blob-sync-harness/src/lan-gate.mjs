/**
 * LAN lane gate for blob transfer over DataChannel (D-21 fila 4 / U93).
 *
 * Peer-card U93 is the portero: this module only reuses
 * `assertSignalingPeerCard` — it does not reimplement the torno.
 */

import { assertSignalingPeerCard } from '@zeus/webrtc-signaling';

export const BLOB_LANES = Object.freeze({
  lan: 'lan-datachannel',
  wan: 'wan-ssb-blobs'
});

/**
 * Allow a LAN (DataChannel) blob transfer only with a valid peer-card.
 *
 * @param {unknown} peerCard
 * @param {{ role?: string, now?: number }} [opts]
 * @returns {{ ok: true, lane: string, role: string } | { ok: false, lane: string, error: string }}
 */
export function assertLanBlobTransferAllowed(peerCard, opts = {}) {
  const gate = assertSignalingPeerCard(peerCard, opts);
  if (!gate.ok) {
    return { ok: false, lane: BLOB_LANES.lan, error: gate.error };
  }
  return { ok: true, lane: BLOB_LANES.lan, role: gate.role };
}

/**
 * WAN data plane is Oasis gossip `ssb-blobs` (pub). Control HTTP is
 * `@zeus/blobstore-client` (U101). Zeus does not implement `blobs.*`.
 *
 * @returns {{ ok: false, lane: string, error: string, pending: true }}
 */
export function assertWanBlobTransferPendingSidecar() {
  return {
    ok: false,
    lane: BLOB_LANES.wan,
    pending: true,
    error:
      'WAN data plane is ssb-blobs gossip (pub ops) — zeus only speaks HTTP control via @zeus/blobstore-client'
  };
}
