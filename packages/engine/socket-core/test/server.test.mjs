import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { SocketClient } from '../src/client.mjs';
import { SocketServer } from '../src/server.mjs';

/**
 * @param {import('node:events').EventEmitter} emitter
 * @param {string} event
 * @param {number} [ms]
 */
function onceTimeout(emitter, event, ms = 3000) {
  return Promise.race([
    once(emitter, event),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    })
  ]);
}

/**
 * @param {SocketServer} server
 * @param {string} room
 * @param {number} min
 * @param {number} [ms]
 */
async function waitForRoomMembers(server, room, min, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const members = server.roomsSockets.get(room) || [];
    if (members.length >= min) return members;
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  throw new Error(
    `timeout waiting for ${min} members in ${room}; got ${JSON.stringify(server.roomsSockets.get(room) || [])}`
  );
}

/**
 * @param {string} [namespace]
 */
async function bootPair(namespace = 'runtime') {
  const httpServer = http.createServer();
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = /** @type {import('node:net').AddressInfo} */ (
    httpServer.address()
  );

  // Instruments off in unit tests (keeps process handles clean); boolean
  // ctor used by socket-server is covered in a dedicated test.
  const socketServer = new SocketServer('Scriptorium', httpServer, {
    activateInstrumens: false,
    autoBroadcast: true
  });
  socketServer.createNamespace(namespace);

  return {
    port,
    httpServer,
    socketServer,
    async close() {
      socketServer.io.disconnectSockets(true);
      await new Promise((resolve) => socketServer.io.close(() => resolve()));
      if (httpServer.listening) {
        await new Promise((resolve) => httpServer.close(() => resolve()));
      }
    }
  };
}

test('SocketServer boolean ctor matches socket-server call site', async () => {
  const httpServer = http.createServer();
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const socketServer = new SocketServer('Scriptorium', httpServer, true, true);
  assert.equal(socketServer.name, 'Scriptorium');
  assert.equal(socketServer.autoBroadcast, true);
  assert.ok(socketServer.io);
  socketServer.createNamespace('runtime');
  assert.ok(socketServer.namespaces.has('runtime'));
  socketServer.io.disconnectSockets(true);
  await new Promise((resolve) => socketServer.io.close(() => resolve()));
  await new Promise((resolve) => httpServer.close(() => resolve()));
});

test('SocketServer createNamespace exposes .io namespace path', async () => {
  const pair = await bootPair('runtime');
  assert.ok(pair.socketServer.io);
  assert.ok(pair.socketServer.namespaces.has('runtime'));
  assert.equal(pair.socketServer.io.of('/runtime').name, '/runtime');
  await pair.close();
});

test('subscribe + ROOM_MESSAGE broadcasts event to room peers', async () => {
  const pair = await bootPair('runtime');
  const url = `http://127.0.0.1:${pair.port}`;
  const room = 'PUBLIC_ROOM';

  const a = new SocketClient('alice', url, '/runtime', {
    autoConnect: false,
    reconnection: false
  });
  const b = new SocketClient('bob', url, '/runtime', {
    autoConnect: false,
    reconnection: false
  });

  a.io.connect();
  b.io.connect();
  await Promise.all([
    onceTimeout(a.io, 'connect'),
    onceTimeout(b.io, 'connect')
  ]);

  a.io.emit('CLIENT_REGISTER', { usuario: 'alice', sesion: 's1' });
  b.io.emit('CLIENT_REGISTER', { usuario: 'bob', sesion: 's1' });
  a.io.emit('CLIENT_SUSCRIBE', { room });
  b.io.emit('CLIENT_SUSCRIBE', { room });
  await waitForRoomMembers(pair.socketServer, room, 2);

  const seen = onceTimeout(b.io, 'PING_PEER');
  a.room('PING_PEER', { hello: true }, room);
  const [payload] = await seen;

  assert.deepEqual(payload, { hello: true });

  a.io.disconnect();
  b.io.disconnect();
  a.io.close();
  b.io.close();
  await pair.close();
});

test('MAKE_MASTER + SET_STATE fans out to room (master-room protocol)', async () => {
  const pair = await bootPair('runtime');
  const url = `http://127.0.0.1:${pair.port}`;
  const room = 'scriptorium.demo';

  const master = new SocketClient('master', url, '/runtime', {
    autoConnect: false,
    reconnection: false
  });
  const peer = new SocketClient('peer', url, '/runtime', {
    autoConnect: false,
    reconnection: false
  });

  master.io.connect();
  peer.io.connect();
  await Promise.all([
    onceTimeout(master.io, 'connect'),
    onceTimeout(peer.io, 'connect')
  ]);

  master.io.emit('CLIENT_REGISTER', { usuario: 'master', sesion: 'm1' });
  peer.io.emit('CLIENT_REGISTER', { usuario: 'peer', sesion: 'p1' });
  master.io.emit('CLIENT_SUSCRIBE', { room });
  peer.io.emit('CLIENT_SUSCRIBE', { room });
  await waitForRoomMembers(pair.socketServer, room, 2);

  master.room('MAKE_MASTER', { features: ['session'] }, room);

  const start = Date.now();
  while (Date.now() - start < 3000) {
    if (pair.socketServer.rooms.get(room) === master.io.id) break;
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  assert.equal(pair.socketServer.rooms.get(room), master.io.id);

  const seen = onceTimeout(peer.io, 'SET_STATE');
  master.room('SET_STATE', { phase: 'activa' }, room);
  const [state] = await seen;

  assert.equal(state.phase, 'activa');
  assert.equal(state.sender, master.io.id);

  master.io.disconnect();
  peer.io.disconnect();
  master.io.close();
  peer.io.close();
  await pair.close();
});
