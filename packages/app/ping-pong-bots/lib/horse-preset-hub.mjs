/**
 * In-process room hub for horse-preset integration tests.
 * Fans out HORSE (and RABBIT/SPIDER) ROOM_MESSAGE events between linked clients.
 */
import { EventEmitter } from 'node:events';

/**
 * @param {string} user
 * @returns {{ io: EventEmitter, room: Function, user: string }}
 */
export function createHubClient(user) {
  const io = new EventEmitter();
  io.id = `${user}-socket`;
  return {
    user,
    io,
    room(event, data, room) {
      io.emit('__room_out__', { event, data, room, from: user });
    }
  };
}

/**
 * @param {ReturnType<typeof createHubClient>[]} clients
 */
export function linkHubClients(clients) {
  for (const client of clients) {
    client.io.on('__room_out__', ({ event, data, room, from }) => {
      for (const peer of clients) {
        if (peer.user === from) continue;
        const payload = { ...data, from, room };
        peer.io.emit(event, payload);
      }
    });
  }
}

/**
 * Send a HORSE JSON-RPC request and await the matching response.
 * @param {ReturnType<typeof createHubClient>} client
 * @param {string} room
 * @param {string} from
 * @param {string} to
 * @param {string} method
 * @param {object} params
 * @param {number} id
 */
export function horseRpc(client, room, from, to, method, params, id) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`HORSE timeout: ${method}`)), 5000);
    const handler = (raw) => {
      const envelope = raw?.data ?? raw;
      if (envelope?.from !== to) return;
      const msg = envelope?.data ?? envelope;
      if (msg?.id !== id) return;
      clearTimeout(timer);
      client.io.off('HORSE', handler);
      resolve(msg);
    };
    client.io.on('HORSE', handler);
    client.room('HORSE', { jsonrpc: '2.0', method, params, id, from, to }, room);
  });
}
