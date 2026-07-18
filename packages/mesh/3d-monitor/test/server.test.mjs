/**
 * @zeus/3d-monitor server smoke — health + portal + views + vendored asset routes.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const { createMonitor3dServer } = await import('../src/server.mjs');

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let threeAvailable = true;
try {
  require.resolve('three');
} catch {
  threeAvailable = false;
}

test('GET /health → 200 ok with registered views', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, '3d-monitor');
  assert.deepEqual(body.views, ['default', 'ecosystem', 'flux', 'gamemap', 'bots-log']);
});

test('GET / → 200 portal with one card per registered view', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /portal-grid/);
  assert.match(html, /href="\/views\/default"/);
  assert.match(html, /href="\/views\/ecosystem"/);
  assert.match(html, /href="\/views\/flux"/);
  assert.match(html, /href="\/views\/gamemap"/);
  assert.match(html, /href="\/views\/bots-log"/);
});

for (const [id, entry] of [
  ['default', 'default.mjs'],
  ['ecosystem', 'ecosystem.mjs'],
  ['flux', 'flux.mjs'],
  ['gamemap', 'gamemap.mjs'],
  ['bots-log', 'bots-log.mjs']
]) {
  test(`GET /views/${id} → 200 shell with import map + viewer-config + entry`, async (t) => {
    const handle = await createMonitor3dServer({ port: 0 });
    t.after(() => handle.close());
    const { port } = handle;

    const res = await fetch(`http://localhost:${port}/views/${id}`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /type="importmap"/);
    assert.match(html, /id="viewer-config"/);
    assert.ok(html.includes(`/assets/js/views/${entry}`), `view ${id} missing entry ${entry}`);
    assert.ok(html.includes(`&quot;view&quot;:&quot;${id}&quot;`) || html.includes(`"view":"${id}"`),
      `view ${id} missing view id in injected config`);
  });
}

test('gamemap room resolution: fallback PUBLIC_ROOM < env < ?room=', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const priorEnv = {
    room: process.env.ZEUS_SCRIPTORIUM_ROOM,
    argRoom: process.env.ZEUS_ARG_ROOM
  };
  t.after(() => {
    if (priorEnv.room === undefined) delete process.env.ZEUS_SCRIPTORIUM_ROOM;
    else process.env.ZEUS_SCRIPTORIUM_ROOM = priorEnv.room;
    if (priorEnv.argRoom === undefined) delete process.env.ZEUS_ARG_ROOM;
    else process.env.ZEUS_ARG_ROOM = priorEnv.argRoom;
  });

  // Explicit clean env — no host leakage into room precedence.
  delete process.env.ZEUS_SCRIPTORIUM_ROOM;
  delete process.env.ZEUS_ARG_ROOM;

  const byDefault = await (await fetch(`http://localhost:${port}/views/gamemap`)).text();
  assert.ok(byDefault.includes('PUBLIC_ROOM'), 'without env, gamemap follows the demo default (PUBLIC_ROOM)');

  process.env.ZEUS_SCRIPTORIUM_ROOM = 'scriptorium.env-room';
  const byEnv = await (await fetch(`http://localhost:${port}/views/gamemap`)).text();
  assert.ok(byEnv.includes('scriptorium.env-room'), 'ZEUS_SCRIPTORIUM_ROOM must beat the view fallback');

  const overridden = await (await fetch(`http://localhost:${port}/views/gamemap?room=custom.room`)).text();
  assert.ok(overridden.includes('custom.room'), '?room= must beat everything');
});

test('GET /views/nope → 404', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/views/nope`);
  assert.equal(res.status, 404);
});

test('bots-log view renders the DOM log panel', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/views/bots-log`);
  const html = await res.text();
  assert.match(html, /id="view-log"/);
});

test('GET /kit/index.mjs → 200 (raw ui-3d-kit source served)', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/kit/index.mjs`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /createTrajectoryManager/);
});

test('GET /view-kit/index.mjs → 200 (raw @zeus/view-kit served)', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/view-kit/index.mjs`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /createViewerScene/);
});

test('GET /vendor/socket.io/socket.io.esm.min.js → 200', async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/socket.io/socket.io.esm.min.js`);
  assert.equal(res.status, 200);
});

test('GET /vendor/three/build/three.module.js → 200', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const res = await fetch(`http://localhost:${port}/vendor/three/build/three.module.js`);
  assert.equal(res.status, 200);
});

// Guards the browser dependency chain against 404s (block-02 R2 class). The
// views use markers (no GLB), but /kit/index.mjs re-exports puppet.mjs, so the
// browser still eagerly evaluates it and must be able to fetch GLTFLoader.js —
// a subtle transitive requirement of consuming the kit barrel.
test('serves the whole browser import chain (no 404s)', { skip: threeAvailable ? false : 'three not installed (run npm install)' }, async (t) => {
  const handle = await createMonitor3dServer({ port: 0 });
  t.after(() => handle.close());
  const { port } = handle;

  const routes = [
    '/view-kit/index.mjs',
    '/view-kit/scene.mjs',
    '/view-kit/hud.mjs',
    '/view-kit/room.mjs',
    '/view-kit/channel-events.mjs',
    '/view-kit/labels.mjs',
    '/view-kit/log-panel.mjs',
    '/assets/js/monitor/index.mjs',
    '/assets/js/monitor/channels.mjs',
    '/assets/js/monitor/ring-layout.mjs',
    '/assets/js/monitor/markers.mjs',
    '/assets/js/monitor/pipes.mjs',
    '/assets/js/views/default.mjs',
    '/assets/js/views/ecosystem.mjs',
    '/assets/js/views/flux.mjs',
    '/assets/js/views/gamemap.mjs',
    '/assets/js/views/bots-log.mjs',
    '/models/SK_Alephillo.glb',
    '/assets/room-client/room-client.browser.mjs',
    '/assets/room-client/dev-room-config.mjs',
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
