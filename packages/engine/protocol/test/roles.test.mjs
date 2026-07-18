import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIntentCatalog,
  assertIntentRole,
  validateIntent,
  makeIntent,
  intentAllowsRole,
  ROLES
} from '../src/index.mjs';

const catalog = createIntentCatalog({
  join: { roles: ['player'] },
  move: { roles: ['player'] },
  curate: { roles: ['dj'] },
  inspect: { roles: ['operator', 'dj'] }
});

test('ROLES are player|dj|operator', () => {
  assert.deepEqual([...ROLES], ['player', 'dj', 'operator']);
});

test('player intent ok; dj on player-only intent rejected', () => {
  const ok = validateIntent(
    makeIntent('uno', 'move', { nodeId: 'a' }, { game: 'demo' }),
    catalog
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.role, 'player');

  const bad = validateIntent(
    makeIntent('uno', 'move', { nodeId: 'a' }, { game: 'demo', role: 'dj' }),
    catalog
  );
  assert.equal(bad.ok, false);
  assert.equal(bad.error, 'rol_no_autorizado');
});

test('dj-only intent rejects player role', () => {
  const asPlayer = validateIntent(
    makeIntent('dj1', 'curate', { lineId: 'L1' }, { game: 'demo' }),
    catalog
  );
  assert.equal(asPlayer.ok, false);
  assert.equal(asPlayer.error, 'rol_no_autorizado');

  const asDj = validateIntent(
    makeIntent('dj1', 'curate', { lineId: 'L1' }, { game: 'demo', role: 'dj' }),
    catalog
  );
  assert.equal(asDj.ok, true);
});

test('operator role accepted when listed', () => {
  assert.equal(intentAllowsRole('inspect', 'operator', catalog), true);
  assert.equal(intentAllowsRole('inspect', 'player', catalog), false);
  const res = assertIntentRole(
    makeIntent('op', 'inspect', {}, { game: 'demo', role: 'operator' }),
    catalog
  );
  assert.equal(res.ok, true);
});

test('unknown role rejected', () => {
  const res = assertIntentRole(
    makeIntent('x', 'join', {}, { game: 'demo', role: 'admin' }),
    catalog
  );
  assert.equal(res.ok, false);
  assert.equal(res.error, 'rol_desconocido');
});
