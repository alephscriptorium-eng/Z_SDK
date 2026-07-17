import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

const outbound = [];
let lastSock;

function makeSock(url, opts) {
  const ee = new EventEmitter();
  const anyListeners = new Set();
  const sock = {
    url,
    auth: opts?.auth,
    transports: opts?.transports,
    autoConnect: opts?.autoConnect,
    on: (...args) => ee.on(...args),
    once: (...args) => ee.once(...args),
    off: (...args) => ee.off(...args),
    onAny(cb) {
      anyListeners.add(cb);
      return sock;
    },
    offAny(cb) {
      anyListeners.delete(cb);
      return sock;
    },
    emit(event, data) {
      outbound.push({ event, data });
    },
    connect() {
      queueMicrotask(() => {
        ee.emit('connect');
      });
    },
    disconnect() {
      ee.emit('disconnect');
    },
    /** @internal test helper — simulate inbound server event */
    _inbound(event, ...args) {
      ee.emit(event, ...args);
      for (const cb of anyListeners) cb(event, ...args);
    }
  };
  return sock;
}

mock.module('socket.io-client', {
  namedExports: {
    io(url, opts) {
      lastSock = makeSock(url, opts);
      return lastSock;
    }
  }
});

const { createBrowserRoomClient } = await import('../browser/room-client.browser.mjs');

test('createBrowserRoomClient wires auth, register, state and ROOM_MESSAGE', async () => {
  outbound.length = 0;
  const client = createBrowserRoomClient({
    scriptoriumUrl: 'http://localhost:3017/runtime',
    room: 'ARG_U32',
    token: 'tok',
    user: 'viewer-1',
    type: 'Viewer'
  });

  assert.equal(client.room, 'ARG_U32');
  assert.equal(client.user, 'viewer-1');
  assert.equal(lastSock.url, 'http://localhost:3017/runtime');
  assert.equal(lastSock.autoConnect, false);
  assert.deepEqual(lastSock.transports, ['websocket']);
  assert.deepEqual(lastSock.auth, {
    token: 'tok',
    room: 'ARG_U32',
    user: 'viewer-1'
  });
  assert.equal(client.getSocket(), lastSock);

  await client.connect();
  assert.ok(outbound.some((o) => o.event === 'CLIENT_REGISTER'));
  assert.ok(
    outbound.some((o) => o.event === 'CLIENT_SUSCRIBE' && o.data.room === 'ARG_U32')
  );

  const snaps = [];
  const unsub = client.onState((snapshot) => {
    snaps.push(snapshot);
  });
  lastSock._inbound('state', { sceneId: 'delta-v0', actors: { a: {} }, ts: 1 });
  lastSock._inbound('arg:state', { sceneId: 'delta-v0', actors: { a: {}, b: {} }, ts: 2 });
  assert.equal(snaps.length, 2);
  assert.equal(snaps[0].sceneId, 'delta-v0');
  assert.ok(snaps[1].actors.b);
  unsub();
  lastSock._inbound('state', { sceneId: 'ignored' });
  assert.equal(snaps.length, 2);

  const roomEvents = [];
  client.onRoomEvent('ledger', (payload) => roomEvents.push(payload));
  lastSock._inbound('ledger', { kind: 'inspect' });
  assert.deepEqual(roomEvents, [{ kind: 'inspect' }]);

  const anyEvents = [];
  client.onAny((event, payload) => anyEvents.push({ event, payload }));
  lastSock._inbound('intent', { ok: true });
  assert.ok(anyEvents.some((e) => e.event === 'intent' && e.payload.ok === true));

  client.emit('intent', { intent: 'inspect' });
  const roomMessage = outbound.find(
    (o) => o.event === 'ROOM_MESSAGE' && o.data.event === 'intent'
  );
  assert.ok(roomMessage);
  assert.deepEqual(roomMessage.data, {
    event: 'intent',
    room: 'ARG_U32',
    data: { intent: 'inspect' }
  });

  client.disconnect();
});

test('createBrowserRoomClient strips /runtime and defaults room to ARG_DELTA', async () => {
  outbound.length = 0;
  const client = createBrowserRoomClient({
    scriptoriumUrl: 'http://host.example:4017/runtime/',
    token: 't'
  });
  assert.equal(lastSock.url, 'http://host.example:4017/runtime');
  assert.equal(client.room, 'ARG_DELTA');
  assert.match(client.user, /^viewer-\d+$/);
});
