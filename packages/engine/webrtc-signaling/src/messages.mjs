/**
 * Wire contract for WebRTC signaling over Zeus rooms (WP-U88).
 *
 * Adopted from repo A (`web-rtc-gamify-ui` WebRTCAlephClient message types:
 * webrtc-offer | webrtc-answer | webrtc-ice-candidate | join-room | leave-room).
 * Procedencia: plan/recursos/web-rtc-gamify-ui @ 4b9271b — adapted, not
 * copy-paste (PRACTICAS §1.4). Trickle ICE: candidates are sent as they
 * arrive; no waitForIceComplete (repo B).
 */

/** @typedef {'webrtc-offer'|'webrtc-answer'|'webrtc-ice-candidate'|'join-room'|'leave-room'|'peer-connected'|'peer-disconnected'} SignalingWireType */

export const SIGNALING_WIRE_EVENTS = Object.freeze([
  'webrtc-offer',
  'webrtc-answer',
  'webrtc-ice-candidate',
  'join-room',
  'leave-room',
  'peer-connected',
  'peer-disconnected'
]);

/** Map abstract SignalingService message type → wire event. */
export const ABSTRACT_TO_WIRE = Object.freeze({
  offer: 'webrtc-offer',
  answer: 'webrtc-answer',
  'ice-candidate': 'webrtc-ice-candidate',
  'room-join': 'join-room',
  'room-leave': 'leave-room',
  'peer-connected': 'peer-connected',
  'peer-disconnected': 'peer-disconnected'
});

/** Map wire event → abstract type. */
export const WIRE_TO_ABSTRACT = Object.freeze(
  Object.fromEntries(Object.entries(ABSTRACT_TO_WIRE).map(([k, v]) => [v, k]))
);

/**
 * @param {string} [from]
 * @returns {string}
 */
export function createMessageId(from = '') {
  return `${Date.now()}-${from || 'peer'}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Build a wire payload for ROOM_MESSAGE data.
 * @param {object} opts
 * @param {SignalingWireType} opts.type
 * @param {string} opts.from
 * @param {string} [opts.to]
 * @param {string} [opts.room]
 * @param {unknown} [opts.data]
 * @param {Record<string, unknown>} [opts.extra]
 */
export function createWireMessage({ type, from, to, room, data, extra = {} }) {
  return {
    type,
    from,
    to,
    room,
    data,
    timestamp: Date.now(),
    messageId: createMessageId(from),
    ...extra
  };
}
