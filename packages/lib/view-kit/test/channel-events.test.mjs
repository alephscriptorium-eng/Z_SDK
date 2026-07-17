/**
 * onChannelEvent — suscripción resiliente (direct + envelope ROOM_MESSAGE,
 * con dedupe). Módulo puro, testeado con un cliente de room falso.
 * Es el único camino por el que las vistas consumen arg:state (G-ARG.2).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { onChannelEvent } from '../src/channel-events.mjs';

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

test('entrega eventos desnudos (direct)', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'arg:state', (p, meta) => got.push({ p, meta }));

  room.emit('arg:state', { ts: 1, tick: 10, actors: {} });
  assert.equal(got.length, 1);
  assert.equal(got[0].meta.via, 'direct');
});

test('entrega eventos ensobrados en ROOM_MESSAGE (objeto y array)', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'arg:state', (p, meta) => got.push({ p, meta }));

  room.emit('ROOM_MESSAGE', { event: 'arg:state', room: 'ARG_DELTA', data: { ts: 1, tick: 1 } });
  room.emit('ROOM_MESSAGE', [{ event: 'arg:state', room: 'ARG_DELTA', data: { ts: 2, tick: 2 } }]);
  room.emit('ROOM_MESSAGE', { event: 'arg:ledger', room: 'ARG_DELTA', data: { ts: 3 } });

  assert.equal(got.length, 2);
  assert.equal(got[0].meta.via, 'envelope');
  assert.equal(got[0].meta.room, 'ARG_DELTA');
  assert.equal(got[1].p.tick, 2);
});

test('dedupea cuando el mismo payload llega direct Y ensobrado', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'arg:state', (p) => got.push(p));

  const msg = { ts: 111, tick: 7, from: 'arg-authority' };
  room.emit('arg:state', msg);
  room.emit('ROOM_MESSAGE', { event: 'arg:state', room: 'ARG_DELTA', data: { ...msg } });

  assert.equal(got.length, 1);
});

test('payloads sin ts no se dedupean (sin identidad)', () => {
  const room = fakeRoom();
  const got = [];
  onChannelEvent(room, 'arg:intent', (p) => got.push(p));

  room.emit('arg:intent', { intent: 'move' });
  room.emit('arg:intent', { intent: 'move' });
  assert.equal(got.length, 2);
});

test('el unsubscribe quita ambos bindings', () => {
  const room = fakeRoom();
  const got = [];
  const off = onChannelEvent(room, 'arg:state', (p) => got.push(p));
  off();
  room.emit('arg:state', { ts: 1 });
  room.emit('ROOM_MESSAGE', { event: 'arg:state', data: { ts: 2 } });
  assert.equal(got.length, 0);
});
