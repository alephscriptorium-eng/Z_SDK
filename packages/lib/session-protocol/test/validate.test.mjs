import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { wrapHandler } from '../src/core/validate.mjs';

const schema = z.object({ year: z.number().int() });

function mockServer() {
  const unicastCalls = [];
  return {
    unicastCalls,
    unicast(socket, event, payload) {
      unicastCalls.push({ socket, event, payload });
    }
  };
}

test('wrapHandler enforce blocks invalid inbound payloads', async () => {
  const server = mockServer();
  let handlerRan = false;
  const wrapped = wrapHandler(
    'domain:playhead:set',
    schema,
    () => {
      handlerRan = true;
    },
    { validate: 'enforce', server }
  );

  const ackCalls = [];
  await wrapped({ year: 'not-a-number' }, {}, (v) => ackCalls.push(v));

  assert.equal(handlerRan, false);
  assert.equal(server.unicastCalls.length, 1);
  assert.equal(server.unicastCalls[0].event, 'session:error');
  assert.equal(ackCalls.length, 1);
});

test('wrapHandler warn soaks invalid inbound payloads like REST warn', async () => {
  const server = mockServer();
  let received;
  const wrapped = wrapHandler(
    'domain:playhead:set',
    schema,
    (payload) => {
      received = payload;
      return { ok: true };
    },
    { validate: 'warn', server }
  );

  const ackCalls = [];
  const invalid = { year: 'not-a-number' };
  await wrapped(invalid, {}, (v) => ackCalls.push(v));

  assert.deepEqual(received, invalid);
  assert.equal(server.unicastCalls.length, 0);
  assert.deepEqual(ackCalls, [{ ok: true }]);
});

test('wrapHandler off passes raw payload without schema gate', async () => {
  const server = mockServer();
  let received;
  const wrapped = wrapHandler(
    'domain:playhead:set',
    schema,
    (payload) => {
      received = payload;
    },
    { validate: 'off', server }
  );

  const invalid = { year: 'not-a-number' };
  await wrapped(invalid, {}, () => {});

  assert.deepEqual(received, invalid);
  assert.equal(server.unicastCalls.length, 0);
});
