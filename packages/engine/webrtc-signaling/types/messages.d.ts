/** Types for `@zeus/webrtc-signaling/messages` (WP-U156). */

export type SignalingWireType =
  | 'webrtc-offer'
  | 'webrtc-answer'
  | 'webrtc-ice-candidate'
  | 'join-room'
  | 'leave-room'
  | 'peer-connected'
  | 'peer-disconnected';

export const SIGNALING_WIRE_EVENTS: readonly SignalingWireType[];
export const ABSTRACT_TO_WIRE: Readonly<Record<string, SignalingWireType>>;
export const WIRE_TO_ABSTRACT: Readonly<Record<string, string>>;

export function createMessageId(from?: string): string;
export function createWireMessage(opts: {
  type: SignalingWireType | string;
  from: string;
  to?: string;
  room?: string;
  data?: unknown;
  extra?: Record<string, unknown>;
}): Record<string, unknown>;
