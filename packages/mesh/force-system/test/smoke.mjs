/**
 * Smoke + CA for force-system MCP:
 * - volume validates (via live DISK_03 or kit fixture)
 * - force://registry exposes session_budget
 * - anchor scene readable over MCP
 * - loader src has zero concrete force names (gate)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import { validateVolumesTree } from '@zeus/linea-kit/validate';
import { loadForcesData as loadForcesDataKit } from '@zeus/linea-kit/loader';
import { startAll } from '../src/start.mjs';
import {
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene
} from '../src/loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PKG_ROOT, 'src');
const TEST_PORT = 14191;

const PREV = {
  forces: process.env.ZEUS_MCP_FORCES,
  volumes: process.env.ZEUS_VOLUMES_ROOT
};

/** Concrete corpus ids from DISK_03 — must not appear in loader source. */
const CONCRETE_FORCE_RE = /\bforce-[a-g]\b|\bforce-xz\b|\bforce-zx\b/i;

function resolveVolumesRoot() {
  if (process.env.ZEUS_VOLUMES_ROOT) return process.env.ZEUS_VOLUMES_ROOT;
  const candidates = [
    path.resolve(PKG_ROOT, '../../../../VOLUMES'),
    path.resolve(PKG_ROOT, '../../../../../VOLUMES')
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'volumes.json'))) return c;
  }
  return null;
}

function collectSrcFiles(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSrcFiles(abs));
    else if (entry.name.endsWith('.mjs')) out.push(abs);
  }
  return out;
}

test('force-system: loader src has no concrete force names', () => {
  const offenders = [];
  for (const file of collectSrcFiles(SRC_DIR)) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (CONCRETE_FORCE_RE.test(line)) {
        offenders.push(`${path.relative(PKG_ROOT, file)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, [], `concrete force names in src:\n${offenders.join('\n')}`);
});

test('force-system smoke', async (t) => {
  const volumesRoot = resolveVolumesRoot();
  assert.ok(volumesRoot, 'VOLUMES root required (ZEUS_VOLUMES_ROOT or repo VOLUMES/)');
  process.env.ZEUS_VOLUMES_ROOT = volumesRoot;
  process.env.ZEUS_MCP_FORCES = String(TEST_PORT);

  const forcesDir = path.join(volumesRoot, 'DISK_03', 'FORCES');
  const hasLive = fs.existsSync(path.join(forcesDir, 'registry.json'));
  const kitFixture = path.resolve(
    PKG_ROOT,
    '../../engine/linea-kit/test/fixtures/forces'
  );
  const loadBase = hasLive ? forcesDir : kitFixture;

  t.after(async () => {
    if (PREV.forces == null) delete process.env.ZEUS_MCP_FORCES;
    else process.env.ZEUS_MCP_FORCES = PREV.forces;
    if (PREV.volumes == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = PREV.volumes;
  });

  if (hasLive) {
    const tree = validateVolumesTree({ volumesRoot });
    const forceResults = tree.results.filter(
      (r) =>
        r.schemaId === 'force-registry' ||
        r.schemaId === 'force' ||
        r.schemaId === 'cota' ||
        r.schemaId === 'force-manifest'
    );
    assert.ok(forceResults.length > 0, 'expected force/cota schema checks');
    assert.equal(
      forceResults.every((r) => r.ok),
      true,
      `DISK_03 force schemas failed: ${JSON.stringify(
        forceResults.filter((r) => !r.ok).slice(0, 3)
      )}`
    );
    console.log(
      `U80 validate OK: volumesRoot=${volumesRoot}; forceChecks=${forceResults.length}`
    );
  } else {
    console.log('DISK_03 absent — using kit fixture for MCP smoke; live validate skipped');
  }

  // Offline resolution before MCP (ids come from data, not hardcoded).
  const data = await loadForcesDataKit(loadBase, { mountedLineaIds: [] });
  const view = buildForcesRegistryView(data);
  assert.ok(view.session_budget?.max_active_forces != null);
  const sampleId = view.boot || view.force_ids[0];
  assert.ok(sampleId, 'registry must expose a boot or force id');
  const card = resolveForce(data, sampleId);
  assert.equal(card.id, sampleId);
  const [session, slug] = String(card.anchor_scene).split('/');
  assert.ok(session && slug, 'anchor_scene must be session/slug');
  const sceneOffline = await resolveForceScene(data, sampleId, session, slug);
  assert.equal(sceneOffline.is_anchor, true);
  console.log(
    `Loader OK: id=${sampleId} anchor=${card.anchor_scene} session_budget=`,
    view.session_budget
  );

  // For MCP startAll, point volume path via ZEUS_VOLUMES_ROOT when live;
  // when fixture-only, pass basePath explicitly.
  let handles;
  if (hasLive) {
    handles = await startAll();
  } else {
    // startAll uses resolveForcesBasePath — without forces volume it throws.
    // Bind fixture by temporarily writing is not allowed; call create path via startAll(basePath).
    handles = await startAll(kitFixture);
  }

  t.after(async () => {
    await Promise.allSettled((handles ?? []).map((h) => h.close()));
  });

  assert.equal(handles.length, 1);
  const healthRes = await fetch(`http://localhost:${TEST_PORT}/mcp/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.server, 'force-system');
  console.log('Health OK:', JSON.stringify(health));

  const client = await connectMcp(TEST_PORT);
  t.after(async () => {
    await client.close();
  });

  const registryRes = await client.readResource({ uri: 'force://registry' });
  const registry = JSON.parse(registryRes.contents[0].text);
  assert.ok(registry.session_budget);
  assert.equal(
    registry.session_budget.max_active_forces,
    view.session_budget.max_active_forces
  );
  console.log('Resource OK: force://registry session_budget=', registry.session_budget);

  const sceneUri = `force://${sampleId}/scene/${session}/${slug}`;
  const sceneRes = await client.readResource({ uri: sceneUri });
  const scene = JSON.parse(sceneRes.contents[0].text);
  assert.equal(scene.is_anchor, true);
  assert.ok(scene.layers && typeof scene.layers === 'object');
  console.log(`Resource OK: ${sceneUri} is_anchor=true`);

  const viaTool = toolResultJson(
    await client.callTool({
      name: 'get_force',
      arguments: { id: sampleId }
    })
  );
  assert.equal(viaTool.id, sampleId);
  console.log('Tool OK: get_force');

  console.log('SMOKE TEST PASSED');
});
