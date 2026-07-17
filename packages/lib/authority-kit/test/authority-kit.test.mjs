/**
 * Tests de @zeus/authority-kit — comportamiento con client/rooms inyectados.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  startAuthority,
  normalizeEvents,
  resolveContentRevSnapshotOpts,
  PROTOCOL_EVENTS
} from '../src/index.mjs';

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
  it('aplica intent → publica ledger + state en eventos canónicos', async () => {
    const fake = createFakeClient();
    const domain = createDomain();
    const accepted = [];

    const auth = await startAuthority({
      user: 'auth-test',
      room: 'ROOM_T',
      tickMs: 60_000,
      domain,
      events: PROTOCOL_EVENTS,
      createClient: () => fake,
      connectAndJoin: async () => ({ room: 'ROOM_T', socketId: '1' }),
      installSignalHandlers: false,
      exitOnSignal: null,
      onIntentAccepted: (p) => accepted.push(p),
      log: () => {},
      warn: () => {}
    });

    // publishState inicial
    assert.ok(fake.published.some((p) => p.event === 'state'));

    fake.io.emit('intent', { actorId: 'uno', intent: 'join' });
    assert.equal(accepted.length, 1);
    assert.ok(fake.published.some((p) => p.event === 'ledger'));
    assert.ok(
      fake.published.filter((p) => p.event === 'state').length >= 2,
      'state tras intent'
    );

    await auth.stop(null);
    assert.equal(fake.io.closed, true);
  });

  it('rechaza intent sin publicar state de change', async () => {
    const fake = createFakeClient();
    const domain = createDomain();
    const rejected = [];
    const before = fake.published.length;

    const auth = await startAuthority({
      user: 'auth-test',
      room: 'ROOM_T',
      tickMs: 60_000,
      domain,
      createClient: () => fake,
      connectAndJoin: async () => ({ room: 'ROOM_T' }),
      installSignalHandlers: false,
      exitOnSignal: null,
      onIntentRejected: (p, err) => rejected.push({ p, err }),
      log: () => {},
      warn: () => {}
    });

    const afterBoot = fake.published.length;
    assert.ok(afterBoot > before);

    fake.io.emit('intent', { actorId: 'uno', intent: 'bad' });
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].err, 'rechazo_test');
    assert.equal(fake.published.length, afterBoot, 'no publica en rechazo');
    await auth.stop(null);
  });

  it('dual-wire: publica state en canónico + alias', async () => {
    const fake = createFakeClient();
    const domain = createDomain({ withRev: false });

    const auth = await startAuthority({
      user: 'auth-test',
      room: 'ROOM_T',
      tickMs: 60_000,
      domain,
      events: {
        STATE: ['state', 'arg:state'],
        INTENT: ['intent', 'arg:intent'],
        TRACK: ['track', 'arg:track'],
        LEDGER: ['ledger', 'arg:ledger']
      },
      createClient: () => fake,
      connectAndJoin: async () => ({ room: 'ROOM_T' }),
      installSignalHandlers: false,
      exitOnSignal: null,
      log: () => {},
      warn: () => {}
    });

    const stateEvents = fake.published.filter((p) => p.event === 'state' || p.event === 'arg:state');
    assert.ok(stateEvents.some((p) => p.event === 'state'));
    assert.ok(stateEvents.some((p) => p.event === 'arg:state'));

    fake.io.emit('arg:intent', { actorId: 'dos', intent: 'join' });
    assert.ok(fake.published.some((p) => p.event === 'arg:ledger'));
    assert.ok(fake.published.some((p) => p.event === 'ledger'));
    await auth.stop(null);
  });

  it('onShutdown se invoca al stop', async () => {
    const fake = createFakeClient();
    let closed = false;
    const auth = await startAuthority({
      user: 'auth-test',
      room: 'ROOM_T',
      tickMs: 60_000,
      domain: createDomain({ withRev: false }),
      createClient: () => fake,
      connectAndJoin: async () => ({ room: 'ROOM_T' }),
      installSignalHandlers: false,
      exitOnSignal: null,
      onShutdown: async () => {
        closed = true;
      },
      log: () => {},
      warn: () => {}
    });
    await auth.stop(null);
    assert.equal(closed, true);
  });

  it('snapshotBudget avisa si se excede (no bloquea publicación)', async () => {
    const fake = createFakeClient();
    const warnings = [];
    const domain = createDomain({ withRev: false });
    domain.snapshot = () => ({ huge: 'x'.repeat(40_000) });

    const auth = await startAuthority({
      user: 'auth-test',
      room: 'ROOM_T',
      tickMs: 60_000,
      domain,
      snapshotBudget: true,
      createClient: () => fake,
      connectAndJoin: async () => ({ room: 'ROOM_T' }),
      installSignalHandlers: false,
      exitOnSignal: null,
      log: () => {},
      warn: (...args) => warnings.push(args.join(' '))
    });

    assert.ok(warnings.some((w) => /over budget/.test(w)));
    assert.ok(fake.published.some((p) => p.event === 'state'));
    await auth.stop(null);
  });
});
