/**
 * Smoke test for @zeus/firehose-browser — tolerates empty VOLUMES firehose.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
const { createFirehoseServer } = await import('../src/server.mjs');

const TEST_PORT = 14016;

test('firehose-browser smoke', async (t) => {
  const handle = await createFirehoseServer({ port: TEST_PORT });

  t.after(async () => {
    await handle.close();
  });

  const root = await fetch(`http://localhost:${TEST_PORT}/`);
  assert.equal(root.status, 200, 'GET / should return 200');
  const health = await fetch(`http://localhost:${TEST_PORT}/health`);
  assert.equal(health.status, 200, 'GET /health should return 200');
  const body = await health.json();
  assert.equal(body.status, 'ok');
});
