/**
 * @zeus/player-debug-3d-ui server smoke — health + vendored asset routes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const { createDebug3dServer } = await import('../src/server.mjs');

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let threeAvailable = true;
try {
  require.resolve('three');
} catch {
  threeAvailable = false;
}

test('GET /health → 200 ok', async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'player-debug-3d-ui');
});

test('GET / → 200 shell with import map + viewer-config', async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /type="importmap"/);
  assert.match(html, /id="viewer-config"/);
  assert.match(html, /viewer-main\.mjs/);
});

test('GET /kit/index.mjs → 200 (raw kit source served)', async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/kit/index.mjs`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /createTrajectoryManager/);
});

test('GET /vendor/socket.io/socket.io.esm.min.js → 200', async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/socket.io/socket.io.esm.min.js`);
  assert.equal(res.status, 200);
});

test('GET /vendor/three/build/three.module.js → 200', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/three/build/three.module.js`);
  assert.equal(res.status, 200);
});

// Guards the browser dependency chain against 404s (block-02 R2 class). The
// radial scene uses markers (no GLB), but /kit/index.mjs re-exports puppet.mjs,
// so the browser still eagerly evaluates it and must be able to fetch
// GLTFLoader.js — a subtle transitive requirement of consuming the kit barrel.
test('serves the whole browser import chain (no 404s)', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createDebug3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const routes = [
    '/assets/js/viewer-main.mjs',
    '/assets/room-client/room-client.browser.mjs',
    '/kit/core/trajectory-manager.mjs',
    '/kit/core/scene-manager.mjs',
    '/vendor/three/examples/jsm/loaders/GLTFLoader.js',
    '/vendor/three/examples/jsm/controls/OrbitControls.js'
  ];

  for (const path of routes) {
    const res = await fetch(`http://localhost:${port}${path}`);
    assert.equal(res.status, 200, `expected 200 for ${path}, got ${res.status}`);
  }
});
