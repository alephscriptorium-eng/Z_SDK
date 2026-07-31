/**
 * Orchestrator v1 (U234): profile expansion + dep order + real
 * start→health→stop e2e over the dual-peer fixture (detached spawn,
 * Windows tree-kill, port re-bind proof).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROFILES,
  expandProfile,
  planGroups,
  runStart,
  runStop,
  runStatus,
  runHealth,
  listenerPids,
  portFree
} from '../src/orchestrator.mjs';
import { resolveCatalog } from '../src/catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(__dirname, '../fixtures/dual-peer.mjs');

const PORT_A = 19131;
const PORT_B = 19132;

function entry(id, port, extra = {}) {
  const host = '127.0.0.1';
  return {
    id,
    name: id,
    port,
    host,
    deps: [],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    url: `http://${host}:${port}/mcp`,
    healthUrl: `http://${host}:${port}/mcp/health`,
    ...extra
  };
}

function fixtureCatalog() {
  const spawn = {
    spawnCommand: process.execPath,
    spawnArgs: [fixture, String(PORT_A), String(PORT_B)],
    cwd: path.dirname(fixture),
    spawnGroup: 'fixture-dual'
  };
  return [
    entry('fixture-uno', PORT_A, spawn),
    entry('fixture-dos', PORT_B, spawn)
  ];
}

test('expandProfile: minimo is a declared catalog subset; unknown rejects', () => {
  const catalog = resolveCatalog();
  const minimo = expandProfile('minimo', catalog);
  assert.deepEqual(
    minimo.map((e) => e.id).sort(),
    ['launcher', 'solar-sun'].sort()
  );
  assert.deepEqual(PROFILES['v1-zeus'], [
    'socket-server',
    'console-monitor',
    'cache-browser',
    'firehose-browser'
  ]);
  assert.throws(() => expandProfile('no-existe', catalog), /Perfil o id desconocido/);
});

test('planGroups: declared deps order groups topologically (stable ties)', () => {
  // catalog listed in reverse dep order on purpose
  const catalog = [
    entry('c', 19343, { spawnGroup: 'c', deps: ['b'] }),
    entry('b', 19342, { spawnGroup: 'b', deps: ['a'] }),
    entry('a', 19341, { spawnGroup: 'a' })
  ];
  const plan = planGroups(expandProfile('c', catalog), catalog);
  assert.deepEqual(plan.map((g) => g.group), ['a', 'b', 'c']);
});

test('planGroups: dep cycle is rejected', () => {
  const catalog = [
    entry('a', 19351, { spawnGroup: 'a', deps: ['b'] }),
    entry('b', 19352, { spawnGroup: 'b', deps: ['a'] })
  ];
  assert.throws(() => planGroups(expandProfile('a', catalog), catalog), /Ciclo de deps/);
});

test('e2e: start → health → status → stop leaves ports re-bindable', async (t) => {
  const catalog = fixtureCatalog();
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orq-u234-'));
  const profiles = { fixture: ['fixture-uno'] };
  const prevProfiles = { ...PROFILES };
  Object.assign(PROFILES, profiles);
  const opts = { catalog, stateDir, timeoutMs: 15_000, pollMs: 200, log: () => {} };

  t.after(async () => {
    for (const k of Object.keys(PROFILES)) delete PROFILES[k];
    Object.assign(PROFILES, prevProfiles);
    try {
      await runStop('fixture', opts);
    } catch {
      /* already stopped */
    }
    fs.rmSync(stateDir, { recursive: true, force: true });
  });

  const started = await runStart('fixture', opts);
  assert.equal(started.ok, true, JSON.stringify(started));
  // one spawnGroup serves both catalog ports; health per entry
  assert.equal(started.groups.length, 1);
  assert.equal(started.groups[0].adopted, false);
  assert.deepEqual(started.groups[0].ids.sort(), ['fixture-dos', 'fixture-uno']);
  assert.ok(started.groups[0].health.every((h) => h.ok));
  assert.ok(fs.existsSync(path.join(stateDir, 'state-fixture.json')));

  const health = await runHealth('fixture', opts);
  assert.equal(health.ok, true);
  assert.equal(health.rows.length, 2);

  const status = await runStatus('fixture', opts);
  assert.ok(status.rows.every((r) => r.status === 'running'));
  assert.equal(status.rows[0].managedPid, started.groups[0].pid);

  const stopped = await runStop('fixture', opts);
  assert.equal(stopped.ok, true, JSON.stringify(stopped));
  assert.equal(stopped.residues.length, 0);
  assert.ok(stopped.ports.every((p) => p.free), JSON.stringify(stopped.ports));

  // hard evidence: no listener pids left; ports really re-bindable
  assert.deepEqual(listenerPids(PORT_A), []);
  assert.deepEqual(listenerPids(PORT_B), []);
  assert.equal(await portFree(PORT_A, '127.0.0.1'), true);
  assert.equal(await portFree(PORT_B, '127.0.0.1'), true);
  // state cleared after clean stop
  assert.equal(fs.existsSync(path.join(stateDir, 'state-fixture.json')), false);
});
