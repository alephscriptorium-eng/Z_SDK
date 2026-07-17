/**
 * Smoke test for @zeus/player-ui — DJ vista, GET / and /health.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
import { startPlayerDjStack } from './helpers.mjs';

const { createPlayerServer } = await import('../src/server.mjs');

test('player-ui smoke (dj)', async (t) => {
  const stack = await startPlayerDjStack(createPlayerServer, { playerPort: 0 });

  t.after(async () => {
    await stack.close();
  });

  const base = `http://localhost:${stack.player.port}`;
  const root = await fetch(`${base}/`);
  assert.equal(root.status, 200, 'GET / should return 200');
  const html = await root.text();
  assert.match(html, /dj-config|dj ·/, 'deck shell marks DJ role');

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200, 'GET /health should return 200');
  const body = await health.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.role, 'dj');
  assert.equal(body.room, stack.room);
});
