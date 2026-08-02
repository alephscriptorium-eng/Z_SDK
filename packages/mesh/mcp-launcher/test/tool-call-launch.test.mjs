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
import { reservePorts } from './helpers/ports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

// WP-U267: aquí vivían `LAUNCHER_PORT = 13051` y `PORT_A/B = 19121/19122`.
// Esos dos últimos eran LOS MISMOS que intentional-stops-read.test.mjs: dos
// ficheros del mismo paquete peleándose por un puerto. El launcher, que ata en
// proceso, se cura con `port: 0` y `handle.port` (createMcpHttpStart ya
// resuelve address().port); la fixture, que se spawnea, con reservePorts.

function fixtureCatalog(portA, portB) {
  const host = '127.0.0.1';
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(portA), String(portB)],
    cwd: path.dirname(fixture),
    workspace: '@zeus/mcp-launcher',
    spawnGroup: 'linea-system'
  };
  return [
    {
      id: 'linea-espana',
      name: 'linea-espana',
      port: portA,
      ...spawn,
      capabilities: ['linea.tronco'],
      healthPath: '/mcp/health',
      mcpPath: '/mcp',
      host,
      url: `http://${host}:${portA}/mcp`,
      healthUrl: `http://${host}:${portA}/mcp/health`
    },
    {
      id: 'linea-wp-historia',
      name: 'linea-wp-historia',
      port: portB,
      ...spawn,
      capabilities: ['linea.satelite'],
      healthPath: '/mcp/health',
      mcpPath: '/mcp',
      host,
      url: `http://${host}:${portB}/mcp`,
      healthUrl: `http://${host}:${portB}/mcp/health`
    }
  ];
}

test(
  'eje I: tool call launch_mcp_server starts tronco + satelite',
  { timeout: 30_000 },
  async (t) => {
    const [portA, portB] = await reservePorts(2);
    const catalog = fixtureCatalog(portA, portB);
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 10_000,
      healthPollMs: 200
    });
    const bundle = createServer({
      port: 0,
      catalog,
      manager,
      refreshEditor: false
    });
    const handle = await bundle.start();
    assert.ok(handle.port > 0, `el launcher no reportó puerto atado: ${handle.port}`);
    const client = await connectMcp(handle.port);

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
    assert.equal(byId['linea-espana'].port, portA);
    assert.equal(byId['linea-wp-historia'].port, portB);

    const stopped = toolResultJson(
      await client.callTool({
        name: 'stop_mcp_server',
        arguments: { server_id: 'linea-espana' }
      })
    );
    assert.equal(stopped.ok, true);
  }
);
