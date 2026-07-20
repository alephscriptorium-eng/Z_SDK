/**
 * Eje I — launch tronco+satélite vía tool MCP real (callTool), no solo ProcessManager.
 * Usa fixture dual-peer (misma forma que linea-system: un spawn → dos health).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import { createServer } from '../src/launcher-server.mjs';
import { ProcessManager } from '../src/process-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

const LAUNCHER_PORT = 13051;
const PORT_A = 19121;
const PORT_B = 19122;

function fixtureCatalog() {
  const host = '127.0.0.1';
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(PORT_A), String(PORT_B)],
    cwd: path.dirname(fixture),
    workspace: '@zeus/mcp-launcher',
    spawnGroup: 'linea-system'
  };
  return [
    {
      id: 'linea-espana',
      name: 'linea-espana',
      port: PORT_A,
      ...spawn,
      capabilities: ['linea.tronco'],
      healthPath: '/mcp/health',
      mcpPath: '/mcp',
      host,
      url: `http://${host}:${PORT_A}/mcp`,
      healthUrl: `http://${host}:${PORT_A}/mcp/health`
    },
    {
      id: 'linea-wp-historia',
      name: 'linea-wp-historia',
      port: PORT_B,
      ...spawn,
      capabilities: ['linea.satelite'],
      healthPath: '/mcp/health',
      mcpPath: '/mcp',
      host,
      url: `http://${host}:${PORT_B}/mcp`,
      healthUrl: `http://${host}:${PORT_B}/mcp/health`
    }
  ];
}

test(
  'eje I: tool call launch_mcp_server starts tronco + satelite',
  { timeout: 30_000 },
  async (t) => {
    const catalog = fixtureCatalog();
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 10_000,
      healthPollMs: 200
    });
    const bundle = createServer({
      port: LAUNCHER_PORT,
      catalog,
      manager,
      refreshEditor: false
    });
    const handle = await bundle.start();
    const client = await connectMcp(LAUNCHER_PORT);

    t.after(async () => {
      try {
        await manager.stop('linea-espana', { force: true });
      } catch {
        /* ignore */
      }
      try {
        await client.close();
      } catch {
        /* ignore */
      }
      await handle.close();
    });

    const tools = await client.listTools();
    const names = tools.tools.map((x) => x.name);
    assert.ok(names.includes('launch_mcp_server'));
    assert.ok(names.includes('health'));
    assert.ok(names.includes('stop_mcp_server'));

    const launched = toolResultJson(
      await client.callTool({
        name: 'launch_mcp_server',
        arguments: { server_id: 'linea-espana' }
      })
    );
    assert.equal(launched.ok, true, JSON.stringify(launched));
    assert.ok(launched.serverIds.includes('linea-espana'));
    assert.ok(launched.serverIds.includes('linea-wp-historia'));
    assert.ok(
      launched.health.every((h) => h.ok),
      JSON.stringify(launched.health)
    );

    const health = toolResultJson(
      await client.callTool({ name: 'health', arguments: {} })
    );
    assert.equal(health.ok, true);
    const byId = Object.fromEntries(health.fleet.map((r) => [r.id, r]));
    assert.equal(byId['linea-espana'].status, 'running');
    assert.equal(byId['linea-wp-historia'].status, 'running');
    assert.equal(byId['linea-espana'].port, PORT_A);
    assert.equal(byId['linea-wp-historia'].port, PORT_B);

    const stopped = toolResultJson(
      await client.callTool({
        name: 'stop_mcp_server',
        arguments: { server_id: 'linea-espana' }
      })
    );
    assert.equal(stopped.ok, true);
  }
);
