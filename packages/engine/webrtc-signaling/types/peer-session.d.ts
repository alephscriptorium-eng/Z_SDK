/** Types for `@zeus/webrtc-signaling/peer-session` (WP-U156). */

import type { EventEmitter } from 'node:events';

export interface SignalingServiceLike extends EventEmitter {
  sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void>;
  handleError?(err: Error): void;
}

export function loadRtcPeerConnection(): Promise<typeof RTCPeerConnection>;
export function waitForIceComplete(
  pc: RTCPeerConnection,
  timeoutMs?: number
): Promise<RTCSessionDescriptionInit>;
export function negotiateDataChannel(opts: {
  signaling: SignalingServiceLike;
  remotePeerId: string;
  polite: boolean;
  iceServers?: RTCIceServer[];
  label?: string;
  RTCPeerConnection?: typeof RTCPeerConnection;
  timeoutMs?: number;
  trickle?: boolean;
}): Promise<{ pc: RTCPeerConnection; channel: RTCDataChannel }>;
export function negotiateDataChannelComplete(
  opts: Parameters<typeof negotiateDataChannel>[0]
): ReturnType<typeof negotiateDataChannel>;
