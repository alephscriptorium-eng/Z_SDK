/**
 * Local xstate snapshot (DJ — no SessionManifest v2 / session-domain).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import { sessionMachine, snapshotFromActor } from '../src/session-machine.mjs';

test('snapshotFromActor returns local deck phase', () => {
  const actor = createActor(sessionMachine);
  actor.start();
  const snap = snapshotFromActor(actor);
  assert.equal(snap.phase, 'idle');
  assert.ok(snap.decks);
  assert.ok(snap.parteCues);
  actor.stop();
});
