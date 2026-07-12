/**
 * @zeus/rooms — Scriptorium rooms client (E1).
 * Wraps @alephscript/mcp-core-sdk SocketClient with ZEUS_SCRIPTORIUM_* env.
 */

import { once } from 'node:events';
import { SocketClient } from '@alephscript/mcp-core-sdk/client';
import {
  loadScriptoriumConfig,
  config,
  resolveSessionRoom,
  resolveScriptoriumSecret,
  DEFAULT_SCRIPTORIUM_SECRET
} from './config.mjs';

export {
  loadScriptoriumConfig,
  config,
  resolveSessionRoom,
  resolveScriptoriumSecret,
  DEFAULT_SCRIPTORIUM_SECRET
};
export { createRoomSessionClient } from './room-session-client.mjs';

/**
 * @param {string} [user]
 * @param {Partial<ReturnType<typeof loadScriptoriumConfig>>} [overrides]
 */
export function createClient(user = config.user, overrides = {}) {
  const cfg = { ...config, ...overrides };
  const client = new SocketClient(user, cfg.url, cfg.namespace, {
    auth: { token: cfg.secret, room: cfg.room, user },
    autoConnect: false,
    reconnection: cfg.reconnection ?? false,
    timeout: 5000
  });
  return client;
}

/**
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {string} user
 * @param {{ type?: string, features?: string[], room?: string }} [options]
 */
export async function connectAndJoin(client, user, options = {}) {
  const room = options.room ?? config.room;
  const connectTimeoutMs = options.connectTimeoutMs ?? 10_000;

  const join = async () => {
    client.io.connect();
    await once(client.io, 'connect');

    client.io.emit('CLIENT_REGISTER', {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type: options.type ?? 'ZeusClient',
      features: options.features ?? ['zeus-rooms']
    });

    client.io.emit('CLIENT_SUSCRIBE', { room });
    return { room, socketId: client.io.id };
  };

  let timer;
  try {
    return await Promise.race([
      join(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`[${user}] connect timeout after ${connectTimeoutMs}ms`)),
          connectTimeoutMs
        );
      })
    ]);
  } catch (err) {
    client.io.disconnect();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Declare this socket as master of a room (MAKE_MASTER).
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {string} room
 * @param {object} [data]
 */
export function makeMaster(client, room, data = {}) {
  client.room('MAKE_MASTER', { ...data, room }, room);
}

/**
 * Broadcast SET_STATE to room members (master-room protocol).
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {string} room
 * @param {unknown} data
 */
export function setState(client, room, data) {
  client.room('SET_STATE', data, room);
}

/**
 * Subscribe to SET_STATE events for a room.
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {(data: unknown) => void} cb
 */
export function onState(client, cb) {
  client.io.on('SET_STATE', cb);
  return () => client.io.off('SET_STATE', cb);
}

/**
 * Emit a channel event via ROOM_MESSAGE.
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {string} event
 * @param {unknown} data
 * @param {string} [room]
 */
export function emitRoomEvent(client, event, data, room = config.room) {
  client.room(event, data, room);
}

/**
 * Listen for arbitrary room-broadcast events.
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {string} event
 * @param {(data: unknown) => void} cb
 */
export function onRoomEvent(client, event, cb) {
  client.io.on(event, cb);
  return () => client.io.off(event, cb);
}
