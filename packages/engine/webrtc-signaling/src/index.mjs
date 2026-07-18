/**
 * @zeus/webrtc-signaling — SignalingService over Zeus rooms + ICE from env.
 *
 * Procedencia (WP-U88 / D-17):
 * - Abstract API + wire names from web-rtc-gamify-ui (repo A) @ 4b9271b
 * - Trickle ICE (not waitForIceComplete from simple-ssb-webrtc / repo B)
 * - iceServers ONLY via @zeus/presets-sdk/env resolveIceServers — no Google
 *   STUN hardcoding in this package
 */

export {
  SIGNALING_WIRE_EVENTS,
  ABSTRACT_TO_WIRE,
  WIRE_TO_ABSTRACT,
  createMessageId,
  createWireMessage
} from './messages.mjs';

export {
  SignalingService,
  abstractMessageToWire
} from './signaling-service.mjs';

export { SocketRoomSignalingService } from './socket-room-signaling.mjs';

export {
  loadRtcPeerConnection,
  negotiateDataChannel
} from './peer-session.mjs';

export { resolveIceServers, GOOGLE_STUN_URLS } from '@zeus/presets-sdk/env';
