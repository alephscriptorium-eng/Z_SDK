import test from 'node:test';
import assert from 'node:assert/strict';
import { createScriptoriumServer } from '../src/index.mjs';

test('socket-server starts and serves /health', async () => {
  const server = await createScriptoriumServer({ port: 0, host: '127.0.0.1' });
  const addr = server.httpServer.address();
  const port = typeof addr === 'object' && addr ? addr.port : server.port;

  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.namespace, '/runtime');

  await server.close();
});

test('close releases port for reuse', async () => {
  const first = await createScriptoriumServer({ port: 0, host: '127.0.0.1' });
  const port = first.port;
  await first.close();

  const second = await createScriptoriumServer({ port, host: '127.0.0.1' });
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);

  await second.close();
});
