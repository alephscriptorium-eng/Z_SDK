import test from 'node:test';
import assert from 'node:assert/strict';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import { zeusOpenApiServers, readPackageVersion } from '../src/endpoint.mjs';

test('zeusOpenApiServers uses defaults without env overrides', () => {
  const prev = {
    host: process.env.ZEUS_HOST,
    playerPort: process.env.ZEUS_PORT_PLAYER
  };
  resetZeusEnvLoader();
  try {
    delete process.env.ZEUS_HOST;
    delete process.env.ZEUS_PORT_PLAYER;

    const servers = zeusOpenApiServers('player');
    assert.equal(servers.length, 1);
    assert.equal(servers[0].url, 'http://localhost:3013');
    assert.equal(servers[0].description, 'player-ui default');
  } finally {
    if (prev.host == null) delete process.env.ZEUS_HOST;
    else process.env.ZEUS_HOST = prev.host;
    if (prev.playerPort == null) delete process.env.ZEUS_PORT_PLAYER;
    else process.env.ZEUS_PORT_PLAYER = prev.playerPort;
    resetZeusEnvLoader();
  }
});

test('zeusOpenApiServers respects ZEUS_PORT_PLAYER override', () => {
  const prev = {
    host: process.env.ZEUS_HOST,
    playerPort: process.env.ZEUS_PORT_PLAYER
  };
  resetZeusEnvLoader();
  try {
    process.env.ZEUS_HOST = 'zeus.test';
    process.env.ZEUS_PORT_PLAYER = '3999';

    const servers = zeusOpenApiServers('player');
    assert.equal(servers[0].url, 'http://zeus.test:3999');
  } finally {
    if (prev.host == null) delete process.env.ZEUS_HOST;
    else process.env.ZEUS_HOST = prev.host;
    if (prev.playerPort == null) delete process.env.ZEUS_PORT_PLAYER;
    else process.env.ZEUS_PORT_PLAYER = prev.playerPort;
    resetZeusEnvLoader();
  }
});

test('readPackageVersion reads http-contract package.json', () => {
  assert.equal(readPackageVersion(import.meta.url), '0.1.0');
});
