import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';

import { createMcpHttpStart } from '../src/index.mjs';

function fakeMcpServer() {
  return { close: async () => {} };
}

test('createMcpHttpStart', async (t) => {
  await t.test('resolves with the bound port/url on a free port', async () => {
    const app = express();
    const start = createMcpHttpStart(app, { name: 'test-server', port: 0, mcpServer: fakeMcpServer() });

    const handle = await start();
    try {
      assert.equal(handle.name, 'test-server');
      assert.equal(typeof handle.port, 'number');
      assert.ok(handle.port > 0);
      assert.equal(handle.url, `http://localhost:${handle.port}/mcp`);
      assert.equal(typeof handle.close, 'function');
    } finally {
      await handle.close();
    }
  });

  await t.test('rejects cleanly (no crash) when the port is already in use', async () => {
    // Bind the decoy on the wildcard host, exactly as real zeus services do via
    // `app.listen(port)`. On Windows a wildcard bind does NOT collide with a
    // 127.0.0.1-only bind, so a loopback decoy would let the second listen
    // succeed and the assertion below would (wrongly) see a resolution.
    const decoy = http.createServer();
    await new Promise((resolve, reject) => {
      decoy.listen(0, resolve);
      decoy.on('error', reject);
    });
    const takenPort = decoy.address().port;

    // If start() ever resolves (e.g. platform without collision), capture the
    // handle so we can close it in `finally` — a leaked server would keep the
    // event loop alive and hang the test runner to its timeout.
    let leaked;
    try {
      const app = express();
      const start = createMcpHttpStart(app, {
        name: 'colliding-server',
        port: takenPort,
        mcpServer: fakeMcpServer()
      });

      await assert.rejects(
        async () => {
          leaked = await start();
        },
        (err) => {
          assert.equal(err.code, 'EADDRINUSE');
          return true;
        }
      );
    } finally {
      if (leaked) await leaked.close();
      await new Promise((resolve) => decoy.close(resolve));
    }
  });
});
