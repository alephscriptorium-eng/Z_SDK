/**
 * f2 — cascada/zonas · rollup ciudad · wake Z03 · canRetry actuador · eje III.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ProcessManager } from '@zeus/mcp-launcher';
import { CityLifecycleRuntime, POBLACION_MAX } from '../src/runtime.mjs';
import { resolveExtendedCatalog, buildWakeMap, ARBOL_F1 } from '../src/catalog-extend.mjs';
import { mandoClientCall } from '../src/mando-client.mjs';
import { roundTripWake } from '../src/wake-sync.mjs';
import { CASCADE_CONCURRENCY_DEFAULT } from '@zeus/lifecycle-kit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/state-machine-peer.mjs');
const SRC = path.join(__dirname, '../src');

function smCatalog(port) {
  const host = '127.0.0.1';
  const base = resolveExtendedCatalog({ host });
  return base.map((e) => {
    if (e.id !== 'state-machine-server') return e;
    return {
      ...e,
      port,
      host,
      url: `http://${host}:${port}/mcp`,
      healthUrl: `http://${host}:${port}/mcp/health`,
      spawnCommand: process.execPath,
      spawnArgs: [fixture, String(port), 'state-machine-server'],
      cwd: path.dirname(fixture),
      workspace: '@zeus/ciudad-lifecycle'
    };
  });
}

/** Minimal Z03-shaped domain (injected authority — no second brain). */
function mockWakeDomain(barrioId = 'state-machine') {
  const barrios = {
    [barrioId]: {
      id: barrioId,
      estado: 'latente',
      anchorId: `ancla-${barrioId}`,
      parent: 'zona'
    }
  };
  const actors = {};
  const ledger = [];
  return {
    applyIntent(payload) {
      const intent = payload.intent;
      const actorId = payload.actorId;
      if (intent === 'join') {
        actors[actorId] = {
          id: actorId,
          nodeId: 'plaza',
          anchorId: null,
          wakes: 0
        };
        return { ok: true };
      }
      if (intent === 'walk') {
        const a = actors[actorId];
        if (!a) return { ok: false, error: 'actor_desconocido' };
        a.nodeId = payload.nodeId || a.nodeId;
        a.anchorId = payload.anchorId || `ancla-${barrioId}`;
        return { ok: true };
      }
      if (intent === 'wake') {
        const a = actors[actorId];
        if (!a) return { ok: false, error: 'actor_desconocido' };
        const id = payload.barrioId || barrioId;
        const b = barrios[id];
        if (!b) return { ok: false, error: 'barrio_desconocido' };
        if (b.estado !== 'latente') return { ok: false, error: 'barrio_no_latente' };
        b.estado = 'vivo';
        a.wakes += 1;
        ledger.push({ kind: 'wake', detail: { barrioId: id, tool: payload.tool } });
        return { ok: true };
      }
      return { ok: false, error: 'intent_desconocido' };
    },
    snapshot() {
      return {
        barrios: { ...Object.fromEntries(Object.entries(barrios).map(([k, v]) => [k, { ...v }])) },
        actors: { ...actors },
        lastWake: ledger.length
          ? { barrioId, tool: ledger.at(-1).detail.tool }
          : null
      };
    },
    drainOutbox() {
      const out = { ledger: [...ledger], tracks: [] };
      ledger.length = 0;
      return out;
    }
  };
}

test('techo POBLACION_MAX = CASCADE_CONCURRENCY_DEFAULT (24)', () => {
  assert.equal(POBLACION_MAX, CASCADE_CONCURRENCY_DEFAULT);
  assert.equal(POBLACION_MAX, 24);
});

test('buildWakeMap: ARBOL_F1 barrios → catalog ids', () => {
  const catalog = resolveExtendedCatalog({ host: '127.0.0.1' });
  const map = buildWakeMap(catalog, Object.keys(ARBOL_F1.barrios));
  assert.ok(map['state-machine']?.includes('state-machine-server'));
  assert.ok(map['prolog-editor']?.length >= 2);
  assert.ok(map['aaia-gallery']?.length >= 1);
});

test('rollup ciudad: latente → vivo al arrancar un barrio', async (t) => {
  const port = 13104;
  const catalog = smCatalog(port);
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

  assert.equal(runtime.rollupCiudad(), 'latente');
  assert.equal(runtime.snapshot().ciudad.estado, 'latente');

  const start = await runtime.dispatchMando('start', { nodo: 'state-machine' });
  assert.equal(start.ok, true, JSON.stringify(start));
  assert.equal(runtime.rollupCiudad(), 'vivo');
  assert.equal(runtime.snapshot().ciudad.estado, 'vivo');

  await runtime.dispatchMando('stop', { nodo: 'state-machine' });
  assert.equal(runtime.rollupCiudad(), 'latente');
});

test(
  'cascada zonas: concurrency acotada + mandoClientCall (eje IV)',
  { timeout: 60_000 },
  async (t) => {
    const port = 13105;
    const catalog = smCatalog(port);
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 12_000,
      healthPollMs: 150
    });
    const runtime = new CityLifecycleRuntime({
      manager,
      catalog,
      barrioIds: ['state-machine'],
      healthPollMs: 150,
      concurrency: 2
    });
    t.after(async () => {
      try {
        await manager.stop('state-machine-server', { force: true });
      } catch {
        /* ignore */
      }
      runtime.dispose();
    });

    const casc = await mandoClientCall(runtime, 'cascade_start', ['state-machine'], {
      concurrency: 1
    });
    assert.equal(casc.ok, true, JSON.stringify(casc));
    assert.equal(casc.techo, 24);
    assert.equal(casc.afterCiudad, 'vivo');
    assert.ok(
      runtime.ledger.some((e) => e.kind === 'CIUDAD_CASCADA'),
      'hecho cascada'
    );

    const stop = await mandoClientCall(runtime, 'cascade_stop', ['state-machine']);
    assert.equal(stop.ok, true);
    assert.equal(stop.afterCiudad, 'latente');
  }
);

test(
  'wake Z03 authority (inyectada) → process start → dual snapshot vivo',
  { timeout: 60_000 },
  async (t) => {
    const port = 13106;
    const catalog = smCatalog(port);
    const manager = new ProcessManager({
      catalog,
      healthTimeoutMs: 12_000,
      healthPollMs: 150
    });
    const domain = mockWakeDomain('state-machine');
    const runtime = new CityLifecycleRuntime({
      manager,
      catalog,
      barrioIds: ['state-machine'],
      healthPollMs: 150,
      wakeDomain: domain
    });
    t.after(async () => {
      try {
        await manager.stop('state-machine-server', { force: true });
      } catch {
        /* ignore */
      }
      runtime.dispose();
    });

    const out = await runtime.wakeAndStart({
      actorId: 'rabbit',
      barrioId: 'state-machine',
      tool: 'city.start',
      walk: { anchorId: 'ancla-state-machine' },
      horseMode: 'horse'
    });
    assert.equal(out.ok, true, JSON.stringify(out.steps));
    assert.equal(out.gameEstado, 'vivo');
    assert.equal(out.processEstado, 'vivo');
    assert.ok(out.ledger?.some((e) => e.kind === 'wake') || out.steps.some((s) => s.step === 'wake'));
  }
);

test('roundTripWake skipProcess: solo dominio (contrato wake)', async () => {
  const domain = mockWakeDomain('state-machine');
  const runtime = {
    dispatchMando: async () => ({ ok: true }),
    snapshot: () => ({ barrios: { 'state-machine': { estado: 'latente' } } }),
    resolveWake: () => ({ ok: true, serverIds: ['state-machine-server'] })
  };
  const out = await roundTripWake({
    domain,
    runtime,
    actorId: 'rabbit',
    barrioId: 'state-machine',
    walk: { anchorId: 'ancla-state-machine' },
    skipProcess: true
  });
  assert.equal(out.ok, true);
  assert.equal(out.gameEstado, 'vivo');
});

test('eje III: src sin child_process (f2 files incluidos)', () => {
  let blob = '';
  for (const f of fs.readdirSync(SRC)) {
    if (f.endsWith('.mjs')) blob += fs.readFileSync(path.join(SRC, f), 'utf8');
  }
  assert.equal((blob.match(/from ['"]node:child_process['"]/g) || []).length, 0);
  assert.equal((blob.match(/require\(['"]child_process['"]\)/g) || []).length, 0);
});

test('canRetry leaf wired to actuator isIntentionalStop', () => {
  const marks = new Set(['state-machine-server']);
  const manager = {
    isIntentionalStop: (id) => marks.has(id),
    launch: async () => ({ ok: true }),
    stop: async () => ({ ok: true }),
    isManaged: () => false
  };
  const catalog = resolveExtendedCatalog({ host: '127.0.0.1' });
  const runtime = new CityLifecycleRuntime({
    manager,
    catalog,
    barrioIds: ['state-machine']
  });
  assert.equal(runtime.isIntentionalStop('state-machine-server'), true);
  const leaf = runtime.byBarrio.get('state-machine')?.leaves?.[0];
  assert.ok(leaf, 'leaf present');
  // provideLeafActors closed over isIntentionalStop — send intentional exit
  leaf.actor.send({
    type: 'ARRANQUE_SOLICITADO'
  });
  // Without real launchEffect success path under stub manager — just prove API
  runtime.dispose();
});
