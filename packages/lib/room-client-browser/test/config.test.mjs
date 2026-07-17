import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  browserAssetsDir,
  resolveRoomClientConfig,
  DEV_ROOM_CLIENT_CONFIG,
  DEFAULT_ZEUS_UI_MESH,
  resolveZeusUiPorts
} from '../src/index.mjs';

test('browserAssetsDir points at the package browser/ folder', () => {
  assert.ok(fs.existsSync(browserAssetsDir));
  assert.ok(
    fs.existsSync(path.join(browserAssetsDir, 'room-client.browser.mjs')),
    'browserAssetsDir must contain room-client.browser.mjs'
  );
});

test('DEV_ROOM_CLIENT_CONFIG mirrors localhost scriptorium defaults', () => {
  assert.equal(DEV_ROOM_CLIENT_CONFIG.scriptoriumUrl, 'http://localhost:3017/runtime');
  assert.equal(DEV_ROOM_CLIENT_CONFIG.room, 'scriptorium.default');
  assert.equal(DEV_ROOM_CLIENT_CONFIG.sessionId, 'default');
  assert.equal(DEV_ROOM_CLIENT_CONFIG.token, 'dev-secret');
});

test('resolveRoomClientConfig derives room and url from session + UI mesh', () => {
  const prevSession = process.env.ZEUS_SCRIPTORIUM_SESSION;
  const prevSecret = process.env.ZEUS_SCRIPTORIUM_SECRET;
  const prevPort = process.env.ZEUS_PORT_SCRIPTORIUM;

  try {
    delete process.env.ZEUS_SCRIPTORIUM_SESSION;
    delete process.env.ZEUS_SCRIPTORIUM_SECRET;
    delete process.env.ZEUS_PORT_SCRIPTORIUM;

    const cfg = resolveRoomClientConfig({ sessionId: 'demo-42' });
    assert.equal(cfg.sessionId, 'demo-42');
    assert.equal(cfg.room, 'scriptorium.demo-42');
    assert.equal(cfg.token, 'dev-secret');
    assert.match(cfg.scriptoriumUrl, /^http:\/\/localhost:\d+\/runtime$/);

    process.env.ZEUS_SCRIPTORIUM_SECRET = 'tok-from-env';
    const cfg2 = resolveRoomClientConfig({});
    assert.equal(cfg2.sessionId, 'default');
    assert.equal(cfg2.room, 'scriptorium.default');
    assert.equal(cfg2.token, 'tok-from-env');
  } finally {
    if (prevSession == null) delete process.env.ZEUS_SCRIPTORIUM_SESSION;
    else process.env.ZEUS_SCRIPTORIUM_SESSION = prevSession;
    if (prevSecret == null) delete process.env.ZEUS_SCRIPTORIUM_SECRET;
    else process.env.ZEUS_SCRIPTORIUM_SECRET = prevSecret;
    if (prevPort == null) delete process.env.ZEUS_PORT_SCRIPTORIUM;
    else process.env.ZEUS_PORT_SCRIPTORIUM = prevPort;
  }
});

test('resolveZeusUiPorts re-export returns scriptorium slot', () => {
  const uis = resolveZeusUiPorts();
  assert.ok(uis.scriptorium);
  assert.equal(typeof uis.scriptorium.port, 'number');
  assert.ok(uis.scriptorium.path);
});

test('DEFAULT_ZEUS_UI_MESH re-export includes scriptorium defaults', () => {
  assert.ok(DEFAULT_ZEUS_UI_MESH.scriptorium);
  assert.equal(DEFAULT_ZEUS_UI_MESH.scriptorium.host, 'localhost');
  assert.equal(DEFAULT_ZEUS_UI_MESH.scriptorium.port, 3017);
});
