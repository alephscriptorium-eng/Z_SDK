/**
 * Browser room-session client — explicit config (no process.env).
 *
 * Protocol (scriptorium runtime, socket.io /runtime namespace):
 *   - connect with auth { token, room, user }
 *   - on connect: emit CLIENT_REGISTER + CLIENT_SUSCRIBE (per-connection membership)
 *   - master broadcasts SET_STATE { type:'session:state', snapshot, seq } to room
 *   - room channel events are re-broadcast under their own event name
 *   - emit(event, data) → ROOM_MESSAGE { event, room, data }
 */

import { io } from 'socket.io-client';

/**
 * @param {object} cfg
 * @param {string} cfg.scriptoriumUrl e.g. http://localhost:3017/runtime
 * @param {string} cfg.room
 * @param {string} cfg.sessionId
 * @param {string} cfg.token
 * @param {string} [cfg.user]
 * @param {string} [cfg.type]
 */
export function createBrowserRoomClient(cfg) {
  const base = cfg.scriptoriumUrl.replace(/\/runtime\/?$/, '');
  const room = cfg.room || `scriptorium.${cfg.sessionId}`;
  const user = cfg.user || `viewer-${Date.now()}`;
  const type = cfg.type || 'Viewer';

  const socket = io(`${base}/runtime`, {
    transports: ['websocket'],
    autoConnect: false,
    auth: { token: cfg.token, room, user }
  });

  const stateCallbacks = new Set();

  socket.on('SET_STATE', (data) => {
    if (data && data.type === 'session:state' && data.snapshot) {
      for (const cb of stateCallbacks) cb(data.snapshot, data);
    }
  });

  function register() {
    socket.emit('CLIENT_REGISTER', {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type,
      features: ['viewer']
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
    /** Subscribe to session snapshots (SET_STATE). Returns unsubscribe. */
    onState(cb) {
      stateCallbacks.add(cb);
      return () => stateCallbacks.delete(cb);
    },
    /** Listen to an arbitrary room-broadcast event. Returns unsubscribe. */
    onRoomEvent(event, cb) {
      socket.on(event, cb);
      return () => socket.off(event, cb);
    },
    /** Emit a room channel event via ROOM_MESSAGE. */
    emit(event, data) {
      socket.emit('ROOM_MESSAGE', { event, room, data });
    }
  };
}
