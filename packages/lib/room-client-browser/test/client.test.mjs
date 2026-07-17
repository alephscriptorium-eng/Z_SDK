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
    room: 'scriptorium.t',
    sessionId: 't',
    token: 'tok',
    user: 'viewer-1',
    type: 'Viewer'
  });

  assert.equal(client.room, 'scriptorium.t');
  assert.equal(client.user, 'viewer-1');
  assert.equal(lastSock.url, 'http://localhost:3017/runtime');
  assert.equal(lastSock.autoConnect, false);
  assert.deepEqual(lastSock.transports, ['websocket']);
  assert.deepEqual(lastSock.auth, {
    token: 'tok',
    room: 'scriptorium.t',
    user: 'viewer-1'
  });
  assert.equal(client.getSocket(), lastSock);

  await client.connect();
  assert.ok(outbound.some((o) => o.event === 'CLIENT_REGISTER'));
  assert.ok(
    outbound.some(
      (o) => o.event === 'CLIENT_SUSCRIBE' && o.data.room === 'scriptorium.t'
    )
  );

  const snaps = [];
  const unsub = client.onState((snapshot, envelope) => {
    snaps.push({ snapshot, seq: envelope.seq });
  });
  lastSock._inbound('SET_STATE', {
    type: 'session:state',
    snapshot: { phase: 'activa' },
    seq: 7
  });
  lastSock._inbound('SET_STATE', { type: 'other', snapshot: { ignored: true } });
  assert.deepEqual(snaps, [{ snapshot: { phase: 'activa' }, seq: 7 }]);
  unsub();
  lastSock._inbound('SET_STATE', {
    type: 'session:state',
    snapshot: { phase: 'cierre' },
    seq: 8
  });
  assert.equal(snaps.length, 1);

  const roomEvents = [];
  client.onRoomEvent('PING', (payload) => roomEvents.push(payload));
  lastSock._inbound('PING', { n: 3 });
  assert.deepEqual(roomEvents, [{ n: 3 }]);

  const anyEvents = [];
  client.onAny((event, payload) => anyEvents.push({ event, payload }));
  lastSock._inbound('PONG', { ok: true });
  assert.ok(anyEvents.some((e) => e.event === 'PONG' && e.payload.ok === true));

  client.emit('CAST', { targetId: 1 });
  const roomMessage = outbound.find(
    (o) => o.event === 'ROOM_MESSAGE' && o.data.event === 'CAST'
  );
  assert.ok(roomMessage);
  assert.deepEqual(roomMessage.data, {
    event: 'CAST',
    room: 'scriptorium.t',
    data: { targetId: 1 }
  });

  client.disconnect();
});

test('createBrowserRoomClient strips /runtime and defaults room from sessionId', async () => {
  outbound.length = 0;
  const client = createBrowserRoomClient({
    scriptoriumUrl: 'http://host.example:4017/runtime/',
    sessionId: 's9',
    token: 't'
  });
  assert.equal(lastSock.url, 'http://host.example:4017/runtime');
  assert.equal(client.room, 'scriptorium.s9');
  assert.match(client.user, /^viewer-\d+$/);
});
