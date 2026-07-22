/**
 * Autoridad genérica: room client + tick + intents → reducer + state/ledger/track.
 * El dominio (applyIntent/tick/snapshot/drainOutbox) lo aporta el juego.
 * Node-only. Sin nombres de juego.
 *
 * `@zeus/rooms` se carga en diferido solo si no se inyectan createClient /
 * connectAndJoin (permite unit tests sin el grafo de socket deps).
 */

import {
  EVENTS as PROTOCOL_EVENTS,
  makeEnvelope,
  checkSnapshotBudget,
  SNAPSHOT_BUDGET_BYTES,
  diffGameState,
  isEmptyGameStateDelta,
  applyGameStateDelta,
  assertIntentAcl
} from '@zeus/protocol';
import {
  issuePeerCard,
  DEFAULT_JOIN_INTENTS
} from './issue-peer-card.mjs';

/**
 * @param {string|string[]} value
 * @returns {string[]}
 */
function asList(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Normaliza el mapa de eventos (string o lista por kind).
 * Default: kinds canónicos de `@zeus/protocol`.
 * `DELTA` es opcional (gamechannel `GAME_STATE_DELTA`); vacío ⇒ se publica
 * el delta en los nombres STATE con `mode: 'delta'`.
 *
 * @param {Partial<{ STATE: string|string[], INTENT: string|string[], TRACK: string|string[], LEDGER: string|string[], DELTA: string|string[] }>|null} [events]
 * @returns {{ STATE: string[], INTENT: string[], TRACK: string[], LEDGER: string[], DELTA: string[] }}
 */
export function normalizeEvents(events = null) {
  const src = events ?? PROTOCOL_EVENTS;
  return {
    STATE: asList(src.STATE ?? PROTOCOL_EVENTS.STATE),
    INTENT: asList(src.INTENT ?? PROTOCOL_EVENTS.INTENT),
    TRACK: asList(src.TRACK ?? PROTOCOL_EVENTS.TRACK),
    LEDGER: asList(src.LEDGER ?? PROTOCOL_EVENTS.LEDGER),
    DELTA: asList(src.DELTA)
  };
}

/**
 * Estrategia por defecto de presupuesto de snapshot: si el dominio expone
 * `contentRev()`, publica snapshot «lleno» cuando cambia la rev o vence el
 * heartbeat; si no, siempre opts vacíos (el dominio decide qué incluir).
 *
 * @param {object} ctx
 * @returns {{ opts: object, contentRev: number, isFull: boolean }}
 */
export function resolveContentRevSnapshotOpts(ctx) {
  const { domain, now, lastContentRev, lastFullAt, heartbeatMs } = ctx;
  if (typeof domain.contentRev !== 'function') {
    return { opts: {}, contentRev: lastContentRev, isFull: true };
  }
  const contentRev = domain.contentRev();
  const isFull =
    contentRev !== lastContentRev || now - lastFullAt >= heartbeatMs;
  return { opts: { full: isFull }, contentRev, isFull };
}

/**
 * Full en boot + cada `heartbeatMs`; entre medias, delta (GAME_STATE_DELTA).
 * No depende de `contentRev` (los cambios intermedios salen como parche).
 *
 * @param {object} ctx
 * @returns {{ opts: object, contentRev: number, isFull: boolean }}
 */
export function resolveStateDeltaSnapshotOpts(ctx) {
  const { now, lastFullAt, heartbeatMs, lastPublished } = ctx;
  const isFull = lastPublished == null || now - lastFullAt >= heartbeatMs;
  return {
    opts: { full: isFull, mode: isFull ? 'full' : 'delta' },
    contentRev: ctx.lastContentRev,
    isFull
  };
}

/**
 * @param {object} client
 * @param {string[]} names
 * @param {object} payload
 * @param {string} room
 */
function publishAll(client, names, payload, room) {
  for (const name of names) {
    client.room(name, payload, room);
  }
}

/**
 * @param {object} options
 * @returns {Promise<{ createClient: Function, connectAndJoin: Function }>}
 */
async function resolveRoomFns(options) {
  if (typeof options.createClient === 'function' && typeof options.connectAndJoin === 'function') {
    return {
      createClient: options.createClient,
      connectAndJoin: options.connectAndJoin
    };
  }
  const rooms = await import('@zeus/rooms');
  return {
    createClient: options.createClient ?? rooms.createClient,
    connectAndJoin: options.connectAndJoin ?? rooms.connectAndJoin
  };
}

/**
 * Arranca la autoridad: conecta a la room, escucha intents, tickea y publica.
 * `state` / `track` / `ledger` salen siempre vía `makeEnvelope` (campo `game`).
 *
 * @param {object} options
 * @param {string} options.user
 * @param {string} options.room
 * @param {string} options.game — id de juego (lo aporta el caller; el kit no hardcodea)
 * @param {number} [options.tickMs=100]
 * @param {number} [options.heartbeatMs=1000]
 * @param {object} options.domain — { applyIntent, tick, snapshot, drainOutbox, contentRev? }
 * @param {{ type?: string, features?: string[] }} [options.join]
 * @param {object} [options.events] — mapa kind→nombre(s) wire; default canónico (+ DELTA opcional)
 * @param {(ctx: object) => { opts: object, contentRev: number, isFull: boolean }} [options.resolveSnapshotOpts]
 * @param {boolean} [options.stateDelta=false] — full en boot/heartbeat; delta entre medias (GAME_STATE_DELTA)
 * @param {string[]} [options.deltaMapKeys] — claves Record a difar (default actors/anchors)
 * @param {boolean|((snap: object) => { ok: boolean, bytes: number, budget: number })} [options.snapshotBudget]
 * @param {() => Promise<void>|void} [options.onShutdown]
 * @param {(entry: object) => void} [options.onLedger]
 * @param {(payload: object) => void} [options.onIntentAccepted]
 * @param {(payload: object, error: string) => void} [options.onIntentRejected]
 * @param {object} [options.acl] — ACL direccional opt-in (G-PROTO.6)
 * @param {Map<string, { power: string, resourceFrom?: Function|null }>} [options.acl.policy] — createAclPolicy(…)
 * @param {Map<string, string>} [options.acl.ownership] — resourceId → owner actorId
 * @param {string} [options.peerCardEndpoint] — endpoint del peer-card (scriptorium URL)
 * @param {string[]} [options.joinIntents] — intents que emiten peer-card al aceptar (default: `join`)
 * @param {(card: object, intent: object) => void} [options.onPeerCard] — callback al emitir
 * @param {(msg: string, ...args: unknown[]) => void} [options.log]
 * @param {(msg: string, ...args: unknown[]) => void} [options.warn]
 * @param {Function} [options.createClient]
 * @param {Function} [options.connectAndJoin]
 * @param {boolean} [options.installSignalHandlers=true]
 * @param {number|null} [options.exitOnSignal=0]
 * @param {() => number} [options.now]
 * @returns {Promise<{ client: object, stop: (exitCode?: number|null) => Promise<void>, publishState: (reason: string) => object, publishOutbox: () => number, events: object, game: string, issuePeerCard: Function, peerCards: Map<string, object>, ownership: Map<string, string>|null }>}
 */
export async function startAuthority(options) {
  const {
    user,
    room,
    game,
    tickMs = 100,
    heartbeatMs = 1000,
    domain,
    join = {},
    events: eventsOpt = null,
    resolveSnapshotOpts: resolveSnapshotOptsOpt = null,
    stateDelta = false,
    deltaMapKeys = undefined,
    snapshotBudget = false,
    onShutdown = null,
    onLedger = null,
    onIntentAccepted = null,
    onIntentRejected = null,
    acl: aclOpt = null,
    peerCardEndpoint: peerCardEndpointOpt = null,
    joinIntents: joinIntentsOpt = null,
    onPeerCard = null,
    log = console.log.bind(console),
    warn = console.warn.bind(console),
    installSignalHandlers = true,
    exitOnSignal = 0,
    now = () => Date.now()
  } = options;

  if (!user || typeof user !== 'string') {
    throw new TypeError('startAuthority: user (string) es obligatorio');
  }
  if (!room || typeof room !== 'string') {
    throw new TypeError('startAuthority: room (string) es obligatorio');
  }
  if (typeof game !== 'string' || !game) {
    throw new TypeError('startAuthority: game (string no vacío) es obligatorio');
  }
  if (!domain || typeof domain.applyIntent !== 'function') {
    throw new TypeError('startAuthority: domain.applyIntent es obligatorio');
  }
  if (typeof domain.tick !== 'function') {
    throw new TypeError('startAuthority: domain.tick es obligatorio');
  }
  if (typeof domain.snapshot !== 'function') {
    throw new TypeError('startAuthority: domain.snapshot es obligatorio');
  }
  if (typeof domain.drainOutbox !== 'function') {
    throw new TypeError('startAuthority: domain.drainOutbox es obligatorio');
  }

  const { createClient, connectAndJoin } = await resolveRoomFns(options);
  const events = normalizeEvents(eventsOpt);
  const resolveSnapshotOpts =
    resolveSnapshotOptsOpt ??
    (stateDelta ? resolveStateDeltaSnapshotOpts : resolveContentRevSnapshotOpts);
  const budgetChecker =
    snapshotBudget === true
      ? (snap) => checkSnapshotBudget(snap, SNAPSHOT_BUDGET_BYTES)
      : typeof snapshotBudget === 'function'
        ? snapshotBudget
        : null;

  const joinIntentSet = new Set(joinIntentsOpt ?? DEFAULT_JOIN_INTENTS);
  /** @type {Map<string, object>} */
  const peerCards = new Map();
  const aclPolicy =
    aclOpt && aclOpt.policy && typeof aclOpt.policy.get === 'function'
      ? aclOpt.policy
      : null;
  /** @type {Map<string, string>|null} */
  const ownership =
    aclOpt && aclOpt.ownership instanceof Map
      ? aclOpt.ownership
      : aclPolicy
        ? new Map()
        : null;
  let peerCardEndpoint = peerCardEndpointOpt;

  if (!peerCardEndpoint) {
    try {
      const rooms = await import('@zeus/rooms');
      peerCardEndpoint = rooms.config?.url ?? null;
    } catch {
      peerCardEndpoint = null;
    }
  }

  /**
   * Emite peer-card acotado a esta sala (WP-U93).
   * @param {object} opts
   */
  function issueRoomPeerCard(opts = {}) {
    if (!peerCardEndpoint) {
      throw new TypeError(
        'startAuthority: peerCardEndpoint requerido para emitir peer-card (pásalo o configura ZEUS_SCRIPTORIUM_URL)'
      );
    }
    return issuePeerCard({
      roomId: room,
      endpoint: peerCardEndpoint,
      ...opts
    });
  }

  const client = createClient(user, { room });
  let lastFullAt = 0;
  let lastContentRev = Number.NaN;
  /** @type {object|null} */
  let lastPublished = null;
  let interval = null;
  let stopped = false;
  const signalCleanups = [];

  function publishState(reason) {
    const t = now();
    const resolved = resolveSnapshotOpts({
      domain,
      now: t,
      lastContentRev,
      lastFullAt,
      heartbeatMs,
      lastPublished
    });

    // stateDelta: siempre pedimos full interno para difar; legado: respeta opts del resolver
    const snapOpts = stateDelta ? { ...resolved.opts, full: true } : resolved.opts;
    const snapshot = domain.snapshot(reason, snapOpts);

    let outbound = snapshot;
    let publishNames = events.STATE;
    let isFullPublish = resolved.isFull;

    if (stateDelta && !resolved.isFull && lastPublished != null) {
      const delta = diffGameState(lastPublished, snapshot, {
        reason,
        ...(deltaMapKeys ? { mapKeys: deltaMapKeys } : {})
      });
      if (isEmptyGameStateDelta(delta, deltaMapKeys) && reason === 'heartbeat') {
        return lastPublished;
      }
      outbound = delta;
      isFullPublish = false;
      publishNames = events.DELTA.length > 0 ? events.DELTA : events.STATE;
    } else if (stateDelta) {
      outbound = snapshot.mode == null ? { mode: 'full', ...snapshot } : snapshot;
      isFullPublish = true;
      publishNames = events.STATE;
    }

    if (isFullPublish || (!stateDelta && resolved.isFull)) {
      lastFullAt = t;
      lastContentRev = resolved.contentRev;
    }

    if (budgetChecker) {
      const budget = budgetChecker(outbound);
      if (!budget.ok) {
        warn(
          `[${user}] snapshot over budget: ${budget.bytes} > ${budget.budget} bytes (reason=${reason})`
        );
      }
    }
    const { kind: _snapKind, ...snapRest } = outbound;
    const payload = makeEnvelope({
      game,
      kind: PROTOCOL_EVENTS.STATE,
      from: user,
      ts: outbound.ts ?? t,
      ...snapRest
    });
    publishAll(client, publishNames, payload, room);

    if (stateDelta) {
      if (isFullPublish) {
        lastPublished = { ...snapshot, mode: 'full' };
      } else {
        const applied = applyGameStateDelta(lastPublished, outbound, {
          ...(deltaMapKeys ? { mapKeys: deltaMapKeys } : {})
        });
        lastPublished = applied.ok ? applied.state : { ...snapshot, mode: 'full' };
      }
    }

    return outbound;
  }

  function publishOutbox() {
    const out = domain.drainOutbox();
    const t = now();
    for (const track of out.tracks) {
      const { kind: _trackKind, ...trackRest } = track;
      const payload = makeEnvelope({
        game,
        kind: PROTOCOL_EVENTS.TRACK,
        from: user,
        ts: track.ts ?? t,
        ...trackRest
      });
      publishAll(client, events.TRACK, payload, room);
    }
    for (const entry of out.ledger) {
      // El discriminante de hecho del juego vive hoy en `kind` (label/burst/…).
      // makeEnvelope exige kind ∈ state|intent|track|ledger; se separa a
      // entryKind y se restaura `kind` en el payload publicado para no romper
      // consumidores (e2e/vistas) que aún leen entry.kind.
      const { kind: entryKind, ...rest } = entry;
      const payload = makeEnvelope({
        game,
        kind: PROTOCOL_EVENTS.LEDGER,
        from: user,
        ts: entry.ts ?? t,
        ...rest,
        ...(entryKind != null ? { entryKind } : {})
      });
      if (entryKind != null) payload.kind = entryKind;
      publishAll(client, events.LEDGER, payload, room);
      if (onLedger) onLedger(payload);
    }
    return out.ledger.length + out.tracks.length;
  }

  function onIntent(data) {
    if (aclPolicy) {
      const acl = assertIntentAcl(data, aclPolicy, {
        ownership,
        peerCards
      });
      if (!acl.ok) {
        if (onIntentRejected) onIntentRejected(data, acl.error);
        else warn(`[${user}] intent rechazada (${acl.error}):`, JSON.stringify(data));
        return;
      }
    }

    const result = domain.applyIntent(data);
    if (!result.ok) {
      if (onIntentRejected) onIntentRejected(data, result.error);
      else warn(`[${user}] intent rechazada (${result.error}):`, JSON.stringify(data));
      return;
    }
    if (onIntentAccepted) onIntentAccepted(data);
    else log(`[${user}] ← ${data.intent} · ${data.actorId}`);

    // WP-U93: autoridad emite peer-card al join (ambos extremos: emite + signaling exige)
    if (joinIntentSet.has(data.intent)) {
      try {
        const card = issueRoomPeerCard({
          role: data.role ?? 'player',
          displayName: data.displayName ?? data.actorId,
          sessionId: data.actorId,
          now: now()
        });
        if (data.actorId) peerCards.set(data.actorId, card);
        if (onPeerCard) onPeerCard(card, data);
      } catch (err) {
        warn(
          `[${user}] peer-card no emitido en join:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    publishOutbox();
    publishState('change');
  }

  for (const intentEvent of events.INTENT) {
    client.io.on(intentEvent, onIntent);
  }

  await connectAndJoin(client, user, {
    type: join.type ?? 'Authority',
    features: join.features ?? [],
    room
  });

  publishState('change');

  interval = setInterval(() => {
    domain.tick(tickMs / 1000, now());
    const emitted = publishOutbox();
    publishState(emitted > 0 ? 'change' : 'heartbeat');
  }, tickMs);

  async function stop(exitCode = null) {
    if (stopped) return;
    stopped = true;
    if (interval != null) {
      clearInterval(interval);
      interval = null;
    }
    for (const cleanup of signalCleanups) cleanup();
    signalCleanups.length = 0;
    log(`\n[${user}] saliendo`);
    try {
      client.io.close();
    } catch {
      /* ignore */
    }
    if (typeof onShutdown === 'function') await onShutdown();
    if (exitCode != null) process.exit(exitCode);
  }

  if (installSignalHandlers) {
    for (const signal of ['SIGINT', 'SIGTERM']) {
      const handler = () => {
        stop(exitOnSignal);
      };
      process.on(signal, handler);
      signalCleanups.push(() => process.off(signal, handler));
    }
  }

  return {
    client,
    stop,
    publishState,
    publishOutbox,
    events,
    game,
    issuePeerCard: issueRoomPeerCard,
    peerCards,
    ownership
  };
}
