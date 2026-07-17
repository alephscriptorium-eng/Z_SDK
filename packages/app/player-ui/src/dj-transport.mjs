/**
 * DJ transport — player-ui as vista rol `dj` on the game room.
 * Shared state via authority; local xstate stays in session-machine.
 * Uses @zeus/protocol (caller injects game id — PRACTICAS §1.11).
 */

import {
  createClient,
  connectAndJoin,
  loadScriptoriumConfig,
  emitRoomEvent,
  onRoomEvent
} from '@zeus/rooms';
import { makeIntent, EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';

/** Canónico (U11): vistas DJ emigran off `arg:*` dual-emit. */
const WIRE = {
  STATE: [PROTOCOL_EVENTS.STATE, 'arg:state'],
  INTENT: [PROTOCOL_EVENTS.INTENT],
  LEDGER: [PROTOCOL_EVENTS.LEDGER, 'arg:ledger']
};

/**
 * Game room — caller/env injects; default is delta's room id.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveDjRoom(env = process.env) {
  return env.ZEUS_ARG_ROOM || 'ARG_DELTA';
}

/**
 * @param {object} [deps]
 */
export async function createDjTransport(deps = {}) {
  const actorId = deps.actorId ?? 'player-ui-dj';
  const room = deps.room ?? resolveDjRoom();
  const game = deps.game ?? 'delta';
  const user = deps.user ?? actorId;
  const log = deps.log ?? console.log.bind(console);

  const cfg = loadScriptoriumConfig();
  const client = createClient(user, { room, url: cfg.url });

  /** @type {object|null} */
  let lastState = null;
  /** @type {object[]} */
  const ledgerTail = [];
  const MAX_LEDGER = 50;
  const offFns = [];

  function rememberState(data) {
    lastState = data;
    deps.onState?.(data);
  }

  function rememberLedger(entry) {
    ledgerTail.push(entry);
    if (ledgerTail.length > MAX_LEDGER) ledgerTail.shift();
    deps.onLedger?.(entry);
  }

  for (const ev of WIRE.STATE) {
    offFns.push(onRoomEvent(client, ev, rememberState));
  }
  for (const ev of WIRE.LEDGER) {
    offFns.push(onRoomEvent(client, ev, rememberLedger));
  }

  await connectAndJoin(client, user, {
    room,
    type: 'PlayerUiDj',
    features: ['dj', 'delta-view', game]
  });

  /**
   * @param {string} intent
   * @param {object} [args]
   * @param {object} [opts]
   */
  function emitIntent(intent, args = {}, opts = {}) {
    const payload = makeIntent(actorId, intent, args, {
      from: actorId,
      game,
      role: opts.role
    });
    for (const ev of WIRE.INTENT) {
      emitRoomEvent(client, ev, payload, room);
    }
    return payload;
  }

  // Presence: join as player so the actor exists; DJ intents carry role:dj.
  emitIntent('join', { kind: 'player', tier: 'stick' }, { role: 'player' });

  log(`[player-ui] DJ vista · room=${room} · actor=${actorId} · game=${game}`);

  /**
   * @param {'cache'|'curate'|'milestone'} intent
   * @param {object} args
   */
  function emitDjIntent(intent, args = {}) {
    return emitIntent(intent, args, { role: 'dj' });
  }

  return {
    mode: 'dj',
    role: 'dj',
    game,
    room,
    actorId,
    client,
    io: client.io,
    emitDjIntent,
    emitIntent,
    getLastState: () => lastState,
    getLedgerTail: () => [...ledgerTail],
    broadcastState: () => {},
    emitDeckResolved: () => {},
    emitCatalog: () => {},
    reaffirmState: () => {},
    close: async () => {
      for (const off of offFns) off();
      client.io.close();
    }
  };
}
