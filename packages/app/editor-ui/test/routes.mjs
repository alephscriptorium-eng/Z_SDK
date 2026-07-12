/**
 * Route coverage for @zeus/editor-ui — presets library API.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_PORT = 14022;
const serverPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/server.mjs');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(port, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`http://localhost:${port}/health`);
      if (res.status === 200) return;
    } catch {
      // server still starting
    }
    await sleep(250);
  }
  throw new Error(`editor-ui routes test: server not ready on port ${port}`);
}

test('editor presets routes', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, ZEUS_PORT_EDITOR: String(TEST_PORT) },
    stdio: 'pipe'
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  t.after(async () => {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      child.on('exit', resolve);
      setTimeout(resolve, 3000);
    });
  });

  await waitForServer(TEST_PORT);

  const presetsPage = await fetch(`http://localhost:${TEST_PORT}/presets`);
  assert.equal(presetsPage.status, 200, 'GET /presets should return 200');
  assert.match(await presetsPage.text(), /preset/i, 'GET /presets should render preset library');

  const listRes = await fetch(`http://localhost:${TEST_PORT}/api/presets`);
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.equal(listBody.success, true);
  assert.ok(Array.isArray(listBody.presets));

  const presetName = `zs-c5-editor-${Date.now()}`;
  const createRes = await fetch(`http://localhost:${TEST_PORT}/api/presets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: presetName,
      description: 'ZS-C.5 route coverage dummy',
      items: []
    })
  });
  assert.equal(createRes.status, 201, 'POST /api/presets returns 201 Created');
  const created = await createRes.json();
  assert.equal(created.success, true);
  assert.equal(created.preset.name, presetName);

  const deleteRes = await fetch(`http://localhost:${TEST_PORT}/api/presets/${created.preset.id}`, {
    method: 'DELETE'
  });
  assert.equal(deleteRes.status, 200);
});
