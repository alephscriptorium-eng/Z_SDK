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

/** Modos de admisión de la antesala WebRTC (WP-U197). */
export const SIGNALING_ADMISSION: {
  readonly peerCard: 'peer-card';
  readonly anonymous: 'anonymous';
};
export type SignalingAdmission = 'peer-card' | 'anonymous';

export function isPeerCardPresented(card: unknown): boolean;

export function assertSignalingAdmission(
  card: unknown,
  opts?: {
    admission?: SignalingAdmission;
    role?: string;
    now?: number;
    requireSsbId?: boolean;
    requireSeatSignature?: boolean;
    expectedSsbId?: string;
    claimedSsbId?: unknown;
    claimedFrom?: unknown;
  }
):
  | { ok: true; anonymous: true; role: null }
  | { ok: true; anonymous: false; role: string; ssbId?: string }
  | { ok: false; anonymous: false; error: string };
