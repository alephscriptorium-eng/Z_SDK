/**
 * View kit · resilient room-channel subscription (pure — node-testable).
 *
 * Depending on the socket-server generation, a room channel event can reach
 * the browser two ways:
 *   1. UNWRAPPED: `io.to(room).emit(event, data)` — current servers, only
 *      for sockets joined to the emitting room.
 *   2. ENVELOPED: a global `ROOM_MESSAGE` relay carrying `{event, room, data}`
 *      (sometimes wrapped in an array) — older servers, regardless of room.
 *
 * onChannelEvent binds BOTH and dedupes overlaps, so a view keeps working
 * whichever server it talks to and even when the demo emits in another room.
 */

const SEEN_LIMIT = 64;

function signatureOf(event, payload) {
  if (!payload || typeof payload !== 'object' || payload.ts == null) return null;
  return `${event}:${payload.ts}:${payload.tick ?? ''}:${payload.from ?? ''}`;
}

/**
 * @param {{onRoomEvent: (event: string, cb: Function) => Function}} room kit room client
 * @param {string} event channel event name (e.g. GAME_STATE)
 * @param {(payload: object, meta: {via: 'direct'|'envelope', room: string|null}) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onChannelEvent(room, event, cb) {
  const seen = [];

  function accept(payload) {
    const sig = signatureOf(event, payload);
    if (!sig) return true; // no identity → cannot dedupe, let it through
    if (seen.includes(sig)) return false;
    seen.push(sig);
    if (seen.length > SEEN_LIMIT) seen.shift();
    return true;
  }

  const offDirect = room.onRoomEvent(event, (payload) => {
    if (accept(payload)) cb(payload, { via: 'direct', room: null });
  });

  const offEnvelope = room.onRoomEvent('ROOM_MESSAGE', (raw) => {
    const envelopes = Array.isArray(raw) ? raw : [raw];
    for (const envelope of envelopes) {
      if (!envelope || typeof envelope !== 'object' || envelope.event !== event) continue;
      const data = envelope.data ?? envelope;
      if (accept(data)) cb(data, { via: 'envelope', room: envelope.room ?? null });
    }
  });

  return () => {
    offDirect?.();
    offEnvelope?.();
  };
}
