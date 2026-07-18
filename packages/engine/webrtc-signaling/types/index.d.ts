import type { EventEmitter } from 'node:events';

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

export interface SignalingMessage {
  type: string;
  from: string;
  to?: string;
  roomId?: string;
  timestamp: number;
  messageId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  data?: unknown;
  displayName?: string;
}

export declare class SignalingService extends EventEmitter {
  userId: string;
  roomId: string;
  connect(userId: string, config?: unknown): Promise<void>;
  disconnect(): Promise<void>;
  joinRoom(roomId: string, displayName?: string): Promise<void>;
  leaveRoom(): Promise<void>;
  sendMessage(message: SignalingMessage): Promise<void>;
  sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void>;
  isConnected(): boolean;
  getUserId(): string;
  getRoomId(): string;
}

export function abstractMessageToWire(message: SignalingMessage): {
  wireType: string;
  payload: Record<string, unknown>;
};

export interface SocketRoomSignalingOptions {
  url?: string;
  namespace?: string;
  secret?: string;
  room?: string;
  connectTimeoutMs?: number;
  client?: unknown;
}

export declare class SocketRoomSignalingService extends SignalingService {
  constructor(options?: SocketRoomSignalingOptions);
  getClient(): unknown;
}

export function loadRtcPeerConnection(): Promise<typeof RTCPeerConnection>;
export function negotiateDataChannel(opts: {
  signaling: SignalingService;
  remotePeerId: string;
  polite: boolean;
  iceServers?: RTCIceServer[];
  label?: string;
  RTCPeerConnection?: typeof RTCPeerConnection;
  timeoutMs?: number;
}): Promise<{ pc: RTCPeerConnection; channel: RTCDataChannel }>;

export {
  resolveIceServers,
  GOOGLE_STUN_URLS
} from '@zeus/presets-sdk/env';
