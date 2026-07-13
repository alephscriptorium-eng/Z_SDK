/**
 * onChannelEvent — resilient channel subscription (direct + ROOM_MESSAGE
 * envelope, deduped). Pure module, tested with a fake room client.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { onChannelEvent } from '../assets/js/kit/channel-events.mjs';

function fakeRoom() {
  const handlers = new Map(); // event -> Set<cb>
  return {
    onRoomEvent(event, cb) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event).add(cb);
      return () => handlers.get(event)?.delete(cb);
    },
    emit(event, payload) {
      for (const cb of handlers.get(event) ?? []) cb(payload);
    }
  };
}

test('delivers unwrapped (direct) events', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'GAME_STATE', (p, meta) => got.push({ p, meta }));

  room.emit('GAME_STATE', { ts: 1, tick: 10, actors: {} });
  assert.equal(got.length, 1);
  assert.equal(got[0].meta.via, 'direct');
});

test('delivers enveloped ROOM_MESSAGE events (object and array-wrapped)', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'GAME_STATE', (p, meta) => got.push({ p, meta }));

  room.emit('ROOM_MESSAGE', { event: 'GAME_STATE', room: 'PUBLIC_ROOM', data: { ts: 1, tick: 1 } });
  room.emit('ROOM_MESSAGE', [{ event: 'GAME_STATE', room: 'PUBLIC_ROOM', data: { ts: 2, tick: 2 } }]);
  room.emit('ROOM_MESSAGE', { event: 'OTHER', room: 'PUBLIC_ROOM', data: { ts: 3 } });

  assert.equal(got.length, 2);
  assert.equal(got[0].meta.via, 'envelope');
  assert.equal(got[0].meta.room, 'PUBLIC_ROOM');
  assert.equal(got[1].p.tick, 2);
});

test('dedupes when the same payload arrives direct AND enveloped', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'GAME_STATE', (p) => got.push(p));

  const msg = { ts: 111, tick: 7, from: 'map-authority' };
  room.emit('GAME_STATE', msg);
  room.emit('ROOM_MESSAGE', { event: 'GAME_STATE', room: 'PUBLIC_ROOM', data: { ...msg } });

  assert.equal(got.length, 1);
});

test('payloads without ts are not deduped (no identity)', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'GAME_INTENT', (p) => got.push(p));

  room.emit('GAME_INTENT', { intent: 'walk' });
  room.emit('GAME_INTENT', { intent: 'walk' });
  assert.equal(got.length, 2);
});

test('unsubscribe removes both bindings', () => {
  const room = fakeRoom();
  const got = [];
  const off = onChannelEvent(room, 'GAME_STATE', (p) => got.push(p));
  off();
  room.emit('GAME_STATE', { ts: 1 });
  room.emit('ROOM_MESSAGE', { event: 'GAME_STATE', data: { ts: 2 } });
  assert.equal(got.length, 0);
});
