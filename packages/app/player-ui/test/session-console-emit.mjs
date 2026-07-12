import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emitInboundEvent,
  exampleFromSchema,
  isSessionError
} from '../assets/js/session-console.js';

test('isSessionError recognizes protocol errors', () => {
  assert.equal(isSessionError({ event: 'domain:playhead:set', code: 'INVALID_PAYLOAD', message: 'x' }), true);
  assert.equal(isSessionError(new Error('nope')), false);
});

test('exampleFromSchema includes optional properties', () => {
  const sample = exampleFromSchema({
    type: 'object',
    properties: {
      deckId: { type: 'string', enum: ['A', 'B', 'C'] },
      oldid: { type: 'integer' },
      extra: { type: 'string' }
    },
    required: ['oldid']
  });
  assert.equal(sample.oldid, 0);
  assert.equal(sample.deckId, 'A');
  assert.equal(sample.extra, '');
});

test('emitInboundEvent: reply-only registers wait before emit', async () => {
  const order = [];
  const client = {
    waitForEvent(event) {
      order.push('wait');
      return Promise.resolve({ event, ok: true });
    },
    emit(ev, payload) {
      order.push('emit');
      assert.equal(ev, 'wikitext:poll');
    }
  };
  const outcome = await emitInboundEvent(
    client,
    { replyEvent: 'wikitext:poll-result' },
    'wikitext:poll',
    { deckId: 'B', oldid: 1 }
  );
  assert.deepEqual(order, ['wait', 'emit']);
  assert.equal(outcome.kind, 'reply-only');
});

test('emitInboundEvent: ack+reply registers wait before emitWithAck', async () => {
  const order = [];
  const client = {
    waitForEvent() {
      order.push('wait');
      return Promise.resolve({ ok: true, cached: true });
    },
    emitWithAck() {
      order.push('ack');
      return Promise.resolve({ ok: true, cached: true });
    }
  };
  const outcome = await emitInboundEvent(
    client,
    { ack: true, replyEvent: 'wikitext:cache-result' },
    'wikitext:cache',
    { deckId: 'B', oldid: 42 }
  );
  assert.deepEqual(order, ['wait', 'ack']);
  assert.equal(outcome.kind, 'ack+reply');
  const reply = await outcome.replyPromise;
  assert.equal(reply.cached, true);
});

test('emitInboundEvent: ack validation error skips reply wait', async () => {
  const err = { event: 'wikitext:cache', code: 'INVALID_PAYLOAD', message: 'Invalid payload' };
  let replyWaited = false;
  const client = {
    waitForEvent() {
      replyWaited = true;
      return new Promise(() => {});
    },
    emitWithAck() {
      return Promise.reject(err);
    }
  };
  const outcome = await emitInboundEvent(
    client,
    { ack: true, replyEvent: 'wikitext:cache-result' },
    'wikitext:cache',
    {}
  );
  assert.equal(outcome.kind, 'ack-error');
  assert.equal(replyWaited, true);
  assert.equal(outcome.replyPromise, null);
});
