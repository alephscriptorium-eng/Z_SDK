/**
 * Room-mode session client for e2e / browsers (maps SET_STATE ↔ session:state).
 */

import { io as ioClient } from 'socket.io-client';
import { resolveSessionRoom, resolveScriptoriumSecret } from '@zeus/rooms';

/**
 * @param {string} scriptoriumUrl — e.g. http://localhost:3017/runtime
 * @param {string} sessionId
 * @param {object} [options]
 */
export function createRoomSessionClient(scriptoriumUrl, sessionId, options = {}) {
  const base = scriptoriumUrl.replace(/\/runtime\/?$/, '');
  const room = resolveSessionRoom(sessionId);
  const user = options.user ?? `session-client-${Date.now()}`;
  const token = options.token ?? resolveScriptoriumSecret();
  const socket = ioClient(`${base}/runtime`, {
    transports: ['websocket'],
    auth: { token, room, user }
  });

  const waiters = new Map();

  const waitForEvent = (event, predicate = () => true) =>
    new Promise((resolve) => {
      const handler = (payload) => {
        if (!predicate(payload)) return;
        socket.off(event, handler);
        resolve(payload);
      };
      socket.on(event, handler);
      waiters.set(event, handler);
    });

  socket.on('SET_STATE', (data) => {
    if (data?.type === 'session:state' && data.snapshot) {
      socket.emit('session:state', data.snapshot);
    }
  });

  const emit = (event, payload) => {
    socket.emit('ROOM_MESSAGE', { event, room, data: payload });
  };

  return {
    getSocket: () => socket,
    connect: () => new Promise((res, rej) => {
      socket.on('connect', res);
      socket.on('connect_error', rej);
      socket.connect();
    }),
    disconnect: () => socket.disconnect(),
    waitForEvent,
    deckLoad: (p) => emit('domain:deck:load', p),
    setPlayhead: (year) => emit('domain:playhead:set', { year }),
    selectionCast: (p) => emit('selection:cast', p),
    on: (ev, cb) => socket.on(ev, cb),
    off: (ev, cb) => socket.off(ev, cb)
  };
}
