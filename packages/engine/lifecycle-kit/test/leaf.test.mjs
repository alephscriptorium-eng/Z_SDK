/**
 * Unit tests — closed transition table + leaf supervision (no real spawn).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createActor, fromPromise, fromCallback } from 'xstate';
import {
  leafMachine,
  provideLeafActors,
  LEAF_STATES,
  LEAF_TRANSITIONS,
  projectAggregateLife,
  createAggregateController
} from '../src/index.mjs';

test('tabla cerrada: todos los estados listados', () => {
  assert.deepEqual(
    [...LEAF_STATES].sort(),
    ['arrancando', 'degradada', 'parada', 'parando', 'rota', 'viva'].sort()
  );
  for (const row of LEAF_TRANSITIONS) {
    for (const from of row.from) assert.ok(LEAF_STATES.includes(from));
    assert.ok(LEAF_STATES.includes(row.to));
  }
});

test('anti-legacy surface: setup+createActor path (no interpret/Machine)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
  let blob = '';
  for (const f of fs.readdirSync(root)) {
    if (f.endsWith('.mjs')) blob += fs.readFileSync(path.join(root, f), 'utf8');
  }
  assert.equal((blob.match(/\binterpret\s*\(/g) || []).length, 0);
  assert.equal((blob.match(/\bMachine\s*\(/g) || []).length, 0);
  // createMachine only via setup().createMachine
  assert.ok(blob.includes('setup('));
  assert.ok(blob.includes('.createMachine('));
  assert.equal((blob.match(/(?<!\.)\bcreateMachine\s*\(/g) || []).length, 0);
});

test('ceguera kit: sin ciudad/barrio/marco en src', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
  let blob = '';
  for (const f of fs.readdirSync(root)) {
    if (f.endsWith('.mjs')) blob += fs.readFileSync(path.join(root, f), 'utf8');
  }
  assert.equal((blob.match(/\bciudad\b/gi) || []).length, 0);
  assert.equal((blob.match(/\bbarrio\b/gi) || []).length, 0);
  assert.equal((blob.match(/\bmarco\b/gi) || []).length, 0);
});

function mockLeaf(opts = {}) {
  let launches = 0;
  let stops = 0;
  const failTimes = opts.failTimes ?? 0;
  const machine = leafMachine.provide(
    provideLeafActors({
      catalogId: 'leaf-a',
      maxRestarts: opts.maxRestarts ?? 3,
      autoRestart: opts.autoRestart !== false,
      backoffMs: opts.backoffMs ?? 30,
      async launch() {
        launches += 1;
        if (launches <= failTimes) {
          throw new Error('boom');
        }
        return { identity: { pid: 42 + launches }, ok: true };
      },
      async stop() {
        stops += 1;
        return { ok: true };
      },
      watch(_input, sendBack) {
        const t = setInterval(() => {
          if (opts.failHealthAfterLive && launches > failTimes) {
            sendBack({ type: 'SALUD_FALLIDA', diagnosis: 'probe_down' });
          }
        }, 20);
        return () => clearInterval(t);
      }
    })
  );
  const actor = createActor(machine, {
    input: { catalogId: 'leaf-a', maxRestarts: opts.maxRestarts ?? 3, backoffMs: 30 }
  });
  actor.start();
  return {
    actor,
    get launches() {
      return launches;
    },
    get stops() {
      return stops;
    }
  };
}

test('arranque feliz: parada → viva', async () => {
  const { actor } = mockLeaf();
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  assert.equal(actor.getSnapshot().context.healthIdentity.pid, 43);
  actor.stop();
});

test('parada intencional: viva → parando → parada sin reintento', async () => {
  const { actor, launches } = mockLeaf();
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  const before = launches;
  actor.send({ type: 'PARADA_SOLICITADA' });
  await waitValue(actor, 'parada');
  await sleep(80);
  assert.equal(launches, before);
  assert.equal(actor.getSnapshot().context.intentionalStop, true);
  actor.stop();
});

test('adopción: ARRANQUE sobre viva permanece viva', async () => {
  const { actor } = mockLeaf();
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  actor.send({ type: 'ARRANQUE_SOLICITADO', identity: { pid: 99 } });
  assert.equal(actor.getSnapshot().value, 'viva');
  assert.equal(actor.getSnapshot().context.healthIdentity.pid, 99);
  actor.stop();
});

test('supervisión: SALUD_FALLIDA → degradada → reintento → viva', async () => {
  const { actor } = mockLeaf({ failTimes: 0, backoffMs: 40 });
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  actor.send({ type: 'SALUD_FALLIDA', diagnosis: 'killed' });
  await waitValue(actor, 'degradada');
  await waitValue(actor, 'viva', 5_000);
  actor.stop();
});

test('degradación diagnosticada (dependencia)', async () => {
  const { actor } = mockLeaf({ autoRestart: false });
  actor.send({ type: 'ARRANQUE_SOLICITADO' });
  await waitValue(actor, 'viva');
  actor.send({
    type: 'DEPENDENCIA_FALLIDA',
    diagnosis: 'backend_no_responde'
  });
  await waitValue(actor, 'degradada');
  assert.equal(actor.getSnapshot().context.diagnosis, 'backend_no_responde');
  assert.notEqual(actor.getSnapshot().value, 'parada');
  actor.stop();
});

test('rollup aggregate: 1 hoja viva → vivo', async () => {
  assert.equal(projectAggregateLife(['viva']), 'vivo');
  assert.equal(projectAggregateLife(['parada']), 'latente');
  assert.equal(projectAggregateLife(['rota']), 'roto');
});

test('aggregate controller start/stop', async () => {
  let live = false;
  const ctrl = createAggregateController([
    {
      catalogId: 'sm',
      backoffMs: 20,
      async launch() {
        live = true;
        return { identity: { pid: 1 } };
      },
      async stop() {
        live = false;
        return { ok: true };
      }
    }
  ]);
  ctrl.send('sm', { type: 'ARRANQUE_SOLICITADO' });
  await ctrl.waitFor((c) => c.rollup() === 'vivo');
  assert.equal(live, true);
  ctrl.send('sm', { type: 'PARADA_SOLICITADA' });
  await ctrl.waitFor((c) => c.rollup() === 'latente');
  ctrl.stop();
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
