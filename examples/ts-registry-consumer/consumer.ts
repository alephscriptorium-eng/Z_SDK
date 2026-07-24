/**
 * WP-U158 — consumidor TypeScript limpio desde registry @zeus.
 *
 * Tipado real (strict / noImplicitAny). Sin `any` de escape en imports Zeus.
 * Compilación canónica: `tsc --noEmit` (orquestada por smoke:ts-registry).
 */

import {
  PROTOCOL_VERSION,
  makeIntent,
  type IntentPayload,
  type PeerCard
} from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard,
  type SeatKeyPair
} from '@zeus/protocol/peer-card-seat';
import {
  loadScriptoriumConfig,
  type ScriptoriumConfig
} from '@zeus/rooms';
import {
  SIGNALING_WIRE_EVENTS,
  createWireMessage,
  type SignalingWireType
} from '@zeus/webrtc-signaling/messages';

const cfg: ScriptoriumConfig = loadScriptoriumConfig({
  ZEUS_SCRIPTORIUM_URL: 'http://127.0.0.1:13058',
  ZEUS_SCRIPTORIUM_ROOM: 'U158_TS_REGISTRY',
  ZEUS_SCRIPTORIUM_USER: 'u158-smoke',
  ZEUS_SCRIPTORIUM_SECRET: 'dev-secret'
});

const keys: SeatKeyPair = generateSeatKeyPair();

const unsigned = {
  roomId: cfg.room,
  endpoint: cfg.url,
  token: 'u158-smoke-token',
  scopes: ['smoke'],
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  issuedAt: new Date().toISOString(),
  ssbId: keys.ssbId
};

const card: PeerCard = signTravelingPeerCard(
  unsigned,
  keys.privateKey,
  keys.ssbId
);

const seat = verifyTravelingPeerCard(card);
if (!seat.ok) {
  throw new Error(`seat verify failed: ${seat.error}`);
}

const wireType: SignalingWireType = SIGNALING_WIRE_EVENTS[0];
const wireMsg = createWireMessage({
  type: wireType,
  from: cfg.user,
  room: cfg.room,
  data: { smoke: 'u158' }
});

const intent: IntentPayload = makeIntent(
  cfg.user,
  'ping',
  { note: 'ts-registry-smoke' },
  { game: 'smoke-game', role: 'player' }
);

const result: {
  ok: true;
  protocol: typeof PROTOCOL_VERSION;
  room: string;
  user: string;
  seatOk: true;
  wireType: SignalingWireType;
  msgType: unknown;
  intent: string;
  ssbId: string;
} = {
  ok: true,
  protocol: PROTOCOL_VERSION,
  room: cfg.room,
  user: cfg.user,
  seatOk: true,
  wireType,
  msgType: wireMsg.type,
  intent: intent.intent,
  ssbId: keys.ssbId
};

console.log(JSON.stringify(result));
