import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  loadScriptoriumConfig,
  createClient,
  connectAndJoin,
  makeMaster,
  setState,
  onState,
  resolveSessionRoom,
  resolveScriptoriumSecret
} from '../src/index.mjs';

test('loadScriptoriumConfig reads ZEUS_SCRIPTORIUM_* env', () => {
  const cfg = loadScriptoriumConfig({
    ZEUS_SCRIPTORIUM_URL: 'http://test:3017',
    ZEUS_SCRIPTORIUM_ROOM: 'room-a',
    ZEUS_SCRIPTORIUM_USER: 'alice',
    ZEUS_SCRIPTORIUM_SECRET: 'tok',
    ZEUS_SCRIPTORIUM_BRIDGE: 'remote',
    ZEUS_SCRIPTORIUM_BRIDGE_URL: 'http://upstream:3017'
  });
  assert.equal(cfg.url, 'http://test:3017');
  assert.equal(cfg.room, 'room-a');
  assert.equal(cfg.user, 'alice');
  assert.equal(cfg.secret, 'tok');
  assert.equal(cfg.bridge, 'remote');
  assert.equal(cfg.bridgeUrl, 'http://upstream:3017');
});

test('resolveSessionRoom defaults to scriptorium.default', () => {
  assert.equal(resolveSessionRoom(undefined, {}), 'scriptorium.default');
  assert.equal(resolveSessionRoom('default', {}), 'scriptorium.default');
});

test('resolveSessionRoom derives room from custom sessionId', () => {
  assert.equal(resolveSessionRoom('demo-42', {}), 'scriptorium.demo-42');
});

test('resolveSessionRoom honors ZEUS_SCRIPTORIUM_ROOM override', () => {
  assert.equal(
    resolveSessionRoom('demo-42', { ZEUS_SCRIPTORIUM_ROOM: 'room-x' }),
    'room-x'
  );
});

test('resolveSessionRoom does not affect config.room default (PUBLIC_ROOM)', () => {
  const cfg = loadScriptoriumConfig({});
  assert.equal(cfg.room, 'PUBLIC_ROOM');
});

test('resolveScriptoriumSecret defaults in dev and fails closed in production', () => {
  assert.equal(resolveScriptoriumSecret({}), 'dev-secret');
  assert.equal(resolveScriptoriumSecret({ ZEUS_SCRIPTORIUM_SECRET: 'tok' }), 'tok');
  assert.throws(
    () => resolveScriptoriumSecret({ NODE_ENV: 'production' }),
    /ZEUS_SCRIPTORIUM_SECRET is required/
  );
});

test('createClient defaults reconnection to false', () => {
  const client = createClient('alice');
  assert.equal(client.options.reconnection, false);
});

test('createClient honors reconnection override', () => {
  const client = createClient('alice', { reconnection: true });
  assert.equal(client.options.reconnection, true);
});

test('makeMaster and setState emit ROOM_MESSAGE', () => {
  const emitted = [];
  const mockIo = new EventEmitter();
  mockIo.id = 'sock-1';
  mockIo.io = { opts: {} };
  mockIo.connect = () => {};
  mockIo.emit = (event, payload) => emitted.push({ event, payload });
  mockIo.on = (...args) => EventEmitter.prototype.on.apply(mockIo, args);
  mockIo.off = (...args) => EventEmitter.prototype.off.apply(mockIo, args);

  const client = { io: mockIo, room: (event, data, room) => mockIo.emit('ROOM_MESSAGE', { event, room, data }) };

  makeMaster(client, 'scriptorium.s1', { features: ['session'] });
  setState(client, 'scriptorium.s1', { playhead: { year: 2010 } });

  assert.equal(emitted.length, 2);
  assert.equal(emitted[0].payload.event, 'MAKE_MASTER');
  assert.equal(emitted[0].payload.room, 'scriptorium.s1');
  assert.equal(emitted[1].payload.event, 'SET_STATE');
  assert.deepEqual(emitted[1].payload.data, { playhead: { year: 2010 } });
});

test('onState subscribes to SET_STATE', () => {
  const mockIo = new EventEmitter();
  mockIo.io = { opts: {} };
  const client = { io: mockIo };
  const seen = [];
  const off = onState(client, (d) => seen.push(d));
  mockIo.emit('SET_STATE', { phase: 'activa' });
  off();
  mockIo.emit('SET_STATE', { phase: 'cierre' });
  assert.deepEqual(seen, [{ phase: 'activa' }]);
});

test('connectAndJoin emits CLIENT_SUSCRIBE with optional zones', async () => {
  const emitted = [];
  const mockIo = new EventEmitter();
  mockIo.id = 'sock-zones';
  mockIo.io = { opts: {} };
  mockIo.connect = () => {
    queueMicrotask(() => mockIo.emit('connect'));
  };
  mockIo.disconnect = () => {};
  mockIo.emit = (event, payload) => {
    EventEmitter.prototype.emit.call(mockIo, event, payload);
    if (event === 'CLIENT_REGISTER' || event === 'CLIENT_SUSCRIBE') {
      emitted.push({ event, payload });
    }
  };

  const client = { io: mockIo };
  const joined = await connectAndJoin(client, 'zone-peer', {
    room: 'ROOM_Z',
    zones: ['editores'],
    features: ['zeus-rooms', 'gamechannel']
  });

  assert.equal(joined.room, 'ROOM_Z');
  assert.deepEqual(joined.zones, ['editores']);
  const sub = emitted.find((e) => e.event === 'CLIENT_SUSCRIBE');
  assert.ok(sub);
  assert.deepEqual(sub.payload, { room: 'ROOM_Z', zones: ['editores'] });
});

test('connectAndJoin forwards peerCard on CLIENT_REGISTER', async () => {
  const emitted = [];
  const mockIo = new EventEmitter();
  mockIo.id = 'sock-card';
  mockIo.io = { opts: {} };
  mockIo.connect = () => {
    queueMicrotask(() => mockIo.emit('connect'));
  };
  mockIo.disconnect = () => {};
  mockIo.emit = (event, payload) => {
    EventEmitter.prototype.emit.call(mockIo, event, payload);
    if (event === 'CLIENT_REGISTER' || event === 'CLIENT_SUSCRIBE') {
      emitted.push({ event, payload });
    }
  };

  const peerCard = {
    roomId: 'ROOM_C',
    endpoint: 'wss://rooms.example/runtime',
    token: 'seat-test',
    scopes: ['role:player'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ssbId: '@AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=.ed25519',
    seatSignature: 'dGVzdA=='
  };

  const client = { io: mockIo };
  await connectAndJoin(client, 'card-peer', {
    room: 'ROOM_C',
    type: 'PlayerMcp',
    features: ['intent', 'mcp-wrapper'],
    peerCard
  });

  const reg = emitted.find((e) => e.event === 'CLIENT_REGISTER');
  assert.ok(reg);
  assert.equal(reg.payload.type, 'PlayerMcp');
  assert.deepEqual(reg.payload.peerCard, peerCard);
});
