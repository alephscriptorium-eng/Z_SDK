import { SocketClient } from '@alephscript/mcp-core-sdk/client';
import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from './config.mjs';

/** Unwrap ROOM_MESSAGE broadcasts for downstream socket.io clients. */
export function emitDownstream(localNs, payload) {
  if (!payload || typeof payload !== 'object') return;
  localNs.emit('ROOM_MESSAGE', payload);

  const inner = payload.event;
  const data = payload.data;
  if (!inner) return;

  if (inner === 'SET_STATE' && data) {
    localNs.emit('SET_STATE', data);
    return;
  }

  if (inner !== 'MAKE_MASTER') {
    localNs.emit(inner, data);
  }
}

/**
 * @param {import('socket.io').Namespace} localNs
 * @param {{ bridgeUrl: string, secret: string }} options
 * @returns {import('@alephscript/mcp-core-sdk/client').SocketClient}
 */
export function attachRemoteBridge(localNs, { bridgeUrl, secret }) {
  const bridgeClient = new SocketClient('scriptorium-bridge', bridgeUrl, `/${NAMESPACE}`, {
    auth: { token: secret, room: 'PUBLIC_ROOM', user: 'scriptorium-bridge' },
    autoConnect: false
  });
  bridgeClient.io.connect();

  localNs.on('connection', (socket) => {
    for (const ev of RELAY_UPSTREAM) {
      socket.on(ev, (data) => bridgeClient.io.emit(ev, data));
    }
  });

  bridgeClient.io.on('ROOM_MESSAGE', (data) => emitDownstream(localNs, data));
  bridgeClient.io.onAny((event, ...args) => {
    if (RELAY_UPSTREAM.includes(event)) return;
    if (RELAY_DOWNSTREAM_TOP.has(event)) {
      localNs.emit(event, args[0]);
    }
  });

  return bridgeClient;
}
