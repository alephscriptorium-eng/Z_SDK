/**
 * Contract: cascade concurrency + actuator-driven canRetry + tree rollup.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor } from 'xstate';
import {
  runCascade,
  CASCADE_CONCURRENCY_DEFAULT,
  projectTreeLife,
  leafMachine,
  provideLeafActors,
  resolveIntentionalStop
} from '../src/index.mjs';

test('CASCADE_CONCURRENCY_DEFAULT is 24 (zona techo)', () => {
  assert.equal(CASCADE_CONCURRENCY_DEFAULT, 24);
});

test('runCascade respects concurrency ceiling', async () => {
  let inFlight = 0;
  let peak = 0;
  const items = [1, 2, 3, 4, 5, 6];
  const results = await runCascade(
    items,
    async (n) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 30));
      inFlight -= 1;
      return n * 10;
    },
    { concurrency: 2 }
  );
  assert.deepEqual(results, [10, 20, 30, 40, 50, 60]);
  assert.ok(peak <= 2, `peak ${peak}`);
});

test('projectTreeLife rollup', () => {
  assert.equal(projectTreeLife(['latente', 'latente']), 'latente');
  assert.equal(projectTreeLife(['latente', 'vivo']), 'vivo');
  assert.equal(projectTreeLife(['roto', 'roto']), 'roto');
  assert.equal(projectTreeLife(['latente', 'transicion']), 'transicion');
});

test('canRetry prefers actuator isIntentionalStop over context alone', async () => {
  const marks = new Set();
  let launches = 0;
  const machine = leafMachine.provide(
    provideLeafActors({
      catalogId: 'leaf-a',
      maxRestarts: 3,
      backoffMs: 20,
      isIntentionalStop: (id) => marks.has(id),
      async launch() {
        launches += 1;
        return { identity: { pid: 1 } };
      },
      async stop() {
        return { ok: true };
      },
      watch() {
        return () => {};
      }
    })
  );
  const actor = createActor(machine, {
    input: { catalogId: 'leaf-a', maxRestarts: 3, backoffMs: 20 }
  });
  actor.start();
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  const before = launches;

  // Actuator marks intentional without PARADA_SOLICITADA on leaf
  marks.add('leaf-a');
  assert.equal(
    resolveIntentionalStop({
      actuatorIntentional: true,
      contextIntentional: false
    }),
    true
  );

  actor.send({
    type: 'PROCESO_TERMINADO',
    intentionalStop: true,
    diagnosis: 'intentional_stop'
  });
  await waitValue(actor, 'parada');
  await sleep(80);
  assert.equal(launches, before, 'no auto-restart after actuator intentional');
  assert.equal(actor.getSnapshot().context.intentionalStop, true);
  actor.stop();
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitValue(actor, value, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (actor.getSnapshot().value === value) return;
    await sleep(20);
  }
  throw new Error(`timeout waiting for ${value}, got ${actor.getSnapshot().value}`);
}
