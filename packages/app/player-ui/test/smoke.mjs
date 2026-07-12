/**
 * Smoke test for @zeus/player-ui — ephemeral port, GET / and /health.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
import { startPlayerRoomStack } from './helpers.mjs';

const { createPlayerServer } = await import('../src/server.mjs');

test('player-ui smoke', async (t) => {
  const stack = await startPlayerRoomStack(createPlayerServer, { playerPort: 0 });

  t.after(async () => {
    await stack.close();
  });

  const base = `http://localhost:${stack.player.port}`;
  const root = await fetch(`${base}/`);
  assert.equal(root.status, 200, 'GET / should return 200');
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200, 'GET /health should return 200');
  const body = await health.json();
  assert.equal(body.status, 'ok');
});
