/**
 * Browser room client — explicit config (no process.env).
 *
 * Protocol (scriptorium runtime, socket.io /runtime namespace):
 *   - connect with auth { token, room, user }
 *   - on connect: emit CLIENT_REGISTER + CLIENT_SUSCRIBE (per-connection membership)
 *   - authority publishes `state` / `arg:state` (contrato único + dual)
 *   - room channel events are re-broadcast under their own event name
 *   - emit(event, data) → ROOM_MESSAGE { event, room, data }
 */

import { io } from 'socket.io-client';

/** Default game room when caller omits `room` (caller/env may override). */
export const DEFAULT_GAME_ROOM = 'ARG_DELTA';

/** State wire events (canónico + dual delta). */
const STATE_EVENTS = Object.freeze(['state', 'arg:state']);

/**
 * @param {object} cfg
 * @param {string} cfg.scriptoriumUrl e.g. http://localhost:3017/runtime
 * @param {string} [cfg.room] game room id (default ARG_DELTA)
 * @param {string} [cfg.sessionId] unused for room id; kept for inject compat
 * @param {string} cfg.token
 * @param {string} [cfg.user]
 * @param {string} [cfg.type]
 * @param {string[]} [cfg.features]
 */
export function createBrowserRoomClient(cfg) {
  const base = cfg.scriptoriumUrl.replace(/\/runtime\/?$/, '');
  const room = cfg.room || DEFAULT_GAME_ROOM;
  const user = cfg.user || `viewer-${Date.now()}`;
  const type = cfg.type || 'Viewer';
  const features = cfg.features ?? ['viewer', 'operator'];

  const socket = io(`${base}/runtime`, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token: cfg.token, room, user }
  });

  const stateCallbacks = new Set();

  function notifyState(payload) {
    if (!payload || typeof payload !== 'object') return;
    for (const cb of stateCallbacks) cb(payload, payload);
  }

  for (const ev of STATE_EVENTS) {
    socket.on(ev, notifyState);
  }

  function register() {
    socket.emit('CLIENT_REGISTER', {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type,
      features
    });
    socket.emit('CLIENT_SUSCRIBE', { room });
  }

  socket.on('connect', register);

  return {
    room,
    user,
    getSocket: () => socket,
    connect() {
      return new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
    },
    disconnect() {
      socket.disconnect();
    },
    /** Subscribe to game state snapshots (`state` / `arg:state`). Returns unsubscribe. */
    onState(cb) {
      stateCallbacks.add(cb);
      return () => stateCallbacks.delete(cb);
    },
    /** Listen to an arbitrary room-broadcast event. Returns unsubscribe. */
    onRoomEvent(event, cb) {
      socket.on(event, cb);
      return () => socket.off(event, cb);
    },
    /** Listen to every inbound room event (catch-all). cb receives (event, ...args). Returns unsubscribe. */
    onAny(cb) {
      socket.onAny(cb);
      return () => socket.offAny(cb);
    },
    /** Emit a room channel event via ROOM_MESSAGE. */
    emit(event, data) {
      socket.emit('ROOM_MESSAGE', { event, room, data });
    }
  };
}
