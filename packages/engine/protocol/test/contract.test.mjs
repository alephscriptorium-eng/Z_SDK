import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROTOCOL_VERSION,
  EVENTS,
  EVENT_KINDS,
  EVENT_META,
  makeEnvelope,
  makeIntent,
  isShaped,
  isIntentShaped,
  validateIntent,
  createIntentCatalog
} from '../src/index.mjs';

test('EVENT_KINDS are the four contract kinds', () => {
  assert.deepEqual([...EVENT_KINDS], ['state', 'intent', 'track', 'ledger']);
  assert.equal(EVENTS.STATE, 'state');
  assert.equal(EVENTS.INTENT, 'intent');
});

test('EVENT_META covers every EVENT_KIND', () => {
  for (const kind of EVENT_KINDS) {
    assert.ok(EVENT_META[kind], `missing EVENT_META[${kind}]`);
    assert.ok(Array.isArray(EVENT_META[kind].payload.required));
  }
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

test('isShaped accepts valid envelopes and rejects invalid per kind', () => {
  const intentOk = {
    v: PROTOCOL_VERSION,
    game: 'demo',
    actorId: 'uno',
    intent: 'join',
    ts: 1
  };
  assert.equal(isShaped('intent', intentOk), true);
  assert.equal(isShaped('intent', { ...intentOk, game: '' }), false);
  assert.equal(isShaped('intent', { actorId: 'uno', intent: 'join' }), false);

  const stateOk = makeEnvelope({ game: 'demo', kind: 'state', tick: 2 });
  assert.equal(isShaped('state', stateOk), true);
  assert.equal(isShaped('state', { v: 1, game: 'demo' }), false); // falta ts

  const trackOk = makeEnvelope({
    game: 'demo',
    kind: 'track',
    actorId: 'uno',
    hint: 'cache-browser'
  });
  assert.equal(isShaped('track', trackOk), true);
  assert.equal(isShaped('track', { v: 1, game: 'demo', ts: 1 }), false); // falta actorId

  const ledgerOk = makeEnvelope({
    game: 'demo',
    kind: 'ledger',
    seq: 0,
    entryKind: 'join'
  });
  assert.equal(isShaped('ledger', ledgerOk), true);
  assert.equal(isShaped('ledger', { v: 1, game: 'demo', ts: 1, kind: 'ledger' }), false); // falta seq

  assert.equal(isShaped('nope', intentOk), false);
  assert.equal(isShaped('state', null), false);
});
