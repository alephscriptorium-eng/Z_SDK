import { Server as SocketIOServer } from 'socket.io';
import { SESSION_NAMESPACE } from '../protocol.mjs';

/**
 * Attach a Socket.IO namespace to an existing HTTP server.
 * @param {object} opts
 * @param {import('node:http').Server} opts.httpServer
 * @param {string} [opts.namespace]
 * @param {object} [opts.socketIoOptions]
 */
export function attachNamespaceServer({ httpServer, namespace = SESSION_NAMESPACE, socketIoOptions = {} }) {
  const io = new SocketIOServer(httpServer, socketIoOptions);
  const nsp = io.of(namespace);

  return {
    io,
    nsp,
    /**
     * @param {string} event
     * @param {unknown} payload
     */
    broadcast(event, payload) {
      nsp.emit(event, payload);
    },
    /**
     * @param {import('socket.io').Socket} socket
     * @param {string} event
     * @param {unknown} payload
     */
    unicast(socket, event, payload) {
      socket.emit(event, payload);
    },
  /**
   * Close socket.io only — caller must close httpServer separately.
   */
    close() {
      return new Promise((resolve) => {
        io.close(() => resolve());
      });
    }
  };
}
