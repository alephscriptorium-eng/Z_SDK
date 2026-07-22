/**
 * ACL direccional — default deny donde hay poder real.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POWER,
  isPower,
  capabilityScope,
  parseCapabilityScope,
  hasCapability,
  authorizeAcl,
  createAclPolicy,
  assertIntentAcl,
  setOwner,
  ownerOf,
  GATES
} from '../src/index.mjs';

test('POWER + G-PROTO.6 documentados', () => {
  assert.equal(isPower(POWER.DESTRUCTIVE), true);
  assert.equal(isPower('admin'), false);
  assert.equal(GATES.ACL_DEFAULT_DENY_POWER, 'G-PROTO.6');
});

test('capabilityScope / parse round-trip', () => {
  const scope = capabilityScope(POWER.DESTRUCTIVE, 'go:barrio:salud');
  assert.equal(scope, 'cap:destructive:go:barrio:salud');
  assert.deepEqual(parseCapabilityScope(scope), {
    power: 'destructive',
    resourceId: 'go:barrio:salud'
  });
  assert.equal(parseCapabilityScope('role:player'), null);
});

test('read/idempotent default allow (sin capability ni owner)', () => {
  for (const power of [POWER.READ, POWER.IDEMPOTENT]) {
    const res = authorizeAcl({
      subject: 'alice',
      resource: 'go:barrio:x',
      power
    });
    assert.equal(res.ok, true);
    assert.equal(res.reason, 'default_allow_safe');
  }
});

test('mutate default deny → owner allow (rojo→verde)', () => {
  const denied = authorizeAcl({
    subject: 'alice',
    resource: 'go:barrio:salud',
    power: POWER.MUTATE
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.error, 'acl_denied');

  const ownership = new Map();
  setOwner(ownership, 'go:barrio:salud', 'alice');
  assert.equal(ownerOf(ownership, 'go:barrio:salud'), 'alice');

  const allowed = authorizeAcl({
    subject: 'alice',
    resource: 'go:barrio:salud',
    power: POWER.MUTATE,
    ownership
  });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.reason, 'ownership');

  const stranger = authorizeAcl({
    subject: 'bob',
    resource: 'go:barrio:salud',
    power: POWER.MUTATE,
    ownership
  });
  assert.equal(stranger.ok, false);
  assert.equal(stranger.error, 'acl_denied');
});

test('destructive niega ownership; exige capability explícita', () => {
  const ownership = new Map([['go:svc:alpha', 'alice']]);
  const asOwner = authorizeAcl({
    subject: 'alice',
    resource: 'go:svc:alpha',
    power: POWER.DESTRUCTIVE,
    ownership
  });
  assert.equal(asOwner.ok, false);
  assert.equal(asOwner.error, 'capability_required');

  const withCap = authorizeAcl({
    subject: 'alice',
    resource: 'go:svc:alpha',
    power: POWER.DESTRUCTIVE,
    ownership,
    capabilities: [capabilityScope(POWER.DESTRUCTIVE, 'go:svc:alpha')]
  });
  assert.equal(withCap.ok, true);
  assert.equal(withCap.reason, 'capability');
});

test('wildcard cap:mutate:* autoriza mutate; no destructive', () => {
  assert.equal(
    hasCapability(['cap:mutate:*'], POWER.MUTATE, 'go:any'),
    true
  );
  assert.equal(
    hasCapability(['cap:mutate:*'], POWER.DESTRUCTIVE, 'go:any'),
    false
  );
  assert.equal(
    hasCapability(['cap:destructive:*'], POWER.MUTATE, 'go:any'),
    true
  );
});

test('assertIntentAcl: política + default resource fields', () => {
  const policy = createAclPolicy({
    'health.smoke': { power: POWER.IDEMPOTENT },
    'health.stop': { power: POWER.DESTRUCTIVE },
    'barrio.annotate': { power: POWER.MUTATE }
  });

  const smoke = assertIntentAcl(
    { actorId: 'alice', intent: 'health.smoke', barrioId: 'go:barrio:a' },
    policy
  );
  assert.equal(smoke.ok, true);
  assert.equal(smoke.power, POWER.IDEMPOTENT);

  const stopDenied = assertIntentAcl(
    { actorId: 'alice', intent: 'health.stop', resourceId: 'go:barrio:a' },
    policy
  );
  assert.equal(stopDenied.ok, false);
  assert.equal(stopDenied.error, 'capability_required');

  const stopOk = assertIntentAcl(
    {
      actorId: 'alice',
      intent: 'health.stop',
      resourceId: 'go:barrio:a',
      peerCard: {
        scopes: [capabilityScope(POWER.DESTRUCTIVE, 'go:barrio:a')]
      }
    },
    policy
  );
  assert.equal(stopOk.ok, true);

  const ownership = new Map([['go:barrio:a', 'alice']]);
  const annotate = assertIntentAcl(
    { actorId: 'alice', intent: 'barrio.annotate', resourceId: 'go:barrio:a' },
    policy,
    { ownership }
  );
  assert.equal(annotate.ok, true);
  assert.equal(annotate.reason, 'ownership');
});

test('assertIntentAcl: intent fuera de política = ok (solo roles)', () => {
  const policy = createAclPolicy({
    'health.stop': { power: POWER.DESTRUCTIVE }
  });
  const res = assertIntentAcl(
    { actorId: 'alice', intent: 'join' },
    policy
  );
  assert.equal(res.ok, true);
  assert.equal(res.reason, 'not_in_acl_policy');
});
