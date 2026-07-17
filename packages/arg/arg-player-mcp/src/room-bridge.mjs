/**
 * Puente de room para el arg-player-mcp: cliente `mcp-<actor>` en ARG_DELTA.
 *
 * Suscrito a arg:state (último snapshot), arg:ledger (cola 50) y arg:track
 * (últimas 20 del actor). Emite arg:intent SIEMPRE con actorId = SU actor —
 * jamás instancia motores ni actúa por otro (G-ARG.1).
 *
 * Escucha dual direct/envelope (patrón 3d-monitor): el socket-server
 * re-emite tanto el evento desenvuelto como el ROOM_MESSAGE.
 */

import { createClient, connectAndJoin } from '@zeus/rooms';
import { EVENTS, DEFAULT_ARG_ROOM, makeIntent } from '@zeus/arg-domain';

const LEDGER_TAIL = 50;
const TRACKS_TAIL = 20;
const POLL_MS = 120;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{ actor: string, room?: string, user?: string, logger?: Console }} options
 */
export function createRoomBridge({
  actor,
  room = process.env.ZEUS_ARG_ROOM || DEFAULT_ARG_ROOM,
  user = `mcp-${actor}`,
  logger = console
}) {
  const client = createClient(user, { room });

  let lastState = null;
  let lastStateAt = 0;
  let lastMaze = null; // último snapshot COMPLETO de maze (rev+chambers+corridors)
  const ledger = [];
  const ledgerSeqSeen = new Set();
  const tracks = [];
  const trackKeySeen = new Set();
  let connected = false;

  function onState(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.actors) return;
    if (lastState && typeof snapshot.ts === 'number' && snapshot.ts < lastState.ts) return;
    lastState = snapshot;
    lastStateAt = Date.now();
    if (snapshot.maze?.chambers) lastMaze = snapshot.maze;
  }

  function onLedger(entry) {
    if (!entry || typeof entry !== 'object' || typeof entry.seq !== 'number') return;
    if (ledgerSeqSeen.has(entry.seq)) return; // dedupe dual direct/envelope
    ledgerSeqSeen.add(entry.seq);
    ledger.push(entry);
    if (ledger.length > LEDGER_TAIL) ledger.splice(0, ledger.length - LEDGER_TAIL);
  }

  function onTrack(track) {
    if (!track || track.actorId !== actor) return;
    const key = `${track.ts}·${track.ref?.uri ?? ''}`;
    if (trackKeySeen.has(key)) return;
    trackKeySeen.add(key);
    tracks.push(track);
    if (tracks.length > TRACKS_TAIL) tracks.splice(0, tracks.length - TRACKS_TAIL);
  }

  const handlers = {
    [EVENTS.STATE]: onState,
    [EVENTS.LEDGER]: onLedger,
    [EVENTS.TRACK]: onTrack
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

  return {
    actor,
    room,
    user,
    client,

    get connected() {
      return connected;
    },

    async connect() {
      await connectAndJoin(client, user, {
        type: 'ArgPlayerMcp',
        features: ['delta-0.1', 'arg-intent', 'mcp-wrapper'],
        room
      });
      connected = true;
    },

    /** Reintenta la conexión en segundo plano hasta lograrla. */
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

    /** Emite un arg:intent como MI actor (nunca otro). */
    emitIntent(intentName, args = {}) {
      if (!connected) return false;
      client.room(EVENTS.INTENT, makeIntent(actor, intentName, args, user), room);
      return true;
    },

    lastState: () => lastState,
    lastStateAt: () => lastStateAt,
    maze: () => lastMaze,
    myActor: () => lastState?.actors?.[actor] ?? null,
    ledgerTail: (n = LEDGER_TAIL) => ledger.slice(-n),
    tracksTail: (n = TRACKS_TAIL) => tracks.slice(-n),
    maxLedgerSeq: () => (ledger.length > 0 ? ledger[ledger.length - 1].seq : 0),

    /**
     * Espera hasta que `predicate(lastState)` sea truthy.
     * @returns valor del predicado, o null al agotar el timeout (no lanza).
     */
    async waitState(predicate, timeoutMs) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const value = predicate(lastState);
        if (value) return value;
        await sleep(POLL_MS);
      }
      return null;
    },

    /** sleep exportado para bucles de reintento de tools (label:cast). */
    sleep
  };
}
