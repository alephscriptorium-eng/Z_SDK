import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { wrapInboundHandler, resolveSessionTransport, wireRoomInboundHandlers } from '../src/session-transport.mjs';

test('resolveSessionTransport is always room after cutover', () => {
  assert.equal(resolveSessionTransport({}), 'room');
  assert.equal(resolveSessionTransport({ ZEUS_SESSION_TRANSPORT: 'legacy' }), 'room');
  assert.equal(resolveSessionTransport({ ZEUS_SESSION_TRANSPORT: 'room' }), 'room');
});

test('wrapInboundHandler blocks invalid payload and emits session:error', () => {
  const calls = [];
  const errors = [];
  const logs = [];

  const wrapped = wrapInboundHandler('domain:playhead:set', (payload) => calls.push(payload), {
    mode: 'enforce',
    emitError: (err) => errors.push(err),
    log: (...args) => logs.push(args.join(' '))
  });

  wrapped({ year: 'not-a-year' }, { socket: null, ack: () => {} });

  assert.equal(calls.length, 0, 'handler must not run for invalid payload');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].event, 'domain:playhead:set');
  assert.equal(errors[0].code, 'INVALID_PAYLOAD');
  assert.ok(Array.isArray(errors[0].issues) && errors[0].issues.length > 0);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /domain:playhead:set/);
});

test('wrapInboundHandler passes valid (coerced) payload to handler', () => {
  const calls = [];
  const errors = [];

  const wrapped = wrapInboundHandler('domain:playhead:set', (payload) => calls.push(payload), {
    mode: 'enforce',
    emitError: (err) => errors.push(err),
    log: () => {}
  });

  wrapped({ year: '2010' }, {});

  assert.equal(errors.length, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].year, 2010, 'Year is coerced to number by the schema');
});

test('wrapInboundHandler mode off skips validation entirely', () => {
  const calls = [];
  const errors = [];

  const wrapped = wrapInboundHandler('domain:playhead:set', (payload) => calls.push(payload), {
    mode: 'off',
    emitError: (err) => errors.push(err),
    log: () => {}
  });

  wrapped({ year: 'garbage' }, {});

  assert.equal(errors.length, 0);
  assert.equal(calls.length, 1, 'off mode must not filter payloads');
  assert.deepEqual(calls[0], { year: 'garbage' });
});

test('wrapInboundHandler passes through events without inbound schema', () => {
  const calls = [];

  const wrapped = wrapInboundHandler('totally:unknown', (payload) => calls.push(payload), {
    mode: 'enforce',
    emitError: () => {},
    log: () => {}
  });

  wrapped({ anything: true }, {});
  assert.equal(calls.length, 1);
});

test('wrapInboundHandler survives a throwing emitError (best effort)', () => {
  const calls = [];

  const wrapped = wrapInboundHandler('domain:playhead:set', (payload) => calls.push(payload), {
    mode: 'enforce',
    emitError: () => {
      throw new Error('socket gone');
    },
    log: () => {}
  });

  assert.doesNotThrow(() => wrapped({}, {}));
  assert.equal(calls.length, 0);
});

test('room inbound loop wiring: invalid payload never reaches handler, valid does', { timeout: 5000 }, () => {
  const io = new EventEmitter();
  const emitted = [];
  const handled = [];
  const room = 'scriptorium.default';

  wireRoomInboundHandlers({ io }, {
    room,
    handlers: {
      'domain:playhead:set': (payload) => handled.push(payload)
    },
    validate: {
      mode: 'enforce',
      emitError: (err) => emitted.push({ event: 'session:error', payload: err }),
      log: () => {}
    }
  });

  io.emit('domain:playhead:set', { year: 'nope' });
  assert.equal(handled.length, 0);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].event, 'session:error');
  assert.equal(emitted[0].payload.code, 'INVALID_PAYLOAD');
  assert.equal(emitted[0].payload.event, 'domain:playhead:set');

  io.emit('domain:playhead:set', { year: 1998 });
  assert.equal(handled.length, 1);
  assert.equal(handled[0].year, 1998);
  assert.equal(emitted.length, 1, 'no extra session:error for valid payload');
});
