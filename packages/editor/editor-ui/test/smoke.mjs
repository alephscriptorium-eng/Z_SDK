/**
 * Smoke test for @zeus/editor-ui — ephemeral port, GET / and /health.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
const { createEditorServer } = await import('../src/server.mjs');

const TEST_PORT = 14012;

test('editor-ui smoke', async (t) => {
  const handle = await createEditorServer({ port: TEST_PORT });

  t.after(async () => {
    await handle.close();
  });

  const root = await fetch(`http://localhost:${TEST_PORT}/`);
  assert.equal(root.status, 200, 'GET / should return 200');
  const html = await root.text();
  assert.match(html, /World Editor|Release \(Notario\)/i);
  const health = await fetch(`http://localhost:${TEST_PORT}/health`);
  assert.equal(health.status, 200, 'GET /health should return 200');
  const body = await health.json();
  assert.equal(body.status, 'ok');
});
