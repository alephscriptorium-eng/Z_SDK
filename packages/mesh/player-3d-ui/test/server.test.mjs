/**
 * @zeus/player-3d-ui server smoke — health + vendored asset routes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const { createPlayer3dServer } = await import('../src/server.mjs');

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let threeAvailable = true;
try {
  require.resolve('three');
} catch {
  threeAvailable = false;
}

test('GET /health → 200 ok', async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'player-3d-ui');
});

test('GET / → 200 shell with import map + viewer-config', async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /type="importmap"/);
  assert.match(html, /id="viewer-config"/);
  assert.match(html, /viewer-main\.mjs/);
});

test('GET /kit/index.mjs → 200 (raw ui-3d-kit source served)', async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/kit/index.mjs`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /createSceneManager/);
});

test('GET /view-kit/index.mjs → 200 (raw @zeus/view-kit served)', async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/view-kit/index.mjs`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /createViewerScene/);
});

test('GET /vendor/socket.io/socket.io.esm.min.js → 200', async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/socket.io/socket.io.esm.min.js`);
  assert.equal(res.status, 200);
});

test('GET /vendor/three/build/three.module.js → 200', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/three/build/three.module.js`);
  assert.equal(res.status, 200);
});

// Guards the full browser dependency chain against 404s (block-02 R2 class):
// every module/asset the browser actually requests must be served. The
// three/addons/* files (GLTFLoader/OrbitControls) and /models/*.glb ride on
// separate express.static mounts than three.module.js, so they are the
// fragile ones — the kit's puppet.mjs imports GLTFLoader, scene-manager
// imports OrbitControls, and puppets load the GLBs.
test('serves the whole browser import+asset chain (no 404s)', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createPlayer3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const routes = [
    '/assets/js/viewer-main.mjs',
    '/assets/js/event-choreographer.mjs',
    '/assets/room-client/room-client.browser.mjs',
    '/view-kit/index.mjs',
    '/view-kit/scene.mjs',
    '/view-kit/hud.mjs',
    '/view-kit/room.mjs',
    '/kit/puppet/puppet.mjs',
    '/kit/core/scene-manager.mjs',
    '/kit/engine/walk-driver.mjs',
    '/vendor/three/examples/jsm/loaders/GLTFLoader.js',
    '/vendor/three/examples/jsm/controls/OrbitControls.js',
    '/models/SK_Alephillo.glb',
    '/models/Xbot.glb',
    '/models/RobotExpressive.glb'
  ];

  for (const path of routes) {
    const res = await fetch(`http://localhost:${port}${path}`);
    assert.equal(res.status, 200, `expected 200 for ${path}, got ${res.status}`);
  }
});
