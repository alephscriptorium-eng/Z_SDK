/**
 * WP-U92 — force activation rules (pure). Synthetic ids only; no concrete corpus names.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeForceRegistry,
  initialActiveForces,
  explainActivate,
  explainDeactivate,
  applyActivate,
  applyDeactivate,
  forceAnchorTrackRef,
  cotasSnapshot
} from '../src/force-activation.mjs';

/** Fixture registry: boot + 3 forces, max 2, one exclusion pair. */
function sampleRegistry() {
  return normalizeForceRegistry({
    boot: 'boot-x',
    activation: {
      session_budget: { max_active_forces: 2, boot_always_on: true },
      exclusions: [{ pair: ['force-p', 'force-q'], reason: 'mutually exclusive' }],
      cotas: { lower: 'cota-lo', upper: 'cota-hi' }
    },
    forces: [
      { id: 'boot-x', kind: 'boot', anchor_scene: 'sesion-01/01-boot' },
      { id: 'force-p', kind: 'force', anchor_scene: 'sesion-01/01-p' },
      { id: 'force-q', kind: 'force', anchor_scene: 'sesion-01/01-q' },
      { id: 'force-r', kind: 'force', anchor_scene: 'sesion-01/01-r' }
    ],
    cotas: [
      { id: 'cota-lo', bound: 'lower', pole: 'colapso', anchor_scene: 'sesion-01/01-lo' },
      { id: 'cota-hi', bound: 'upper', pole: 'victoria', anchor_scene: 'sesion-01/01-hi' }
    ]
  });
}

describe('force-activation', () => {
  it('boot starts active when boot_always_on', () => {
    const reg = sampleRegistry();
    assert.deepEqual(initialActiveForces(reg), ['boot-x']);
  });

  it('valid activate → new active + anchor track ref', () => {
    const reg = sampleRegistry();
    const active = initialActiveForces(reg);
    const res = applyActivate(reg, active, 'force-p');
    assert.equal(res.ok, true);
    assert.deepEqual(res.active, ['boot-x', 'force-p']);
    assert.equal(res.ref.kind, 'force-scene');
    assert.equal(res.ref.uri, 'force://force-p/scene/sesion-01/01-p');
  });

  it('3rd force exceeds session_budget (dry-run explicable)', () => {
    const reg = sampleRegistry();
    let active = initialActiveForces(reg);
    assert.equal(applyActivate(reg, active, 'force-p').ok, true);
    active = ['boot-x', 'force-p'];
    const dry = explainActivate(reg, active, 'force-r');
    assert.equal(dry.ok, false);
    assert.equal(dry.error, 'session_budget_exceeded');
    assert.equal(dry.detail.max_active_forces, 2);
    assert.equal(dry.detail.attempted, 3);
    assert.equal(applyActivate(reg, active, 'force-r').ok, false);
  });

  it('excluded pair rejected with pair_excluded', () => {
    const active = ['boot-x', 'force-p'];
    // budget full already — use max=3 registry for pair test isolation
    const wide = normalizeForceRegistry({
      boot: 'boot-x',
      activation: {
        session_budget: { max_active_forces: 3, boot_always_on: true },
        exclusions: [{ pair: ['force-p', 'force-q'], reason: 'mutually exclusive' }]
      },
      forces: [
        { id: 'boot-x', kind: 'boot', anchor_scene: 'sesion-01/01-boot' },
        { id: 'force-p', kind: 'force', anchor_scene: 'sesion-01/01-p' },
        { id: 'force-q', kind: 'force', anchor_scene: 'sesion-01/01-q' }
      ],
      cotas: []
    });
    const dry = explainActivate(wide, active, 'force-q');
    assert.equal(dry.ok, false);
    assert.equal(dry.error, 'pair_excluded');
    assert.equal(dry.detail.other, 'force-p');
  });

  it('deactivate non-boot; boot stays locked', () => {
    const reg = sampleRegistry();
    const active = ['boot-x', 'force-p'];
    assert.equal(explainDeactivate(reg, active, 'boot-x').error, 'boot_no_desactivable');
    const off = applyDeactivate(reg, active, 'force-p');
    assert.equal(off.ok, true);
    assert.deepEqual(off.active, ['boot-x']);
  });

  it('forceAnchorTrackRef + cotasSnapshot poles', () => {
    const reg = sampleRegistry();
    assert.equal(forceAnchorTrackRef('x', 'bad'), null);
    const mid = cotasSnapshot(reg, {});
    assert.equal(mid.pole, 'entre');
    assert.equal(mid.t, 0.5);
    assert.equal(cotasSnapshot(reg, { collapsed: true }).pole, 'colapso');
    assert.equal(cotasSnapshot(reg, { victory: true }).pole, 'victoria');
    assert.equal(cotasSnapshot(reg, { collapsed: true }).lowerTrack.uri, 'force://cota-lo/scene/sesion-01/01-lo');
  });
});
