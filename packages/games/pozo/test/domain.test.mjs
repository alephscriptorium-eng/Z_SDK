/**
 * Tests del dominio pozo: join, draw_drop, feed drip, rechazos.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPozoDomainState } from '../src/domain.mjs';
import { makeIntent, POZO_SCENE } from '../src/contract.mjs';

describe('pozo domain', () => {
  it('join spawnea en orilla e idempotente', () => {
    const d = createPozoDomainState({ now: () => 1000 });
    assert.equal(d.applyIntent(makeIntent('uno', 'join', {})).ok, true);
    assert.equal(d.snapshot('t').actors.uno.nodeId, 'orilla');
    assert.equal(d.applyIntent(makeIntent('uno', 'join', {})).ok, true);
    assert.equal(Object.keys(d.snapshot('t').actors).length, 1);
  });

  it('draw_drop asienta ledger label y baja el pozo', () => {
    let t = 2000;
    const d = createPozoDomainState({ now: () => t });
    d.applyIntent(makeIntent('uno', 'join', {}));
    const levelBefore = d.snapshot('t').well.level;
    const r = d.applyIntent(makeIntent('uno', 'draw_drop', { label: 'eco' }));
    assert.equal(r.ok, true);
    const snap = d.snapshot('t');
    assert.equal(snap.well.level, levelBefore - 1);
    assert.equal(snap.well.lastDrop.label, 'eco');
    assert.equal(snap.well.lastDrop.actorId, 'uno');
    const out = d.drainOutbox();
    assert.equal(out.ledger.length, 1);
    assert.equal(out.ledger[0].kind, 'label');
    assert.equal(out.ledger[0].label, 'eco');
    assert.equal(out.ledger[0].seq, 1);
    assert.equal(out.tracks.length, 1);
    t = 3000;
  });

  it('rechaza draw_drop sin join / sin label / pozo seco', () => {
    const d = createPozoDomainState({ now: () => 1 });
    assert.equal(d.applyIntent(makeIntent('uno', 'draw_drop', { label: 'x' })).error, 'actor_desconocido');
    d.applyIntent(makeIntent('uno', 'join', {}));
    assert.equal(d.applyIntent(makeIntent('uno', 'draw_drop', { label: '  ' })).error, 'label_requerido');

    const start = POZO_SCENE.well.startLevel;
    for (let i = 0; i < start; i++) {
      assert.equal(d.applyIntent(makeIntent('uno', 'draw_drop', { label: `d${i}` })).ok, true);
    }
    assert.equal(d.applyIntent(makeIntent('uno', 'draw_drop', { label: 'extra' })).error, 'pozo_seco');
  });

  it('tick del feed rellena el pozo hasta capacity', () => {
    const d = createPozoDomainState({ now: () => 1 });
    d.applyIntent(makeIntent('uno', 'join', {}));
    for (let i = 0; i < POZO_SCENE.well.startLevel; i++) {
      d.applyIntent(makeIntent('uno', 'draw_drop', { label: `x${i}` }));
    }
    assert.equal(d.snapshot('t').well.level, 0);
    // dripPerSec 0.15 → ~7s para 1 gota
    d.tick(7, 1);
    assert.ok(d.snapshot('t').well.level >= 1);
    d.tick(100, 1);
    assert.equal(d.snapshot('t').well.level, POZO_SCENE.well.capacity);
  });

  it('validateIntent rechaza rol no autorizado', () => {
    const d = createPozoDomainState({ now: () => 1 });
    const bad = makeIntent('uno', 'draw_drop', { label: 'x' }, { from: 'uno', role: 'dj' });
    // draw_drop solo player — role dj → rol_no_autorizado
    const r = d.applyIntent(bad);
    assert.equal(r.ok, false);
    assert.equal(r.error, 'rol_no_autorizado');
  });
});
