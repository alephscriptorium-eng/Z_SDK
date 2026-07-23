import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { SocketClient } from '../src/client.mjs';
import { SocketServer } from '../src/server.mjs';

test('SocketClient ctor stores user/url/namespace/options and exposes .io', () => {
  const client = new SocketClient('alice', 'http://127.0.0.1:9', '/runtime', {
    autoConnect: false,
    reconnection: false,
    auth: { token: 'tok', room: 'PUBLIC_ROOM', user: 'alice' },
    timeout: 5000
  });

  assert.equal(client.name, 'alice');
  assert.equal(client.url, 'http://127.0.0.1:9');
  assert.equal(client.namespace, '/runtime');
  assert.equal(client.options.autoConnect, false);
  assert.equal(client.options.reconnection, false);
  assert.equal(client.options.auth.token, 'tok');
  assert.ok(client.io);
  assert.equal(typeof client.room, 'function');

  client.io.close();
});

test('SocketClient.room emits ROOM_MESSAGE envelope', async () => {
  const httpServer = http.createServer();
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = /** @type {import('node:net').AddressInfo} */ (
    httpServer.address()
  );

  const server = new SocketServer('test', httpServer, {
    activateInstrumens: false,
    autoBroadcast: true
  });
  server.createNamespace('runtime');
  const nsp = server.io.of('/runtime');

  const roomMessages = [];
  nsp.on('connection', (socket) => {
    socket.on('ROOM_MESSAGE', (payload) => roomMessages.push(payload));
  });

  const client = new SocketClient('bob', `http://127.0.0.1:${port}`, '/runtime', {
    autoConnect: false,
    reconnection: false
  });
  client.io.connect();
  await once(client.io, 'connect');

  client.room('SET_STATE', { playhead: { year: 2010 } }, 'scriptorium.s1');

  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.equal(roomMessages.length, 1);
  assert.deepEqual(roomMessages[0], {
    event: 'SET_STATE',
    room: 'scriptorium.s1',
    data: { playhead: { year: 2010 } }
  });

  client.io.disconnect();
  client.io.close();
  server.io.disconnectSockets(true);
  await new Promise((resolve) => server.io.close(() => resolve()));
  if (httpServer.listening) {
    await new Promise((resolve) => httpServer.close(() => resolve()));
  }
});
