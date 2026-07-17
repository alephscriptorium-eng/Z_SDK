import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_THEME } from '@zeus/ui-kit';
import { resetZeusEnvLoader, DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';
import { createAppConfig, resolveRuntimeConfig } from '../src/create-app-config.mjs';

test('runtime config resolves env overrides', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-shell-runtime-'));
  const configPath = path.join(tempDir, 'config.json');

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        theme: { current: DEFAULT_THEME },
        server: { port: 3012, host: 'localhost' },
        discovery: { urls: ['http://localhost:4101'], timeoutMs: 2000 },
        presets: { dataDir: '../../../data' }
      },
      null,
      2
    )
  );

  const prevPort = process.env.ZEUS_PORT_EDITOR;
  process.env.ZEUS_PORT_EDITOR = '4012';

  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const runtime = resolveRuntimeConfig(fileConfig, {
      appId: 'editor',
      packageDir: tempDir,
      appBase: { port: 3012, presets: { dataDir: '../../../data' } },
      defaultPort: 3012
    });

    assert.equal(runtime.server.port, 4012, '.env port overrides stale config.json');
    assert.ok(runtime.discovery.urls.length > 1, 'discovery URLs derived from env defaults');
    assert.ok(
      !runtime.discovery.urls.every((u) => u === 'http://localhost:4101'),
      'stale discovery.urls replaced'
    );
  } finally {
    if (prevPort == null) delete process.env.ZEUS_PORT_EDITOR;
    else process.env.ZEUS_PORT_EDITOR = prevPort;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('runtime config resolves debugMonitor baseUrl from env', () => {
  const prev = process.env.ZEUS_PORT_PLAYER_DEBUG;
  resetZeusEnvLoader();
  process.env.ZEUS_PORT_PLAYER_DEBUG = '4014';

  try {
    const runtime = resolveRuntimeConfig(
      { debugMonitor: { enabled: true } },
      {
        appId: 'player',
        packageDir: process.cwd(),
        appBase: { debugMonitor: { enabled: true } },
        defaultPort: 3013
      }
    );

    assert.equal(runtime.debugMonitor.baseUrl, 'http://localhost:4014');
  } finally {
    if (prev == null) delete process.env.ZEUS_PORT_PLAYER_DEBUG;
    else process.env.ZEUS_PORT_PLAYER_DEBUG = prev;
    resetZeusEnvLoader();
  }
});

test('argConsole resolves port + scriptorium from mesh/env', () => {
  const prevPort = process.env.ZEUS_PORT_ARG_CONSOLE;
  const prevScr = process.env.ZEUS_PORT_SCRIPTORIUM;
  const prevSecret = process.env.ZEUS_SCRIPTORIUM_SECRET;
  resetZeusEnvLoader();
  process.env.ZEUS_PORT_ARG_CONSOLE = '4121';
  process.env.ZEUS_PORT_SCRIPTORIUM = '4117';
  process.env.ZEUS_SCRIPTORIUM_SECRET = 'test-secret';

  try {
    const runtime = resolveRuntimeConfig(
      { scriptorium: { path: '/runtime' } },
      {
        appId: 'argConsole',
        packageDir: process.cwd(),
        appBase: {
          port: DEFAULT_ZEUS_UI_MESH.argConsole.port,
          scriptorium: { path: '/runtime' }
        },
        defaultPort: DEFAULT_ZEUS_UI_MESH.argConsole.port
      }
    );

    assert.equal(runtime.server.port, 4121);
    assert.equal(runtime.scriptorium.port, 4117);
    assert.equal(runtime.scriptorium.path, '/runtime');
    assert.equal(runtime.scriptorium.secret, 'test-secret');
    assert.ok(runtime.scriptorium.host);
  } finally {
    if (prevPort == null) delete process.env.ZEUS_PORT_ARG_CONSOLE;
    else process.env.ZEUS_PORT_ARG_CONSOLE = prevPort;
    if (prevScr == null) delete process.env.ZEUS_PORT_SCRIPTORIUM;
    else process.env.ZEUS_PORT_SCRIPTORIUM = prevScr;
    if (prevSecret == null) delete process.env.ZEUS_SCRIPTORIUM_SECRET;
    else process.env.ZEUS_SCRIPTORIUM_SECRET = prevSecret;
    resetZeusEnvLoader();
  }
});

test('unknown appId works with extraDefaults (no APP_DEFAULTS whitelist)', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-shell-custom-'));
  const srcDir = path.join(tempDir, 'src');
  fs.mkdirSync(srcDir);
  const configUrl = pathToFileURL(path.join(srcDir, 'config.mjs')).href;
  resetZeusEnvLoader();

  try {
    const { getConfig, packageDir } = createAppConfig({
      appId: 'customGameUi',
      defaultPort: 3999,
      importMetaUrl: configUrl,
      skipConfigFile: true,
      extraDefaults: {
        branding: { title: 'Custom Game', tag: 'test' },
        scriptorium: { path: '/runtime' }
      }
    });

    assert.equal(packageDir, tempDir);
    const cfg = getConfig();
    assert.equal(cfg.server.port, 3999);
    assert.equal(cfg.branding.title, 'Custom Game');
    assert.equal(cfg.scriptorium.path, '/runtime');
    assert.ok(cfg.scriptorium.port);
    assert.ok(cfg.scriptorium.secret);
  } finally {
    resetZeusEnvLoader();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
