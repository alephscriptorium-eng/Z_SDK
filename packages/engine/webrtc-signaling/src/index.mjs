/**
 * @zeus/webrtc-signaling — SignalingService over Zeus rooms + SSB private DMs + ICE from env.
 *
 * Procedencia (WP-U88 / WP-U90 / D-17):
 * - Abstract API + wire names from web-rtc-gamify-ui (repo A) @ 4b9271b
 * - SocketRoomSignalingService: trickle ICE over rooms (U88)
 * - SsbPrivateSignalingService: ssb-box DMs `type: webrtc-signal` via OASIS pub (U90)
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
  SSB_WEBRTC_SIGNAL_TYPE,
  createSbotPrivateTransport,
  createInMemorySsbPrivateBus
} from './ssb-private-transport.mjs';

export {
  ABSTRACT_TO_SSB_SIGNAL,
  SSB_SIGNAL_TO_ABSTRACT,
  SsbPrivateSignalingService
} from './ssb-private-signaling.mjs';

export {
  loadRtcPeerConnection,
  waitForIceComplete,
  negotiateDataChannel,
  negotiateDataChannelComplete
} from './peer-session.mjs';

export { resolveIceServers, GOOGLE_STUN_URLS } from '@zeus/presets-sdk/env';
