/**
 * Local Socket.IO for deck browser ↔ player-ui (not scriptorium master).
 * Shared game state travels only via DJ transport → ARG_DELTA authority.
 * Local deck snapshot uses contrato room event name `state` (WP-U56).
 */

import { Server } from 'socket.io';

/**
 * @param {import('node:http').Server} httpServer
 * @param {object} options
 * @param {Record<string, Function>} options.handlers
 * @param {Function} options.onConnection
 */
export function attachLocalDeckIo(httpServer, options) {
  const { handlers, onConnection } = options;
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/deck-io'
  });

  const serverApi = {
    unicast: (socket, event, payload) => socket.emit(event, payload),
    broadcast: (event, payload) => io.emit(event, payload)
  };

  io.on('connection', (socket) => {
    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event, (payload, ack) => {
        const ctx = {
          socket,
          ack: typeof ack === 'function' ? ack : () => {}
        };
        handler(payload, ctx);
      });
    }
    onConnection?.(socket, serverApi);
  });

  return {
    io,
    broadcastState: (snapshot) => io.emit('state', snapshot),
    emitDeckResolved: (payload) => io.emit('deck:resolved', payload),
    emitCatalog: (servers) => io.emit('catalog:servers', servers),
    emitDjProjection: (payload) => io.emit('dj:projection', payload),
    emitDjLedger: (entry) => io.emit('dj:ledger', entry),
    close: async () => {
      await new Promise((resolve) => io.close(resolve));
    }
  };
}
