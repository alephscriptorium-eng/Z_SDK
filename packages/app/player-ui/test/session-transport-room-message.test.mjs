import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { wireRoomInboundHandlers } from '../src/session-transport.mjs';

function mockClient(io) {
  return { io };
}

test('wireRoomInboundHandlers dispatches ROOM_MESSAGE for matching room', { timeout: 5000 }, () => {
  const io = new EventEmitter();
  const handled = [];
  const room = 'scriptorium.default';

  wireRoomInboundHandlers(mockClient(io), {
    room,
    handlers: {
      'caso:set': (payload) => handled.push(payload)
    },
    validate: { mode: 'off', emitError: () => {}, log: () => {} }
  });

  io.emit('ROOM_MESSAGE', { event: 'caso:set', room, data: { casoId: 'x' } });
  assert.equal(handled.length, 1);
  assert.equal(handled[0].casoId, 'x');
});

test('wireRoomInboundHandlers ignores ROOM_MESSAGE for other rooms', { timeout: 5000 }, () => {
  const io = new EventEmitter();
  const handled = [];

  wireRoomInboundHandlers(mockClient(io), {
    room: 'scriptorium.default',
    handlers: {
      'caso:set': (payload) => handled.push(payload)
    },
    validate: { mode: 'off', emitError: () => {}, log: () => {} }
  });

  io.emit('ROOM_MESSAGE', {
    event: 'caso:set',
    room: 'scriptorium.other',
    data: { casoId: 'x' }
  });
  assert.equal(handled.length, 0);
});

test('wireRoomInboundHandlers dispatches unwrapped local scriptorium broadcast', { timeout: 5000 }, () => {
  const io = new EventEmitter();
  const handled = [];

  wireRoomInboundHandlers(mockClient(io), {
    room: 'scriptorium.default',
    handlers: {
      'domain:playhead:set': (payload) => handled.push(payload)
    },
    validate: { mode: 'off', emitError: () => {}, log: () => {} }
  });

  io.emit('domain:playhead:set', { year: 2015 });
  assert.equal(handled.length, 1);
  assert.equal(handled[0].year, 2015);
});

test('wireRoomInboundHandlers validates ROOM_MESSAGE payloads in enforce mode', { timeout: 5000 }, () => {
  const io = new EventEmitter();
  const handled = [];
  const errors = [];

  wireRoomInboundHandlers(mockClient(io), {
    room: 'scriptorium.default',
    handlers: {
      'domain:playhead:set': (payload) => handled.push(payload)
    },
    validate: {
      mode: 'enforce',
      emitError: (err) => errors.push(err),
      log: () => {}
    }
  });

  io.emit('ROOM_MESSAGE', {
    event: 'domain:playhead:set',
    room: 'scriptorium.default',
    data: { year: 'nope' }
  });
  assert.equal(handled.length, 0);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].code, 'INVALID_PAYLOAD');

  io.emit('ROOM_MESSAGE', {
    event: 'domain:playhead:set',
    room: 'scriptorium.default',
    data: { year: 2001 }
  });
  assert.equal(handled.length, 1);
  assert.equal(handled[0].year, 2001);
});
