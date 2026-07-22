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
 * @param {{
 *   type?: string,
 *   features?: string[],
 *   room?: string,
 *   connectTimeoutMs?: number,
 *   zones?: string | string[],
 *   peerCard?: object,
 * }} [options]
 * `zones` — optional opaque zone interest on CLIENT_SUSCRIBE (logical
 * filter; physical fan-out remains room-wide until authority slices).
 * `peerCard` — optional traveling peer-card (same identity lane as puerta);
 * forwarded on CLIENT_REGISTER when present.
 */
export async function connectAndJoin(client, user, options = {}) {
  const room = options.room ?? config.room;
  const connectTimeoutMs = options.connectTimeoutMs ?? 10_000;
  const zones = options.zones;

  const join = async () => {
    client.io.connect();
    await once(client.io, 'connect');

    const registerPayload = {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type: options.type ?? 'ZeusClient',
      features: options.features ?? ['zeus-rooms']
    };
    if (options.peerCard != null) {
      registerPayload.peerCard = options.peerCard;
    }
    client.io.emit('CLIENT_REGISTER', registerPayload);

    const subscribePayload =
      zones == null ? { room } : { room, zones };
    client.io.emit('CLIENT_SUSCRIBE', subscribePayload);
    return { room, socketId: client.io.id, zones: zones ?? null };
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
 * Kept for authorities / demos that still use master-room protocol.
 */
export function makeMaster(client, room, data = {}) {
  client.room('MAKE_MASTER', { ...data, room }, room);
}

/**
 * Broadcast SET_STATE to room members (master-room protocol).
 */
export function setState(client, room, data) {
  client.room('SET_STATE', data, room);
}

/**
 * Subscribe to SET_STATE events for a room.
 */
export function onState(client, cb) {
  client.io.on('SET_STATE', cb);
  return () => client.io.off('SET_STATE', cb);
}

/**
 * Emit a channel event via ROOM_MESSAGE.
 */
export function emitRoomEvent(client, event, data, room = config.room) {
  client.room(event, data, room);
}

/**
 * Listen for arbitrary room-broadcast events.
 */
export function onRoomEvent(client, event, cb) {
  client.io.on(event, cb);
  return () => client.io.off(event, cb);
}

/**
 * Wait for a socket.io event (e2e / wire canary).
 * Absorbed from demolished session-protocol client-core.
 */
export function waitForSocketEvent(socket, event, predicate = null, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for ${event}`)),
      timeoutMs
    );
    const handler = (payload) => {
      if (predicate && !predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });
}
