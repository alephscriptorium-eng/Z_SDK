/**
 * Contract: intentionalStops is readable after stop; cleared on launch;
 * crash without stop is not intentional. No live fleet required beyond fixture.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { ProcessManager } from '../src/process-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

const PORT_A = 19121;
const PORT_B = 19122;

function fixtureCatalog() {
  const host = '127.0.0.1';
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(PORT_A), String(PORT_B)],
    cwd: path.dirname(fixture),
    workspace: '@zeus/mcp-launcher',
    spawnGroup: 'fixture-intent'
  };
  return [
    {
      id: 'intent-tronco',
      name: 'intent-tronco',
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
      id: 'intent-satelite',
      name: 'intent-satelite',
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

test('intentionalStops: stop marks, launch clears, health tells truth', async (t) => {
  const manager = new ProcessManager({
    catalog: fixtureCatalog(),
    healthTimeoutMs: 10_000,
    healthPollMs: 200
  });

  t.after(async () => {
    try {
      await manager.stop('intent-tronco', { force: true });
    } catch {
      /* ignore */
    }
  });

  assert.equal(manager.isIntentionalStop('intent-tronco'), false);
  assert.deepEqual(manager.listIntentionalStops(), []);

  const launched = await manager.launch('intent-tronco');
  assert.equal(launched.ok, true, JSON.stringify(launched));
  assert.equal(manager.isIntentionalStop('intent-tronco'), false);

  const stopped = await manager.stop('intent-satelite');
  assert.equal(stopped.ok, true);
  assert.equal(manager.isIntentionalStop('intent-tronco'), true);
  assert.equal(manager.isIntentionalStop('intent-satelite'), true);
  assert.deepEqual(manager.listIntentionalStops(), ['fixture-intent']);

  const healthAfterStop = await manager.health();
  for (const row of healthAfterStop.fleet) {
    assert.equal(row.intentionalStop, true, row.id);
  }
  assert.deepEqual(healthAfterStop.intentionalGroups, ['fixture-intent']);

  const relaunch = await manager.launch('intent-tronco');
  assert.equal(relaunch.ok, true, JSON.stringify(relaunch));
  assert.equal(manager.isIntentionalStop('intent-tronco'), false);
  assert.deepEqual(manager.listIntentionalStops(), []);

  const healthAfterLaunch = await manager.health();
  for (const row of healthAfterLaunch.fleet) {
    assert.equal(row.intentionalStop, false, row.id);
  }
});

test('intentionalStops: crash without stop ≠ intentional', async (t) => {
  const manager = new ProcessManager({
    catalog: fixtureCatalog(),
    healthTimeoutMs: 10_000,
    healthPollMs: 200
  });

  t.after(async () => {
    try {
      await manager.stop('intent-tronco', { force: true });
    } catch {
      /* ignore */
    }
  });

  const launched = await manager.launch('intent-tronco');
  assert.equal(launched.ok, true, JSON.stringify(launched));

  const group = 'fixture-intent';
  const managed = manager.byGroup.get(group);
  assert.ok(managed?.child);

  await new Promise((resolve) => {
    managed.child.once('exit', resolve);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(managed.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true
        });
      } else {
        managed.child.kill('SIGKILL');
      }
    } catch {
      resolve();
    }
  });

  // wait until ProcessManager drops the group
  const deadline = Date.now() + 5_000;
  while (manager.byGroup.has(group) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(manager.byGroup.has(group), false);
  assert.equal(manager.isIntentionalStop('intent-tronco'), false);

  const health = await manager.health();
  const row = health.fleet.find((r) => r.id === 'intent-tronco');
  assert.equal(row.status, 'stopped');
  assert.equal(row.intentionalStop, false);
  assert.deepEqual(health.intentionalGroups, []);
});
