import { config, createClient, connectAndJoin } from '@zeus/rooms';
import { createMapEngine } from '@zeus/game-engine';
import { vaivenDosNodos } from '@zeus/game-engine';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.MAP_USER || 'map-authority';
const ACTOR_ID = process.env.MAP_ACTOR_ID || 'robot-ping';
const TICK_MS = Number(process.env.MAP_TICK_MS || 100);
const HEARTBEAT_MS = Number(process.env.MAP_STATE_HEARTBEAT_MS || 1000);

const engine = createMapEngine(vaivenDosNodos);
engine.registerActor(ACTOR_ID, {
  kind: 'gameobjects.alephillo-robot',
  zone: 'nodo-a',
  anchorId: 'ancla-a',
  pose: 'sit',
});

const client = createClient(USER);
let lastPublish = 0;
let dirty = true;

function publishState(reason = 'change') {
  const snapshot = engine.getSnapshot();
  const msg = {
    type: 'GAME_STATE',
    v: 1,
    from: 'map-authority',
    ts: Date.now(),
    reason,
    ...snapshot,
  };
  client.room('GAME_STATE', msg, config.room);
  lastPublish = Date.now();
  dirty = false;
}

function logEvents() {
  for (const ev of engine.drainEvents()) {
    console.log(`[${USER}] · ${ev.name}`, JSON.stringify(ev));
  }
}

client.io.on('GAME_INTENT', (data) => {
  const actorId = data?.actorId;
  const intent = data?.intent;
  if (!actorId || !intent) return;

  try {
    const result = engine.applyIntent(actorId, data);
    if (!result.ok) {
      console.warn(`[${USER}] intent rechazada: ${result.error}`, data);
      return;
    }
    dirty = true;
    logEvents();
    publishState('change');
    console.log(`[${USER}] ← GAME_INTENT ${intent} from ${data?.from ?? '?'}`);
  } catch (err) {
    console.error(`[${USER}] intent error:`, err.message);
  }
});

console.log(`\n🗺️  MAP authority · user=${USER} · scene=${vaivenDosNodos.id} · tick=${TICK_MS}ms\n`);

await connectAndJoin(client, USER, {
  type: 'MapDemo',
  features: ['gamemap-0.1', 'gamechannel'],
});

publishState('change');

const interval = setInterval(() => {
  engine.tick(TICK_MS / 1000);
  const events = engine.drainEvents();
  if (events.length > 0) {
    dirty = true;
    for (const ev of events) {
      console.log(`[${USER}] · ${ev.name}`, JSON.stringify(ev));
    }
  }
  const now = Date.now();
  if (dirty || now - lastPublish >= HEARTBEAT_MS) {
    publishState(dirty ? 'change' : 'heartbeat');
  }
}, TICK_MS);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  process.exit(0);
});
