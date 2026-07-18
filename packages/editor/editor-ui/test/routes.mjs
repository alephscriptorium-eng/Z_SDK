/**
 * Route coverage for @zeus/editor-ui — world draft + cloak API.
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
const LIBRARY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../../../Z_SDK-games-library-u70'
);

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

test('editor world + cloak routes', async (t) => {
  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ZEUS_PORT_EDITOR: String(TEST_PORT),
      ZEUS_GAMES_LIBRARY_ROOT: LIBRARY_ROOT
    },
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

  const home = await fetch(`http://localhost:${TEST_PORT}/`);
  assert.equal(home.status, 200, 'GET / should return 200');
  assert.match(await home.text(), /World Editor|gamemap|Release/i);

  const cloaksPage = await fetch(`http://localhost:${TEST_PORT}/cloaks`);
  assert.equal(cloaksPage.status, 200, 'GET /cloaks should return 200');

  const draftRes = await fetch(`http://localhost:${TEST_PORT}/api/world/draft`);
  assert.equal(draftRes.status, 200);
  const draftBody = await draftRes.json();
  assert.equal(draftBody.success, true);
  assert.equal(draftBody.draft.gameId, 'sketch');

  const putRes = await fetch(`http://localhost:${TEST_PORT}/api/world/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...draftBody.draft,
      labelset: ['norte', 'sur']
    })
  });
  assert.equal(putRes.status, 200);
  const putBody = await putRes.json();
  assert.deepEqual(putBody.draft.labelset, ['norte', 'sur']);

  // Cloak API still available (presets under the hood)
  const listRes = await fetch(`http://localhost:${TEST_PORT}/api/presets`);
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  assert.equal(listBody.success, true);
  assert.ok(Array.isArray(listBody.presets));
});

test('editor world release produces installable tarball', async (t) => {
  const { createEditorServer } = await import('../src/server.mjs');
  const prev = process.env.ZEUS_GAMES_LIBRARY_ROOT;
  process.env.ZEUS_GAMES_LIBRARY_ROOT = LIBRARY_ROOT;

  const handle = await createEditorServer({ port: 0, host: '127.0.0.1' });
  t.after(async () => {
    await handle.close();
    if (prev === undefined) delete process.env.ZEUS_GAMES_LIBRARY_ROOT;
    else process.env.ZEUS_GAMES_LIBRARY_ROOT = prev;
  });

  const res = await fetch(`${handle.url}/api/world/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skipTests: true })
  });
  const body = await res.json();
  assert.equal(res.status, 200, body.error || JSON.stringify(body));
  assert.equal(body.success, true);
  assert.ok(body.tarball, 'tarball path expected');
  assert.match(body.tarball.replace(/\\/g, '/'), /zeus-startpack-sketch-.*\.tgz$/);
});
