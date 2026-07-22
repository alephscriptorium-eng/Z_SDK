/**
 * Puente de room genérico: un MCP = un actor.
 * Suscribe state/ledger/track (nombres wire inyectados), emite intents solo
 * como SU actor. Sin nombres de juego (D-8).
 *
 * Identidad: peercard opcional en bootstrap (mismo carril que la puerta).
 * Si `requirePeerCard`, connect exige card + assertPeerCard ok antes del join.
 */

import { createClient, connectAndJoin as defaultConnectAndJoin } from '@zeus/rooms';
import { DEFAULT_POLL_MS, sleep } from './util.mjs';

const DEFAULT_LEDGER_TAIL = 50;
const DEFAULT_TRACKS_TAIL = 20;

/**
 * @param {{
 *   actor: string,
 *   room: string,
 *   user?: string,
 *   events: { STATE: string, INTENT: string, TRACK: string, LEDGER: string },
 *   makeIntent: (actorId: string, intent: string, args?: object, from?: string) => object,
 *   peer?: { type: string, features?: string[] },
 *   peerCard?: object|null,
 *   requirePeerCard?: boolean,
 *   assertPeerCard?: (card: object) => { ok: boolean, error?: string },
 *   createClient?: typeof createClient,
 *   connectAndJoin?: typeof defaultConnectAndJoin,
 *   isStateSnapshot?: (snapshot: unknown) => boolean,
 *   myActorFromState?: (state: object|null, actor: string) => object|null,
 *   onState?: (snapshot: object) => void,
 *   logger?: Console,
 *   ledgerTailSize?: number,
 *   tracksTailSize?: number
 * }} options
 */
export function createPlayerRoomBridge({
  actor,
  room,
  user = `mcp-${actor}`,
  events,
  makeIntent,
  peer = { type: 'PlayerMcp', features: ['intent', 'mcp-wrapper'] },
  peerCard = null,
  requirePeerCard = false,
  assertPeerCard = null,
  createClient: createClientFn = createClient,
  connectAndJoin: connectAndJoinFn = defaultConnectAndJoin,
  isStateSnapshot = (snapshot) =>
    Boolean(snapshot && typeof snapshot === 'object' && snapshot.actors),
  myActorFromState = (state, actorId) => state?.actors?.[actorId] ?? null,
  onState: onStateHook,
  logger = console,
  ledgerTailSize = DEFAULT_LEDGER_TAIL,
  tracksTailSize = DEFAULT_TRACKS_TAIL
}) {
  if (!events?.STATE || !events?.INTENT || !events?.TRACK || !events?.LEDGER) {
    throw new TypeError('createPlayerRoomBridge: events.{STATE,INTENT,TRACK,LEDGER} son obligatorios');
  }
  if (typeof makeIntent !== 'function') {
    throw new TypeError('createPlayerRoomBridge: makeIntent es obligatorio');
  }
  if (typeof room !== 'string' || !room) {
    throw new TypeError('createPlayerRoomBridge: room (string no vacío) es obligatorio');
  }
  if (requirePeerCard && (peerCard == null || typeof peerCard !== 'object')) {
    throw new TypeError(
      'createPlayerRoomBridge: requirePeerCard exige peerCard (objeto) en bootstrap'
    );
  }
  if (peerCard != null && typeof assertPeerCard === 'function') {
    const gate = assertPeerCard(peerCard);
    if (!gate || gate.ok !== true) {
      throw new TypeError(
        `createPlayerRoomBridge: peerCard rechazada: ${gate?.error ?? 'assert failed'}`
      );
    }
  }

  const client = createClientFn(user, { room });

  let lastState = null;
  let lastStateAt = 0;
  const ledger = [];
  const ledgerSeqSeen = new Set();
  const tracks = [];
  const trackKeySeen = new Set();
  let connected = false;
  let activePeerCard = peerCard;

  function onState(snapshot) {
    if (!isStateSnapshot(snapshot)) return;
    if (lastState && typeof snapshot.ts === 'number' && snapshot.ts < lastState.ts) return;
    lastState = snapshot;
    lastStateAt = Date.now();
    if (typeof onStateHook === 'function') onStateHook(snapshot);
  }

  function onLedger(entry) {
    if (!entry || typeof entry !== 'object' || typeof entry.seq !== 'number') return;
    if (ledgerSeqSeen.has(entry.seq)) return;
    ledgerSeqSeen.add(entry.seq);
    ledger.push(entry);
    if (ledger.length > ledgerTailSize) ledger.splice(0, ledger.length - ledgerTailSize);
  }

  function onTrack(track) {
    if (!track || track.actorId !== actor) return;
    const key = `${track.ts}·${track.ref?.uri ?? ''}`;
    if (trackKeySeen.has(key)) return;
    trackKeySeen.add(key);
    tracks.push(track);
    if (tracks.length > tracksTailSize) tracks.splice(0, tracks.length - tracksTailSize);
  }

  const handlers = {
    [events.STATE]: onState,
    [events.LEDGER]: onLedger,
    [events.TRACK]: onTrack
  };
  for (const [event, handler] of Object.entries(handlers)) {
    client.io.on(event, handler);
  }
  client.io.on('ROOM_MESSAGE', (message) => {
    const entries = Array.isArray(message) ? message : [message];
    for (const entry of entries) {
      const handler = entry?.event ? handlers[entry.event] : null;
      if (handler) handler(entry.data);
    }
  });
  client.io.on('disconnect', () => {
    connected = false;
  });

  function resolvePeerCardForConnect(overrideCard) {
    const card = overrideCard !== undefined ? overrideCard : activePeerCard;
    if (requirePeerCard && (card == null || typeof card !== 'object')) {
      throw new Error('createPlayerRoomBridge.connect: peerCard requerida (mismo carril puerta)');
    }
    if (card != null && typeof assertPeerCard === 'function') {
      const gate = assertPeerCard(card);
      if (!gate || gate.ok !== true) {
        throw new Error(
          `createPlayerRoomBridge.connect: peerCard rechazada: ${gate?.error ?? 'assert failed'}`
        );
      }
    }
    return card ?? null;
  }

  return {
    actor,
    room,
    user,
    client,
    events,

    get connected() {
      return connected;
    },

    get peerCard() {
      return activePeerCard;
    },

    get ssbId() {
      return activePeerCard?.ssbId ?? null;
    },

    /** Actualiza peercard antes de connect (p.ej. renovación TTL). */
    setPeerCard(card) {
      if (requirePeerCard && (card == null || typeof card !== 'object')) {
        throw new TypeError('setPeerCard: peerCard objeto requerido');
      }
      if (card != null && typeof assertPeerCard === 'function') {
        const gate = assertPeerCard(card);
        if (!gate || gate.ok !== true) {
          throw new TypeError(`setPeerCard: peerCard rechazada: ${gate?.error ?? 'assert failed'}`);
        }
      }
      activePeerCard = card;
    },

    async connect(opts = {}) {
      const card = resolvePeerCardForConnect(opts.peerCard);
      if (opts.peerCard !== undefined) activePeerCard = card;
      const joinOpts = {
        type: peer.type,
        features: peer.features ?? [],
        room
      };
      if (card != null) joinOpts.peerCard = card;
      await connectAndJoinFn(client, user, joinOpts);
      connected = true;
    },

    async connectWithRetry({ retryMs = 3000, maxAttempts = Infinity } = {}) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await this.connect();
          logger.log(`[${user}] conectado a room ${room}`);
          return true;
        } catch (err) {
          logger.warn(`[${user}] room no disponible (intento ${attempt}): ${err.message}`);
          await sleep(retryMs);
        }
      }
      return false;
    },

    close() {
      client.io.close();
      connected = false;
    },

    /** Emite un intent como MI actor (nunca otro). */
    emitIntent(intentName, args = {}) {
      if (!connected) return false;
      client.room(events.INTENT, makeIntent(actor, intentName, args, user), room);
      return true;
    },

    lastState: () => lastState,
    /** Timestamp del último snapshot (`state.ts`), o null. */
    lastStateTs: () => lastState?.ts ?? null,
    /** Reloj local de recepción del último state (ms epoch). */
    lastStateAt: () => lastStateAt,
    myActor: () => myActorFromState(lastState, actor),
    ledgerTail: (n = ledgerTailSize) => ledger.slice(-n),
    tracksTail: (n = tracksTailSize) => tracks.slice(-n),
    maxLedgerSeq: () => (ledger.length > 0 ? ledger[ledger.length - 1].seq : 0),

    async waitState(predicate, timeoutMs) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const value = predicate(lastState);
        if (value) return value;
        await sleep(DEFAULT_POLL_MS);
      }
      return null;
    },

    sleep
  };
}
