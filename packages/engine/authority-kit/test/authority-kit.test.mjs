/**
 * Tests de @zeus/authority-kit — comportamiento con client/rooms inyectados.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startAuthority,
  normalizeEvents,
  resolveContentRevSnapshotOpts,
  PROTOCOL_EVENTS,
  issuePeerCard
} from '../src/index.mjs';

const GAME = 'kit-test';

function createFakeIo() {
  /** @type {Map<string, Function[]>} */
  const handlers = new Map();
  return {
    on(event, fn) {
      const list = handlers.get(event) ?? [];
      list.push(fn);
      handlers.set(event, list);
    },
    emit(event, data) {
      for (const fn of handlers.get(event) ?? []) fn(data);
    },
    close() {
      this.closed = true;
    },
    closed: false,
    _handlers: handlers
  };
}

function createFakeClient() {
  const io = createFakeIo();
  /** @type {Array<{ event: string, payload: object, room: string }>} */
  const published = [];
  return {
    io,
    published,
    room(event, payload, room) {
      published.push({ event, payload, room });
    }
  };
}

function createDomain(opts = {}) {
  const ledger = [];
  const tracks = [];
  let rev = 0;
  let tickCount = 0;
  return {
    applyIntent(payload) {
      if (payload?.intent === 'bad') return { ok: false, error: 'rechazo_test' };
      if (opts.onApply) opts.onApply(payload);
      ledger.push({ kind: 'ok', intent: payload.intent, actorId: payload.actorId });
      if (opts.emitTrack) {
        tracks.push({ actorId: payload.actorId, hint: 'test-browser', ref: { kind: 'nodo' } });
      }
      return { ok: true, error: null };
    },
    tick() {
      tickCount += 1;
      if (opts.bumpRevOnTick) rev += 1;
    },
    snapshot(reason, snapOpts = {}) {
      return { reason, tick: tickCount, full: Boolean(snapOpts.full), rev };
    },
    drainOutbox() {
      const out = { ledger: [...ledger], tracks: [...tracks] };
      ledger.length = 0;
      tracks.length = 0;
      return out;
    },
    contentRev: opts.withRev === false ? undefined : () => rev,
    _setRev(n) {
      rev = n;
    },
    get tickCount() {
      return tickCount;
    }
  };
}

/** @param {Partial<object>} extra */
function baseOpts(extra = {}) {
  return {
    user: 'auth-test',
    room: 'ROOM_T',
    game: GAME,
    tickMs: 60_000,
    installSignalHandlers: false,
    exitOnSignal: null,
    log: () => {},
    warn: () => {},
    ...extra
  };
}

describe('normalizeEvents', () => {
  it('default = kinds canónicos de protocol', () => {
    assert.deepEqual(normalizeEvents(), {
      STATE: [PROTOCOL_EVENTS.STATE],
      INTENT: [PROTOCOL_EVENTS.INTENT],
      TRACK: [PROTOCOL_EVENTS.TRACK],
      LEDGER: [PROTOCOL_EVENTS.LEDGER]
    });
  });

  it('acepta alias string y listas (migración wire)', () => {
    const n = normalizeEvents({
      STATE: ['state', 'arg:state'],
      INTENT: 'arg:intent',
      TRACK: 'arg:track',
      LEDGER: 'arg:ledger'
    });
    assert.deepEqual(n.STATE, ['state', 'arg:state']);
    assert.deepEqual(n.INTENT, ['arg:intent']);
  });
});

describe('resolveContentRevSnapshotOpts', () => {
  it('sin contentRev ⇒ opts vacíos / isFull', () => {
    const r = resolveContentRevSnapshotOpts({
      domain: {},
      now: 1000,
      lastContentRev: NaN,
      lastFullAt: 0,
      heartbeatMs: 1000
    });
    assert.equal(r.isFull, true);
    assert.deepEqual(r.opts, {});
  });

  it('con contentRev: full cuando cambia rev o vence heartbeat', () => {
    const domain = { contentRev: () => 2 };
    const changed = resolveContentRevSnapshotOpts({
      domain,
      now: 500,
      lastContentRev: 1,
      lastFullAt: 0,
      heartbeatMs: 1000
    });
    assert.equal(changed.isFull, true);
    assert.deepEqual(changed.opts, { full: true });

    const heartbeat = resolveContentRevSnapshotOpts({
      domain,
      now: 2000,
      lastContentRev: 2,
      lastFullAt: 500,
      heartbeatMs: 1000
    });
    assert.equal(heartbeat.isFull, true);

    const compact = resolveContentRevSnapshotOpts({
      domain,
      now: 800,
      lastContentRev: 2,
      lastFullAt: 500,
      heartbeatMs: 1000
    });
    assert.equal(compact.isFull, false);
    assert.deepEqual(compact.opts, { full: false });
  });
});

describe('startAuthority', () => {
  it('exige game (string no vacío)', async () => {
    const fake = createFakeClient();
    await assert.rejects(
      () =>
        startAuthority(
          baseOpts({
            game: undefined,
            domain: createDomain(),
            createClient: () => fake,
            connectAndJoin: async () => ({ room: 'ROOM_T' })
          })
        ),
      /game/
    );
    await assert.rejects(
      () =>
        startAuthority(
          baseOpts({
            game: '',
            domain: createDomain(),
            createClient: () => fake,
            connectAndJoin: async () => ({ room: 'ROOM_T' })
          })
        ),
      /game/
    );
  });

  it('publica state|track|ledger con payload.game vía makeEnvelope', async () => {
    const fake = createFakeClient();
    const domain = createDomain({ emitTrack: true });
    const accepted = [];

    const auth = await startAuthority(
      baseOpts({
        domain,
        events: PROTOCOL_EVENTS,
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T', socketId: '1' }),
        onIntentAccepted: (p) => accepted.push(p)
      })
    );

    const bootState = fake.published.find((p) => p.event === 'state');
    assert.ok(bootState);
    assert.equal(bootState.payload.game, GAME);
    assert.equal(bootState.payload.from, 'auth-test');
    assert.equal(bootState.payload.reason, 'change');

    fake.io.emit('intent', { actorId: 'uno', intent: 'join' });
    assert.equal(accepted.length, 1);

    const ledgerPub = fake.published.filter((p) => p.event === 'ledger');
    assert.ok(ledgerPub.length >= 1);
    for (const p of ledgerPub) {
      assert.equal(p.payload.game, GAME);
      assert.equal(p.payload.kind, 'ok');
      assert.equal(p.payload.entryKind, 'ok');
    }

    const trackPub = fake.published.filter((p) => p.event === 'track');
    assert.ok(trackPub.length >= 1);
    for (const p of trackPub) {
      assert.equal(p.payload.game, GAME);
      assert.equal(p.payload.hint, 'test-browser');
    }

    const states = fake.published.filter((p) => p.event === 'state');
    assert.ok(states.length >= 2, 'state tras intent');
    for (const p of states) {
      assert.equal(p.payload.game, GAME);
    }

    await auth.stop(null);
    assert.equal(fake.io.closed, true);
  });

  it('rechaza intent sin publicar state de change', async () => {
    const fake = createFakeClient();
    const domain = createDomain();
    const rejected = [];
    const before = fake.published.length;

    const auth = await startAuthority(
      baseOpts({
        domain,
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T' }),
        onIntentRejected: (p, err) => rejected.push({ p, err })
      })
    );

    const afterBoot = fake.published.length;
    assert.ok(afterBoot > before);

    fake.io.emit('intent', { actorId: 'uno', intent: 'bad' });
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].err, 'rechazo_test');
    assert.equal(fake.published.length, afterBoot, 'no publica en rechazo');
    await auth.stop(null);
  });

  it('dual-wire: publica state en canónico + alias (mismo envelope game)', async () => {
    const fake = createFakeClient();
    const domain = createDomain({ withRev: false });

    const auth = await startAuthority(
      baseOpts({
        domain,
        events: {
          STATE: ['state', 'arg:state'],
          INTENT: ['intent', 'arg:intent'],
          TRACK: ['track', 'arg:track'],
          LEDGER: ['ledger', 'arg:ledger']
        },
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T' })
      })
    );

    const stateEvents = fake.published.filter((p) => p.event === 'state' || p.event === 'arg:state');
    assert.ok(stateEvents.some((p) => p.event === 'state'));
    assert.ok(stateEvents.some((p) => p.event === 'arg:state'));
    for (const p of stateEvents) {
      assert.equal(p.payload.game, GAME);
    }

    fake.io.emit('arg:intent', { actorId: 'dos', intent: 'join' });
    const ledgers = fake.published.filter((p) => p.event === 'arg:ledger' || p.event === 'ledger');
    assert.ok(ledgers.some((p) => p.event === 'arg:ledger'));
    assert.ok(ledgers.some((p) => p.event === 'ledger'));
    for (const p of ledgers) {
      assert.equal(p.payload.game, GAME);
    }
    await auth.stop(null);
  });

  it('onShutdown se invoca al stop', async () => {
    const fake = createFakeClient();
    let closed = false;
    const auth = await startAuthority(
      baseOpts({
        domain: createDomain({ withRev: false }),
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T' }),
        onShutdown: async () => {
          closed = true;
        }
      })
    );
    await auth.stop(null);
    assert.equal(closed, true);
  });

  it('snapshotBudget avisa si se excede (no bloquea publicación)', async () => {
    const fake = createFakeClient();
    const warnings = [];
    const domain = createDomain({ withRev: false });
    domain.snapshot = () => ({ huge: 'x'.repeat(40_000) });

    const auth = await startAuthority(
      baseOpts({
        domain,
        snapshotBudget: true,
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T' }),
        warn: (...args) => warnings.push(args.join(' '))
      })
    );

    assert.ok(warnings.some((w) => /over budget/.test(w)));
    const state = fake.published.find((p) => p.event === 'state');
    assert.ok(state);
    assert.equal(state.payload.game, GAME);
    await auth.stop(null);
  });

  it('emite peer-card al join (WP-U93)', async () => {
    const fake = createFakeClient();
    const domain = createDomain();
    const cards = [];

    const auth = await startAuthority(
      baseOpts({
        domain,
        peerCardEndpoint: 'http://test.local/runtime',
        createClient: () => fake,
        connectAndJoin: async () => ({ room: 'ROOM_T' }),
        onPeerCard: (card, intent) => cards.push({ card, intent })
      })
    );

    fake.io.emit('intent', { actorId: 'uno', intent: 'join', role: 'player' });
    assert.equal(cards.length, 1);
    assert.equal(cards[0].card.roomId, 'ROOM_T');
    assert.equal(cards[0].card.endpoint, 'http://test.local/runtime');
    assert.ok(cards[0].card.scopes.includes('role:player'));
    assert.equal(cards[0].card.sessionId, 'uno');
    assert.equal(auth.peerCards.get('uno'), cards[0].card);

    const explicit = auth.issuePeerCard({ role: 'dj', sessionId: 'dos' });
    assert.ok(explicit.scopes.includes('role:dj'));

    await auth.stop(null);
  });
});

describe('issuePeerCard', () => {
  it('construye card fresca con rol', () => {
    const card = issuePeerCard({
      roomId: 'R',
      endpoint: 'http://ep',
      role: 'operator',
      sessionId: 'op-1'
    });
    assert.equal(card.roomId, 'R');
    assert.ok(card.scopes.includes('role:operator'));
    assert.ok(card.scopes.includes('webrtc:signal'));
  });
});
