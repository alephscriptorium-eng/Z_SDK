/**
 * @zeus/socket-core/client — SocketClient surface used by @zeus/rooms
 * and @zeus/socket-server (relay). No dependency on @alephscript/mcp-core-sdk.
 */

import { EventEmitter } from 'node:events';
import { io } from 'socket.io-client';

/**
 * @typedef {object} HandshakeAuth
 * @property {string} [token]
 * @property {string} [room]
 * @property {string} [user]
 */

/**
 * @typedef {object} SocketClientOptions
 * @property {boolean} [autoConnect]
 * @property {HandshakeAuth | (() => HandshakeAuth | Promise<HandshakeAuth>)} [auth]
 * @property {Record<string, string>} [extraHeaders]
 * @property {Array<'websocket' | 'polling'>} [transports]
 * @property {string} [path]
 * @property {boolean} [withCredentials]
 * @property {boolean} [reconnection]
 * @property {number} [reconnectionAttempts]
 * @property {number} [reconnectionDelayMax]
 * @property {number} [timeout]
 */

/**
 * @param {boolean | SocketClientOptions | undefined} value
 * @returns {value is SocketClientOptions}
 */
function isSocketClientOptions(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * @param {boolean | SocketClientOptions} [optsOrAutoConnect]
 * @returns {SocketClientOptions}
 */
function normalizeClientOptions(optsOrAutoConnect) {
  if (isSocketClientOptions(optsOrAutoConnect)) {
    return optsOrAutoConnect;
  }
  return { autoConnect: optsOrAutoConnect ?? true };
}

/**
 * @param {HandshakeAuth | (() => HandshakeAuth | Promise<HandshakeAuth>) | undefined} auth
 */
function normalizeClientAuth(auth) {
  if (!auth) return undefined;
  if (typeof auth !== 'function') return auth;
  return (callback) => {
    Promise.resolve(auth())
      .then((value) => callback(value ?? {}))
      .catch(() => callback({}));
  };
}

/**
 * @param {SocketClientOptions} options
 */
function buildSocketOptions(options) {
  return {
    autoConnect: options.autoConnect ?? true,
    auth: normalizeClientAuth(options.auth),
    extraHeaders: options.extraHeaders,
    transports: options.transports,
    path: options.path,
    withCredentials: options.withCredentials,
    reconnection: options.reconnection,
    reconnectionAttempts: options.reconnectionAttempts,
    reconnectionDelayMax: options.reconnectionDelayMax,
    timeout: options.timeout
  };
}

export class SocketClient extends EventEmitter {
  /**
   * @param {string} [name]
   * @param {string} [url]
   * @param {string} [namespace]
   * @param {boolean | SocketClientOptions} [optsOrAutoConnect]
   */
  constructor(
    name = 'ZeusClient',
    url = 'http://localhost:3000',
    namespace = '/',
    optsOrAutoConnect = true
  ) {
    super();

    this.name = name;
    this.url = url;
    this.namespace = namespace;
    this.options = normalizeClientOptions(optsOrAutoConnect);
    /** @type {import('socket.io-client').Socket} */
    this.io = io(url + namespace, buildSocketOptions(this.options));

    this.io.on('connect', () => {
      this.emit('connect', this.io.id);
    });

    this.io.on('disconnect', () => {
      this.emit('disconnect');
    });

    this.io.on('connect_error', (error) => {
      this.emit('connect_error', error);
    });

    this.io.on('auth_error', (payload) => {
      this.emit('auth_error', payload);
    });
  }

  /**
   * Emit a ROOM_MESSAGE envelope to a room.
   * @param {string} event
   * @param {unknown} [data]
   * @param {string} [room]
   */
  room(event, data = {}, room = 'ENGINE_THREADS') {
    this.io.emit('ROOM_MESSAGE', { event, room, data });
  }
}
