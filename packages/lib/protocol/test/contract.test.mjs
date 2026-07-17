import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROTOCOL_VERSION,
  EVENTS,
  EVENT_KINDS,
  makeEnvelope,
  makeIntent,
  isIntentShaped,
  validateIntent,
  createIntentCatalog
} from '../src/index.mjs';

test('EVENT_KINDS are the four contract kinds', () => {
  assert.deepEqual([...EVENT_KINDS], ['state', 'intent', 'track', 'ledger']);
  assert.equal(EVENTS.STATE, 'state');
  assert.equal(EVENTS.INTENT, 'intent');
});

test('makeEnvelope requires game + valid kind', () => {
  const env = makeEnvelope({ game: 'demo', kind: 'state', from: 'auth', tick: 1 });
  assert.equal(env.v, PROTOCOL_VERSION);
  assert.equal(env.game, 'demo');
  assert.equal(env.kind, 'state');
  assert.equal(env.tick, 1);
  assert.throws(() => makeEnvelope({ game: '', kind: 'state' }), /game/);
  assert.throws(() => makeEnvelope({ game: 'demo', kind: 'nope' }), /kind/);
});

test('makeIntent preserves string-from signature and options object', () => {
  const a = makeIntent('uno', 'join', { kind: 'player' }, 'uno');
  assert.equal(a.actorId, 'uno');
  assert.equal(a.intent, 'join');
  assert.equal(a.from, 'uno');
  assert.equal(a.kind, 'player');
  assert.equal(a.v, PROTOCOL_VERSION);

  const b = makeIntent('uno', 'join', {}, { from: 'bot', game: 'demo', role: 'player' });
  assert.equal(b.game, 'demo');
  assert.equal(b.role, 'player');
  assert.equal(b.from, 'bot');
});

test('isIntentShaped + validateIntent with catalog', () => {
  const catalog = createIntentCatalog({
    join: { roles: ['player'] },
    curate: { roles: ['dj'] }
  });
  assert.equal(isIntentShaped(null), false);
  assert.equal(isIntentShaped({ actorId: 'x', intent: 'join' }, catalog), true);
  assert.equal(isIntentShaped({ actorId: 'x', intent: 'nope' }, catalog), false);

  assert.equal(validateIntent(makeIntent('x', 'join'), catalog).ok, true);
  assert.equal(validateIntent({ actorId: 'x' }, catalog).error, 'intent_malformada');
});
