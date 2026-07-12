/**
 * @zeus/operator-bridge tests — the session→bot-hub mapping contract.
 * Pure, no Angular/three/network. This is the executable spec of the bridge.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createOperatorBridge, CHANNELS, TYPES, HUB } from '../src/index.mjs';

test('presence → sys bot-to-center toward the hub', () => {
  const b = createOperatorBridge();
  const [m] = b.onSessionEvent('presence', { actorId: 'ping-demo', ts: 100 });
  assert.equal(m.fromBot, 'ping-demo');
  assert.equal(m.toBot, HUB);
  assert.equal(m.channel, CHANNELS.SYS);
  assert.equal(m.type, TYPES.BOT_TO_CENTER);
  assert.equal(m.timestamp, 100);
  assert.match(m.content, /conectado/);
});

test('PING/PONG → game channel with expression + answer', () => {
  const b = createOperatorBridge();
  const [ping] = b.onSessionEvent('PING', { from: 'ping-demo', n: 3, expr: '2+2', ts: 1 });
  assert.equal(ping.channel, CHANNELS.GAME);
  assert.match(ping.content, /PING #3 · 2\+2/);
  const [pong] = b.onSessionEvent('PONG', { from: 'pong-demo', answer: 4, ts: 2 });
  assert.match(pong.content, /PONG = 4/);
});

test('PONG error surfaces in content', () => {
  const b = createOperatorBridge();
  const [m] = b.onSessionEvent('PONG', { from: 'pong-demo', error: 'timeout' });
  assert.match(m.content, /error: timeout/);
});

test('selection:cast → attributed game message', () => {
  const b = createOperatorBridge();
  const [m] = b.onSessionEvent('selection:cast', {
    actorId: 'ping-demo', targetId: 164540211, label: 'ping pick #1', deckId: 'B', ts: 9,
  });
  assert.equal(m.channel, CHANNELS.GAME);
  assert.equal(m.fromBot, 'ping-demo');
  assert.match(m.content, /escogió 164540211 \(ping pick #1\)/);
  assert.equal(m.timestamp, 9);
});

test('events without an actor id produce nothing', () => {
  const b = createOperatorBridge();
  assert.deepEqual(b.onSessionEvent('PING', {}), []);
  assert.deepEqual(b.onSessionEvent('selection:cast', { targetId: 1 }), []);
  assert.deepEqual(b.onSessionEvent('unknown-event', { from: 'x' }), []);
});

test('snapshot announces each actor exactly once (idempotent)', () => {
  const b = createOperatorBridge();
  const snap = { ts: 5, actors: { 'ping-demo': {}, 'pong-demo': {} } };
  const first = b.onSnapshot(snap);
  assert.equal(first.length, 2);
  assert.deepEqual(first.map((m) => m.fromBot).sort(), ['ping-demo', 'pong-demo']);
  assert.ok(first.every((m) => m.channel === CHANNELS.SYS));
  // re-applying the same snapshot announces nobody new
  assert.deepEqual(b.onSnapshot(snap), []);
});

test('snapshot with map.actors shape is also accepted', () => {
  const b = createOperatorBridge();
  const out = b.onSnapshot({ ts: 1, map: { actors: { 'robot-ping': { zone: 'nodo-a' } } } });
  assert.equal(out.length, 1);
  assert.equal(out[0].fromBot, 'robot-ping');
});

test('snapshot surfaces the last attributed selection', () => {
  const b = createOperatorBridge();
  const out = b.onSnapshot({
    ts: 7,
    actors: {},
    selections: { last: { actorId: 'pong-demo', targetId: 42, label: 'pong pick', ts: 6 } },
  });
  const sel = out.find((m) => m.channel === CHANNELS.GAME);
  assert.ok(sel);
  assert.equal(sel.fromBot, 'pong-demo');
  assert.match(sel.content, /escogió 42 \(pong pick\)/);
  assert.equal(sel.timestamp, 6);
});

test('message ids are unique and stable per stream order', () => {
  const b = createOperatorBridge();
  const ids = [
    ...b.onSessionEvent('presence', { from: 'a' }),
    ...b.onSessionEvent('PING', { from: 'a', n: 1 }),
    ...b.onSessionEvent('PONG', { from: 'b', answer: 2 }),
  ].map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('end-to-end: a session flow produces a coherent hub stream', () => {
  const b = createOperatorBridge();
  const stream = [
    ...b.onSnapshot({ ts: 0, actors: { 'ping-demo': {}, 'pong-demo': {} } }),
    ...b.onSessionEvent('PING', { from: 'ping-demo', n: 1, expr: '3*3', ts: 10 }),
    ...b.onSessionEvent('PONG', { from: 'pong-demo', answer: 9, ts: 12 }),
    ...b.onSessionEvent('selection:cast', { actorId: 'ping-demo', targetId: 100, label: 'pick', ts: 13 }),
  ];
  // 2 presence (sys) + ping + pong + selection (game)
  assert.equal(stream.length, 5);
  assert.equal(stream.filter((m) => m.channel === CHANNELS.SYS).length, 2);
  assert.equal(stream.filter((m) => m.channel === CHANNELS.GAME).length, 3);
  assert.ok(stream.every((m) => m.toBot === HUB && typeof m.id === 'string'));
});
