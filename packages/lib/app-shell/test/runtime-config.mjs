import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_THEME } from '@zeus/ui-kit';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { resolveRuntimeConfig } from '../src/create-app-config.mjs';

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
