import { config, createClient, connectAndJoin } from '@zeus/rooms';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.WATCH_USER || 'watch-demo';
const ACTOR_ID = process.env.MAP_ACTOR_ID || 'robot-ping';
const HEARTBEAT_EVERY = Number(process.env.WATCH_HEARTBEAT_EVERY || 5);

const client = createClient(USER);
let heartbeatCount = 0;
let lastLine = '';

function formatActor(actor) {
  if (!actor) return '?';
  const parts = [actor.pose, actor.zone];
  if (actor.linkId && actor.progress != null) {
    parts.push(`progress=${actor.progress.toFixed(2)}`);
  }
  if (actor.anchorId) parts.push(`@${actor.anchorId}`);
  if (actor.position) {
    parts.push(`pos=(${actor.position.x.toFixed(1)},${actor.position.y.toFixed(1)},${actor.position.z.toFixed(1)})`);
  }
  return parts.join(' · ');
}

client.io.on('GAME_STATE', (data) => {
  const reason = data?.reason ?? 'change';
  if (reason === 'heartbeat') {
    heartbeatCount += 1;
    if (heartbeatCount % HEARTBEAT_EVERY !== 0) return;
  }

  const actor = data?.actors?.[ACTOR_ID];
  const line = `[${USER}] tick=${data?.tick ?? '?'} · ${ACTOR_ID} · ${formatActor(actor)}`;
  if (line === lastLine && reason === 'heartbeat') return;
  lastLine = line;
  console.log(line);
});

console.log(`\n👁️  WATCH viewer (tier0) · user=${USER} · actor=${ACTOR_ID} · room=${config.room}\n`);

await connectAndJoin(client, USER, {
  type: 'WatchDemo',
  features: ['gameviewer-tier0'],
});

process.on('SIGINT', () => {
  console.log(`\n[${USER}] saliendo`);
  client.io.close();
  process.exit(0);
});
