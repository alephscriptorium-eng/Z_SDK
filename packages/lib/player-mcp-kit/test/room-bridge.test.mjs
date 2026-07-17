/**
 * createPlayerRoomBridge: validación de opciones (sin socket real).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayerRoomBridge } from '../src/room-bridge.mjs';

const EVENTS = {
  STATE: 'state',
  INTENT: 'intent',
  TRACK: 'track',
  LEDGER: 'ledger'
};

test('exige events + makeIntent + room', () => {
  assert.throws(
    () => createPlayerRoomBridge({ actor: 'a', room: 'R', makeIntent: () => ({}) }),
    /events/
  );
  assert.throws(
    () => createPlayerRoomBridge({ actor: 'a', room: 'R', events: EVENTS }),
    /makeIntent/
  );
  assert.throws(
    () =>
      createPlayerRoomBridge({
        actor: 'a',
        room: '',
        events: EVENTS,
        makeIntent: () => ({})
      }),
    /room/
  );
});
