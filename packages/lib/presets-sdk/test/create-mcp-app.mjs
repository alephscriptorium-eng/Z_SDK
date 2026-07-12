import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createMcpApp, mountHealthRoute } from '../src/mcp/create-app.mjs';

async function mcpSessionListTools(mcpUrl) {
  const client = new Client({ name: 'stateless-route-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);
  const tools = await client.listTools();
  await client.close();
  return tools;
}

test('mountHealthRoute returns canonical health shape', async (t) => {
  const mcpServer = new McpServer({ name: 'test-health', version: '0.0.0' });
  t.after(() => mcpServer.close().catch(() => {}));

  const { start } = createMcpApp({
    mcpServer,
    name: 'test-health',
    version: '1.2.3',
    port: 0
  });

  const handle = await start();
  t.after(() => handle.close());

  const healthUrl = handle.url.replace(/\/mcp$/, '/mcp/health');
  const res = await fetch(healthUrl);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.server, 'test-health');
  assert.equal(body.name, 'test-health');
  assert.equal(body.version, '1.2.3');
  assert.ok(body.capabilities);
  assert.equal(typeof body.capabilities.tools, 'number');
});

test('createMcpApp extraHealth and extraRoutes', async (t) => {
  const mcpServer = new McpServer({ name: 'test-extra', version: '0.0.0' });
  t.after(() => mcpServer.close().catch(() => {}));

  const { start } = createMcpApp({
    mcpServer,
    name: 'test-extra',
    version: '2.0.0',
    port: 0,
    extraHealth: () => ({ playerUiUrl: 'http://localhost:3013' }),
    extraRoutes: (app) => {
      app.get('/snapshot', (_req, res) => {
        res.json({ ok: true });
      });
    }
  });

  const handle = await start();
  t.after(() => handle.close());

  const healthUrl = handle.url.replace(/\/mcp$/, '/mcp/health');
  const health = await (await fetch(healthUrl)).json();
  assert.equal(health.playerUiUrl, 'http://localhost:3013');

  const base = handle.url.replace(/\/mcp$/, '');
  const snap = await (await fetch(`${base}/snapshot`)).json();
  assert.deepEqual(snap, { ok: true });
});

test('stateless MCP route keeps persistent McpServer across consecutive sessions', async (t) => {
  const mcpServer = new McpServer({ name: 'test-stateless', version: '0.0.0' });
  mcpServer.registerTool(
    'ping',
    {
      title: 'Ping',
      description: 'ping',
      inputSchema: {}
    },
    async () => ({ content: [{ type: 'text', text: 'pong' }] })
  );
  t.after(() => mcpServer.close().catch(() => {}));

  const { start } = createMcpApp({
    mcpServer,
    name: 'test-stateless',
    version: '1.0.0',
    port: 0
  });

  const handle = await start();
  t.after(() => handle.close());

  for (let i = 0; i < 2; i++) {
    const tools = await mcpSessionListTools(handle.url);
    assert.equal(tools.tools.length, 1, `session ${i + 1} should list one tool`);
    assert.equal(tools.tools[0].name, 'ping');
  }
});

test('mountHealthRoute can be used standalone', () => {
  const mcpServer = new McpServer({ name: 'standalone', version: '0.0.0' });
  const app = { get: (path, handler) => {
    assert.equal(path, '/mcp/health');
    const res = { status(code) { this.statusCode = code; return this; }, json(payload) { this.body = payload; } };
    handler({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.server, 'standalone');
  } };
  mountHealthRoute(app, { mcpServer, name: 'standalone', version: '9.9.9' });
  mcpServer.close().catch(() => {});
});
