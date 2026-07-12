import { config, createClient, connectAndJoin } from '@zeus/rooms';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.WALK_USER || 'walk-demo';
const ACTOR_ID = process.env.MAP_ACTOR_ID || 'robot-ping';
const COOLDOWN_MS = Number(process.env.WALK_COOLDOWN_MS || 800);

const client = createClient(USER);
let lastIntentKey = '';
let scheduled = null;

function publishIntent(payload) {
  const msg = {
    type: 'GAME_INTENT',
    v: 1,
    from: USER,
    ts: Date.now(),
    actorId: ACTOR_ID,
    ...payload,
  };
  client.room('GAME_INTENT', msg, config.room);
  lastIntentKey = `${payload.intent}-${payload.linkId ?? ''}-${payload.direction ?? ''}-${payload.anchorId ?? ''}`;
  console.log(`[${USER}] → GAME_INTENT ${payload.intent}`, payload.linkId ?? payload.anchorId ?? '');
}

function scheduleIntent(payload) {
  if (scheduled) clearTimeout(scheduled);
  scheduled = setTimeout(() => publishIntent(payload), COOLDOWN_MS);
}

client.io.on('GAME_STATE', (data) => {
  const actor = data?.actors?.[ACTOR_ID];
  if (!actor) return;

  const { pose, anchorId, zone } = actor;

  if (pose === 'walk') return;

  if (pose === 'sit' && anchorId === 'ancla-a') {
    const key = 'walk-enlace-ab-a-to-b';
    if (lastIntentKey === key) return;
    scheduleIntent({ intent: 'walk', linkId: 'enlace-ab', direction: 'a-to-b' });
    return;
  }

  if (pose === 'sit' && anchorId === 'ancla-b') {
    const key = 'walk-enlace-ab-b-to-a';
    if (lastIntentKey === key) return;
    scheduleIntent({ intent: 'walk', linkId: 'enlace-ab', direction: 'b-to-a' });
    return;
  }

  if (pose === 'idle' && zone?.startsWith('nodo-')) {
    lastIntentKey = '';
  }
});

console.log(`\n🚶 WALK driver · user=${USER} · actor=${ACTOR_ID} · room=${config.room}\n`);

await connectAndJoin(client, USER, {
  type: 'WalkDemo',
  features: ['gamechannel-intent'],
});

process.on('SIGINT', () => {
  if (scheduled) clearTimeout(scheduled);
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  process.exit(0);
});
