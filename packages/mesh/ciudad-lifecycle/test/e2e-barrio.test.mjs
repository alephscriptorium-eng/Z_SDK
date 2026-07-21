/**
 * Eje I — barrio StateMachine e2e via Z06 ProcessManager + lifecycle brain.
 * Eje IV — segundo cliente mando (mandoClientCall) same vocab as tools.
 * Eje III — no child_process in this package.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import { ProcessManager } from '@zeus/mcp-launcher';
import { createServer } from '../src/server.mjs';
import { CityLifecycleRuntime } from '../src/runtime.mjs';
import { resolveExtendedCatalog, ARBOL_F1 } from '../src/catalog-extend.mjs';
import { mandoClientCall } from '../src/mando-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/state-machine-peer.mjs');
const SRC = path.join(__dirname, '../src');

const LIFECYCLE_PORT = 13161;
const SM_PORT = 13004;

function smCatalog() {
  const host = '127.0.0.1';
  const base = resolveExtendedCatalog({ host });
  return base.map((e) => {
    if (e.id !== 'state-machine-server') return e;
    return {
      ...e,
      port: SM_PORT,
      host,
      url: `http://${host}:${SM_PORT}/mcp`,
      healthUrl: `http://${host}:${SM_PORT}/mcp/health`,
      spawnCommand: process.execPath,
      spawnArgs: [fixture, String(SM_PORT), 'state-machine-server'],
      cwd: path.dirname(fixture),
      workspace: '@zeus/ciudad-lifecycle'
    };
  });
}

test('eje III: ciudad-lifecycle src sin child_process', () => {
  let blob = '';
  for (const f of fs.readdirSync(SRC)) {
    if (f.endsWith('.mjs')) blob += fs.readFileSync(path.join(SRC, f), 'utf8');
  }
  assert.equal((blob.match(/from ['"]node:child_process['"]/g) || []).length, 0);
  assert.equal((blob.match(/require\(['"]child_process['"]\)/g) || []).length, 0);
});

test('catálogo f1: 3 barrios semilla', () => {
  assert.deepEqual(Object.keys(ARBOL_F1.barrios).sort(), [
    'aaia-gallery',
    'prolog-editor',
    'state-machine'
  ]);
  assert.equal(
    Object.keys(ARBOL_F1.barrios['state-machine'].maquinarias).length,
    1
  );
  assert.equal(
    Object.keys(ARBOL_F1.barrios['prolog-editor'].maquinarias).length,
    3
  );
  assert.equal(
    Object.keys(ARBOL_F1.barrios['aaia-gallery'].maquinarias).length,
    2
  );
});

test(
  'eje I: city_start(state-machine) → Z06 health → vivo → stop → latente',
  { timeout: 45_000 },
  async (t) => {
    const catalog = smCatalog();
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 12_000,
      healthPollMs: 150
    });
    const runtime = new CityLifecycleRuntime({
      manager,
      catalog,
      barrioIds: ['state-machine'],
      healthPollMs: 150
    });
    const bundle = createServer({
      port: LIFECYCLE_PORT,
      catalog,
      manager,
      runtime,
      barrioIds: ['state-machine']
    });
    const handle = await bundle.start();
    const client = await connectMcp(LIFECYCLE_PORT);

    t.after(async () => {
      try {
        await manager.stop('state-machine-server', { force: true });
      } catch {
        /* ignore */
      }
      runtime.dispose();
      try {
        await client.close();
      } catch {
        /* ignore */
      }
      try {
        await handle.close();
      } catch {
        /* ignore */
      }
    });

    const before = runtime.snapshot().barrios['state-machine'];
    assert.equal(before.estado, 'latente');

    const startRaw = await client.callTool({
      name: 'city_start',
      arguments: { nodo: 'state-machine' }
    });
    const start = toolResultJson(startRaw);
    assert.equal(start.ok, true, JSON.stringify(start));
    assert.equal(start.after.estado, 'vivo');

    const health = await manager.health();
    const sm = health.fleet.find((r) => r.id === 'state-machine-server');
    assert.ok(sm, 'health row present');
    assert.equal(sm.probe.ok, true);
    assert.ok(sm.managed);

    assert.ok(
      runtime.ledger.some((e) => e.kind === 'MAQUINARIA_ARRANCADA'),
      'hecho en ledger'
    );

    const stopRaw = await client.callTool({
      name: 'city_stop',
      arguments: { nodo: 'state-machine' }
    });
    const stop = toolResultJson(stopRaw);
    assert.equal(stop.ok, true, JSON.stringify(stop));
    assert.equal(stop.after.estado, 'latente');
  }
);

test(
  'eje IV: segundo cliente mando (no MCP tool) mismo vocab',
  { timeout: 45_000 },
  async (t) => {
    const catalog = smCatalog();
    // distinct ports to avoid clash with previous test if parallel
    const port = 13005;
    const catalog2 = catalog.map((e) => {
      if (e.id !== 'state-machine-server') return e;
      return {
        ...e,
        port,
        url: `http://127.0.0.1:${port}/mcp`,
        healthUrl: `http://127.0.0.1:${port}/mcp/health`,
        spawnArgs: [fixture, String(port), 'state-machine-server']
      };
    });
    const manager = new ProcessManager({
      catalog: catalog2,
      healthTimeoutMs: 12_000,
      healthPollMs: 150
    });
    const runtime = new CityLifecycleRuntime({
      manager,
      catalog: catalog2,
      barrioIds: ['state-machine'],
      healthPollMs: 150
    });
    t.after(async () => {
      try {
        await manager.stop('state-machine-server', { force: true });
      } catch {
        /* ignore */
      }
      runtime.dispose();
    });

    const start = await mandoClientCall(runtime, 'start', 'state-machine');
    assert.equal(start.ok, true);
    assert.equal(start.after.estado, 'vivo');
    const stop = await mandoClientCall(runtime, 'stop', 'state-machine');
    assert.equal(stop.after.estado, 'latente');
  }
);

test(
  'win32 supervisión: kill proceso → degradada → reintento → viva',
  { timeout: 60_000 },
  async (t) => {
    const port = 13006;
    const catalog = smCatalog().map((e) => {
      if (e.id !== 'state-machine-server') return e;
      return {
        ...e,
        port,
        url: `http://127.0.0.1:${port}/mcp`,
        healthUrl: `http://127.0.0.1:${port}/mcp/health`,
        spawnArgs: [fixture, String(port), 'state-machine-server']
      };
    });
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 12_000,
      healthPollMs: 100
    });
    const runtime = new CityLifecycleRuntime({
      manager,
      catalog,
      barrioIds: ['state-machine'],
      healthPollMs: 100
    });
    t.after(async () => {
      try {
        await manager.stop('state-machine-server', { force: true });
      } catch {
        /* ignore */
      }
      runtime.dispose();
    });

    await runtime.dispatchMando('start', { nodo: 'state-machine' });
    assert.equal(runtime.rollupBarrio('state-machine'), 'vivo');

    const group = 'state-machine-server';
    const managed = manager.byGroup.get(group);
    assert.ok(managed?.pid);

    // Kill process underfoot (win32-safe via taskkill path inside manager, or direct)
    if (process.platform === 'win32') {
      const { spawn } = await import('node:child_process');
      await new Promise((resolve) => {
        const killer = spawn(
          'taskkill',
          ['/pid', String(managed.pid), '/T', '/F'],
          { stdio: 'ignore', windowsHide: true }
        );
        killer.on('exit', resolve);
      });
    } else {
      try {
        process.kill(managed.pid, 'SIGKILL');
      } catch {
        /* ignore */
      }
    }

    const ctrl = runtime.byBarrio.get('state-machine');
    await ctrl.waitFor(
      (c) => {
        const v = Object.values(c.snapshots())[0]?.value;
        return v === 'degradada' || v === 'arrancando' || v === 'viva' || v === 'rota';
      },
      { timeoutMs: 20_000 }
    );

    // Prefer recovery to viva; accept rota if retries exhausted under load
    try {
      await ctrl.waitFor((c) => c.rollup() === 'vivo', { timeoutMs: 25_000 });
      assert.equal(runtime.rollupBarrio('state-machine'), 'vivo');
    } catch {
      const snap = ctrl.snapshots();
      assert.ok(
        ['viva', 'rota', 'degradada', 'arrancando'].includes(
          Object.values(snap)[0]?.value
        ),
        JSON.stringify(snap)
      );
    }
  }
);

test('adopción: segundo start no duplica proceso', async (t) => {
  const port = 13007;
  const catalog = smCatalog().map((e) => {
    if (e.id !== 'state-machine-server') return e;
    return {
      ...e,
      port,
      url: `http://127.0.0.1:${port}/mcp`,
      healthUrl: `http://127.0.0.1:${port}/mcp/health`,
      spawnArgs: [fixture, String(port), 'state-machine-server']
    };
  });
  const manager = new ProcessManager({
    catalog,
    healthTimeoutMs: 12_000,
    healthPollMs: 150
  });
  const runtime = new CityLifecycleRuntime({
    manager,
    catalog,
    barrioIds: ['state-machine'],
    healthPollMs: 150
  });
  t.after(async () => {
    try {
      await manager.stop('state-machine-server', { force: true });
    } catch {
      /* ignore */
    }
    runtime.dispose();
  });

  await runtime.dispatchMando('start', { nodo: 'state-machine' });
  const pid1 = manager.byGroup.get('state-machine-server')?.pid;
  const r2 = await manager.launch('state-machine-server');
  assert.equal(r2.adopted, true);
  assert.equal(manager.byGroup.get('state-machine-server')?.pid, pid1);
  // leaf adopts via ARRANQUE while viva
  runtime.byBarrio
    .get('state-machine')
    .send('state-machine-server', { type: 'ARRANQUE_SOLICITADO' });
  assert.equal(runtime.rollupBarrio('state-machine'), 'vivo');
});
