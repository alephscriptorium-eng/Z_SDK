import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveIceServers,
  GOOGLE_STUN_URLS,
  resetZeusEnvLoader,
  loadZeusEnv
} from '../src/env/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function withEnv(patch, fn) {
  const keys = Object.keys(patch);
  const prev = {};
  for (const k of keys) {
    prev[k] = process.env[k];
    if (patch[k] == null) delete process.env[k];
    else process.env[k] = patch[k];
  }
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (prev[k] == null) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
}

test('resolveIceServers: empty env → no Google, host-only', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-ice-'));
  resetZeusEnvLoader();
  loadZeusEnv(tempRoot);
  try {
    withEnv(
      {
        ZEUS_WEBRTC_STUN: null,
        ZEUS_WEBRTC_TURN: null,
        ZEUS_WEBRTC_TURN_URL: null,
        ZEUS_WEBRTC_ALLOW_GOOGLE_STUN: null
      },
      () => {
        const servers = resolveIceServers(process.env, { warn: () => {} });
        assert.deepEqual(servers, []);
        const blob = JSON.stringify(servers);
        assert.equal(blob.includes('google'), false);
      }
    );
  } finally {
    resetZeusEnvLoader();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('resolveIceServers: STUN + TURN from env', () => {
  withEnv(
    {
      ZEUS_WEBRTC_STUN: 'stun:coturn.example:3478',
      ZEUS_WEBRTC_TURN_URL: 'turn:coturn.example:3478',
      ZEUS_WEBRTC_TURN_USER: 'u',
      ZEUS_WEBRTC_TURN_PASS: 'p',
      ZEUS_WEBRTC_ALLOW_GOOGLE_STUN: '0'
    },
    () => {
      const servers = resolveIceServers(process.env, { warn: () => {} });
      assert.equal(servers.length, 2);
      assert.deepEqual(servers[0], { urls: 'stun:coturn.example:3478' });
      assert.deepEqual(servers[1], {
        urls: 'turn:coturn.example:3478',
        username: 'u',
        credential: 'p'
      });
    }
  );
});

test('resolveIceServers: Google only with flag + WARNING', () => {
  const warnings = [];
  withEnv(
    {
      ZEUS_WEBRTC_STUN: null,
      ZEUS_WEBRTC_TURN_URL: null,
      ZEUS_WEBRTC_ALLOW_GOOGLE_STUN: '1'
    },
    () => {
      const servers = resolveIceServers(process.env, {
        warn: (m) => warnings.push(m)
      });
      assert.ok(warnings.length >= 1);
      assert.match(warnings[0], /ZEUS_WEBRTC_ALLOW_GOOGLE_STUN=1/);
      assert.match(warnings[0], /NEVER enable this in\s+production/i);
      assert.equal(servers.length, GOOGLE_STUN_URLS.length);
      assert.equal(servers[0].urls, GOOGLE_STUN_URLS[0]);
    }
  );
});
