/**
 * CAUDAL — la Autoridad del delta (el único proceso que muta dominio,
 * gate G-ARG.1). Patrón heredado de game-demos/apps/map:
 *   arg:intent (room) → reducer → arg:state 10 Hz + arg:track + arg:ledger.
 */

import { createClient, connectAndJoin } from '@zeus/rooms';
import {
  createArgDomainState,
  EVENTS,
  DEFAULT_ARG_ROOM,
  AUTHORITY_USER,
  ARG_TICK_MS,
  ARG_HEARTBEAT_MS,
  deltaV0,
  buildCanteraTopology
} from '@zeus/arg-domain';
import { resolveRuntimeFeeds } from '@zeus/arg-feeds';
import { resolveZeusMcpPorts } from '@zeus/presets-sdk';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || AUTHORITY_USER;
const ROOM = process.env.ZEUS_ARG_ROOM || DEFAULT_ARG_ROOM;
const TICK_MS = Number(process.env.ARG_TICK_MS || ARG_TICK_MS);
const HEARTBEAT_MS = Number(process.env.ARG_STATE_HEARTBEAT_MS || ARG_HEARTBEAT_MS);
const FEED_MODE = process.env.ZEUS_ARG_FEEDS || 'auto';
const SEED = Number(process.env.ZEUS_ARG_SEED || 1);

const gamemap = {
  id: process.env.ZEUS_ARG_GAMEMAP || 'gamemap-demo',
  objetivo: {
    labeled: Number(process.env.ZEUS_ARG_GOAL_LABELED || 10),
    excavated: Number(process.env.ZEUS_ARG_GOAL_EXCAVATED || 2)
  },
  startPack: (process.env.ZEUS_ARG_START_PACK || 'aleph-tronco-puro,aleph-firehose-browse')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
};

const topology = buildCanteraTopology(deltaV0.cantera);
const feeds = await resolveRuntimeFeeds({
  mode: FEED_MODE,
  seed: SEED,
  logger: console,
  mcpPorts: resolveZeusMcpPorts(),
  gamemap,
  topology
});

const state = createArgDomainState({ feeds, gamemap });

const client = createClient(USER, { room: ROOM });
let lastFullMazeAt = 0;
let lastMazeRev = 0;

function publishState(reason) {
  const now = Date.now();
  const fullMaze = state.mazeRev() !== lastMazeRev || now - lastFullMazeAt >= HEARTBEAT_MS;
  if (fullMaze) {
    lastMazeRev = state.mazeRev();
    lastFullMazeAt = now;
  }
  const snapshot = state.snapshot(reason, { fullMaze });
  client.room(EVENTS.STATE, { from: USER, ...snapshot }, ROOM);
}

function publishOutbox() {
  const out = state.drainOutbox();
  for (const track of out.tracks) {
    client.room(EVENTS.TRACK, track, ROOM);
  }
  for (const entry of out.ledger) {
    client.room(EVENTS.LEDGER, entry, ROOM);
    console.log(`[${USER}] 📜 ${entry.kind}`, JSON.stringify(entry.detail ?? entry.ref ?? ''));
  }
  return out.ledger.length + out.tracks.length;
}

client.io.on(EVENTS.INTENT, (data) => {
  const result = state.applyIntent(data);
  if (!result.ok) {
    console.warn(`[${USER}] intent rechazada (${result.error}):`, JSON.stringify(data));
    return;
  }
  console.log(`[${USER}] ← ${data.intent} · ${data.actorId}`);
  publishOutbox();
  publishState('change');
});

console.log(
  `\n🌊 CAUDAL authority · user=${USER} · room=${ROOM} · scene=${state.scene.id} · feeds=${feeds.mode ?? FEED_MODE} · tick=${TICK_MS}ms\n`
);

await connectAndJoin(client, USER, {
  type: 'ArgAuthority',
  features: ['caudal-0.1', 'arg-state', 'arg-track', 'arg-ledger'],
  room: ROOM
});

publishState('change');

const interval = setInterval(() => {
  state.tick(TICK_MS / 1000);
  const emitted = publishOutbox();
  // Los ríos y la presión son continuos: se publica a ritmo de tick
  // (los visores hacen dead reckoning entre snapshots, contrato P4).
  publishState(emitted > 0 ? 'change' : 'heartbeat');
}, TICK_MS);

async function shutdown() {
  clearInterval(interval);
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  if (typeof feeds.close === 'function') await feeds.close();
  process.exit(0);
}

// La autoridad no escucha en ningún puerto (es cliente de la room), así que las
// herramientas que matan por puerto no la alcanzan: depende de que el launcher
// le cascadee la señal. Escucha las dos.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown();
  });
}
