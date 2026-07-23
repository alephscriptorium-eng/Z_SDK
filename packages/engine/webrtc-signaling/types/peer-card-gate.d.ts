/** Types for `@zeus/webrtc-signaling/peer-card-gate` (WP-U156). */

export const PEER_CARD_GATED_TYPES: readonly string[];
export function isPeerCardGatedType(abstractType: string): boolean;
export function assertSignalingPeerCard(
  card: unknown,
  opts?: {
    role?: string;
    now?: number;
    requireSsbId?: boolean;
    requireSeatSignature?: boolean;
    expectedSsbId?: string;
  }
): { ok: true; role: string; ssbId?: string } | { ok: false; error: string };
export function peerCardFromMessage(messageOrPayload?: object): unknown;
export function ssbIdFromMessage(messageOrPayload?: object): string | null;
