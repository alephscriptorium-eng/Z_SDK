/**
 * ProcessManager e2e: one spawnGroup → two ports (linea tronco+satélite shape).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProcessManager } from '../src/process-manager.mjs';
import { reservePorts } from './helpers/ports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

// WP-U267: antes `PORT_A = 19111` / `PORT_B = 19112` fijos. Ver helpers/ports.mjs.

function fixtureCatalog(portA, portB) {
  const host = '127.0.0.1';
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(portA), String(portB)],
    cwd: path.dirname(fixture),
    workspace: '@zeus/mcp-launcher',
    spawnGroup: 'fixture-lineas'
  };
  return [
    {
      id: 'fixture-tronco',
      name: 'fixture-tronco',
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
      id: 'fixture-satelite',
      name: 'fixture-satelite',
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

test('launch tronco brings satelite (shared spawnGroup)', async (t) => {
  const [portA, portB] = await reservePorts(2);
  const manager = new ProcessManager({
    catalog: fixtureCatalog(portA, portB),
    healthTimeoutMs: 10_000,
    healthPollMs: 200
  });

  t.after(async () => {
    try {
      await manager.stop('fixture-tronco', { force: true });
    } catch {
      /* ignore */
    }
  });

  const launched = await manager.launch('fixture-tronco');
  assert.equal(launched.ok, true, JSON.stringify(launched));
  assert.deepEqual(launched.serverIds.sort(), ['fixture-satelite', 'fixture-tronco']);
  assert.ok(launched.health.every((h) => h.ok), JSON.stringify(launched.health));

  const health = await manager.health();
  const byId = Object.fromEntries(health.fleet.map((r) => [r.id, r]));
  assert.equal(byId['fixture-tronco'].status, 'running');
  assert.equal(byId['fixture-satelite'].status, 'running');
  assert.equal(byId['fixture-tronco'].port, portA);
  assert.equal(byId['fixture-satelite'].port, portB);

  // adopt idempotent
  const again = await manager.launch('fixture-satelite');
  assert.equal(again.ok, true);
  assert.equal(again.adopted, true);

  const stopped = await manager.stop('fixture-satelite');
  assert.equal(stopped.ok, true);

  const after = await manager.health();
  assert.equal(after.fleet.find((r) => r.id === 'fixture-tronco').status, 'stopped');
  assert.equal(after.fleet.find((r) => r.id === 'fixture-satelite').status, 'stopped');
});

test('catalog gate: unknown id', async () => {
  const [portA, portB] = await reservePorts(2);
  const manager = new ProcessManager({ catalog: fixtureCatalog(portA, portB) });
  await assert.rejects(() => manager.launch('evil-arbitrary'), /Unknown catalog id/);
});
