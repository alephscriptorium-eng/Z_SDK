import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  classifyPairsWith,
  loadForcesData,
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene
} from '../src/forces-loader.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const forcesFx = path.join(__dirname, 'fixtures', 'forces');

describe('forces loader', () => {
  it('classifies unmounted linea refs as pending', () => {
    const out = classifyPairsWith(['cota:sima', 'linea:linea-pending-fixture'], {
      localIds: ['sima', 'force-sample'],
      mountedLineaIds: []
    });
    assert.equal(out.pending_refs.length, 1);
    assert.equal(out.pending_refs[0].ref, 'linea:linea-pending-fixture');
    assert.equal(out.pending_refs[0].reason, 'linea not mounted');
    assert.equal(out.resolved_refs.length, 1);
    assert.equal(out.resolved_refs[0].ref, 'cota:sima');
  });

  it('loads fixture volume and reads anchor scene', async () => {
    const data = await loadForcesData(forcesFx, { mountedLineaIds: [] });
    const registry = buildForcesRegistryView(data);
    assert.ok(registry.session_budget);
    assert.equal(registry.session_budget.max_active_forces, 2);
    assert.ok(registry.force_ids.includes('force-sample'));

    const force = resolveForce(data, 'force-sample');
    assert.equal(force.id, 'force-sample');
    assert.ok(force.pending_refs.some((r) => r.ref.startsWith('linea:')));
    assert.equal(force.error, undefined);

    const [session, slug] = String(force.anchor_scene).split('/');
    const scene = await resolveForceScene(data, 'force-sample', session, slug);
    assert.equal(scene.is_anchor, true);
    assert.ok(scene.layers.prompt?.includes('sample prompt'));
    assert.equal(scene.error, undefined);
  });

  it('unknown id returns structured error (not throw)', async () => {
    const data = await loadForcesData(forcesFx, { mountedLineaIds: [] });
    const missing = resolveForce(data, 'does-not-exist');
    assert.match(missing.error, /Unknown force\/cota/);
  });
});

describe('forces loader live DISK_03 (optional)', () => {
  it('loads live FORCES when present', async () => {
    const root =
      process.env.ZEUS_VOLUMES_ROOT ||
      path.resolve(__dirname, '../../../../../../VOLUMES');
    const live = path.join(root, 'DISK_03', 'FORCES');
    if (!fs.existsSync(path.join(live, 'registry.json'))) {
      console.log('skip live FORCES (no registry at', live, ')');
      return;
    }
    const data = await loadForcesData(live, { mountedLineaIds: [] });
    const view = buildForcesRegistryView(data);
    assert.ok(view.session_budget?.max_active_forces >= 1);
    assert.ok(view.force_count >= 1);
    const bootId = data.registry.boot;
    assert.ok(bootId);
    const boot = resolveForce(data, bootId);
    assert.equal(boot.id, bootId);
    assert.ok(!boot.error);
    const pendingLinea = Object.values(data.forces).some((f) =>
      (f.pending_refs ?? []).some((r) => r.reason === 'linea not mounted')
    );
    assert.equal(pendingLinea, true);
  });
});
