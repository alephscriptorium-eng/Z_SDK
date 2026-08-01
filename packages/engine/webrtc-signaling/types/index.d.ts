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

export interface PeerCard {
  roomId: string;
  endpoint: string;
  token: string;
  scopes: string[];
  expiresAt: string;
  displayName?: string;
  sessionId?: string;
  ssbId?: string;
  seatSignature?: string;
}

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
  peerCard?: PeerCard;
  ssbId?: string;
  /** WP-U197: admitido sin card — sin peerCard, sin ssbId, sin rol. */
  anonymous?: boolean;
}

/** Modos de admisión de la antesala WebRTC (WP-U197). */
export type SignalingAdmission = 'peer-card' | 'anonymous';
export const SIGNALING_ADMISSION: {
  readonly peerCard: 'peer-card';
  readonly anonymous: 'anonymous';
};

export declare class SignalingService extends EventEmitter {
  userId: string;
  roomId: string;
  setPeerCard(
    peerCard: PeerCard,
    opts?: {
      role?: string;
      now?: number;
      /** WP-U251 (6): el runtime ya las leía; el tipo las ocultaba. */
      requireSsbId?: boolean;
      requireSeatSignature?: boolean;
    }
  ): void;
  getPeerCard(): PeerCard | null;
  /** WP-U186: rol consultado en la acción; anónimo ⇒ null. */
  getSessionRole(now?: number): string | null;
  /** WP-U197: modo de admisión declarado localmente. */
  setAdmission(mode: SignalingAdmission): void;
  getAdmission(): SignalingAdmission;
  isAnonymous(): boolean;
  describeAdmission(now?: number): {
    admission: SignalingAdmission;
    anonymous: boolean;
    role: string | null;
  };
  connect(userId: string, config?: unknown): Promise<void>;
  disconnect(): Promise<void>;
  joinRoom(roomId: string, peerCard?: PeerCard): Promise<void>;
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
  requiredRole?: string;
  requireSsbId?: boolean;
  requireSeatSignature?: boolean;
  peerCard?: PeerCard;
  /** WP-U197 — `peer-card` (defecto) | `anonymous`. */
  admission?: SignalingAdmission;
}

export declare class SocketRoomSignalingService extends SignalingService {
  constructor(options?: SocketRoomSignalingOptions);
  getClient(): unknown;
}

/** SSB content.type for private WebRTC signaling DMs (WP-U90). */
export const SSB_WEBRTC_SIGNAL_TYPE: 'webrtc-signal';

export interface SsbPrivateMessage {
  key: string;
  value: { author: string; content: Record<string, unknown>; timestamp: number };
}

export interface SsbPrivateTransport {
  whoami(): string;
  publishPrivate(content: object, recps: string[]): Promise<SsbPrivateMessage>;
  subscribePrivate(handler: (msg: SsbPrivateMessage) => void): () => void;
}

export function createSbotPrivateTransport(
  sbot: object,
  opts?: { feedId?: string }
): SsbPrivateTransport;

export function createInMemorySsbPrivateBus(): {
  createTransport(feedId: string): SsbPrivateTransport;
  feedIds(): string[];
};

export const ABSTRACT_TO_SSB_SIGNAL: Readonly<Record<string, string>>;
export const SSB_SIGNAL_TO_ABSTRACT: Readonly<Record<string, string>>;

export interface SsbPrivateSignalingOptions {
  transport?: SsbPrivateTransport;
  allowTrickle?: boolean;
  /** Carril SSB: `ssbId` obligatorio en la card por defecto (`true`). */
  requireSsbId?: boolean;
  /** Exigir firma de asiento en la tarjeta viajera. */
  requireSeatSignature?: boolean;
  /**
   * WP-U251 (6) — el candado, visible en build: este carril sólo admite
   * `peer-card`. `admission: 'anonymous'` LANZA en runtime; aquí ni
   * typechequea. La identidad del feed ES el transporte.
   */
  admission?: 'peer-card';
}

export declare class SsbPrivateSignalingService extends SignalingService {
  constructor(options?: SsbPrivateSignalingOptions);
  getTransport(): SsbPrivateTransport | null;
  /**
   * WP-U251 (6) — firma estrechada a propósito. Heredar la del padre hacía
   * que un consumidor TS viera `setAdmission('anonymous')` como legal justo
   * en la capa donde se enteraría en tiempo de compilación.
   */
  setAdmission(mode: 'peer-card'): void;
  /** El modo del torno en este carril es una constante (defecto 2). */
  getAdmission(): 'peer-card';
}

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
/**
 * WP-U262 · `card` es la card YA extraída del mismo mensaje: pasarla evita
 * el segundo recorrido del payload (`peerCard` se leía 4 veces entre los
 * dos extractores). `undefined` = extráela; `null` = no había.
 */
export function ssbIdFromMessage(
  messageOrPayload?: object,
  card?: unknown
): string | null;
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

export function generateSeatKeyPair(): {
  ssbId: string;
  publicKey: import('node:crypto').KeyObject;
  privateKey: import('node:crypto').KeyObject;
  publicKeyBytes: Buffer;
};
export function signTravelingPeerCard(
  card: object,
  privateKey: import('node:crypto').KeyObject | string | Buffer,
  ssbId?: string
): PeerCard;
export function verifyTravelingPeerCard(
  card: unknown
): { ok: true } | { ok: false; error: string };

export function loadRtcPeerConnection(): Promise<typeof RTCPeerConnection>;
export function waitForIceComplete(
  pc: RTCPeerConnection,
  timeoutMs?: number
): Promise<RTCSessionDescriptionInit>;
export function negotiateDataChannel(opts: {
  signaling: SignalingService;
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

export {
  resolveIceServers,
  GOOGLE_STUN_URLS
} from '@zeus/presets-sdk/env';
