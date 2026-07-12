import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  readEnvPort,
  resolveZeusHost,
  resolvePlayerUiBaseUrl,
  loadZeusEnv,
  resetZeusEnvLoader
} from '../src/env/index.mjs';

test('canonical env resolution', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-env-canonical-'));
  const prev = {
    host: process.env.ZEUS_HOST,
    playerPort: process.env.ZEUS_PORT_PLAYER,
    legacyHost: process.env.FIREHOSE_MCP_HOST,
    legacyPort: process.env.FIREHOSE_MCP_PORT
  };

  resetZeusEnvLoader();
  loadZeusEnv(tempRoot);

  try {
    delete process.env.ZEUS_HOST;
    delete process.env.ZEUS_PORT_PLAYER;
    delete process.env.FIREHOSE_MCP_HOST;
    delete process.env.FIREHOSE_MCP_PORT;

    assert.equal(resolveZeusHost('fallback-host'), 'fallback-host');
    assert.equal(readEnvPort('ZEUS_MCP_SUN', 4101), 4101);

    process.env.FIREHOSE_MCP_HOST = 'legacy-host';
    process.env.FIREHOSE_MCP_PORT = '5999';
    assert.equal(resolveZeusHost('fallback-host'), 'fallback-host');
    assert.equal(readEnvPort('ZEUS_MCP_SUN', 4101), 4101);

    process.env.ZEUS_HOST = 'canonical-host';
    process.env.ZEUS_PORT_PLAYER = '3013';
    assert.equal(resolveZeusHost('fallback-host'), 'canonical-host');
    assert.equal(resolvePlayerUiBaseUrl(), 'http://canonical-host:3013');
  } finally {
    if (prev.host == null) delete process.env.ZEUS_HOST;
    else process.env.ZEUS_HOST = prev.host;
    if (prev.playerPort == null) delete process.env.ZEUS_PORT_PLAYER;
    else process.env.ZEUS_PORT_PLAYER = prev.playerPort;
    if (prev.legacyHost == null) delete process.env.FIREHOSE_MCP_HOST;
    else process.env.FIREHOSE_MCP_HOST = prev.legacyHost;
    if (prev.legacyPort == null) delete process.env.FIREHOSE_MCP_PORT;
    else process.env.FIREHOSE_MCP_PORT = prev.legacyPort;

    resetZeusEnvLoader();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
