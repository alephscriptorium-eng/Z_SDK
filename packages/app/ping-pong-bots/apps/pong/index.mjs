import { config, createClient, connectAndJoin, loadScriptoriumConfig as scriptoriumConfig, resolveSessionRoom } from '@zeus/rooms';
import { solveExpr } from '../../lib/math.mjs';
import { attachSessionParticipant, strategies } from '../../lib/session-participant.mjs';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.PONG_USER || 'pong-demo';
const PING_USER = process.env.PING_USER || 'ping-demo';

// --- session mode (opt-in) ---
const SESSION_MODE = process.env.PING_SESSION_MODE === '1';
const SESSION_EVERY = Number(process.env.PING_SESSION_EVERY || 1); // cast every N answers
const sessionRoom = SESSION_MODE ? resolveSessionRoom(process.env.ZEUS_SESSION_ID || 'default') : null;

// In session mode all activity (PING/PONG + selection:cast) happens on the
// unified session room served by scriptorium-server, so bots and master meet.
const client = SESSION_MODE
  ? createClient(USER, { ...scriptoriumConfig(), room: sessionRoom })
  : createClient(USER);
const GAME_ROOM = SESSION_MODE ? sessionRoom : config.room;
let session = null;
let pongCount = 0;

// In session mode, every SESSION_EVERY answers pick a rev from deck B and cast an
// attributed selection. PONG uses the LAST rev (vs PING's FIRST) so attribution
// disputes are visible on the master. Silent no-op if no snapshot yet.
function maybeCastSelection() {
  if (!SESSION_MODE || !session) return;
  if (SESSION_EVERY > 1 && pongCount % SESSION_EVERY !== 0) return;
  const data = session.cast({ strategy: strategies.last, label: `pong pick #${pongCount}` });
  if (data) {
    console.log(`[${USER}] ⇒ selection:cast (last) targetId=${data.targetId} on ${GAME_ROOM}`);
  }
}

client.io.on('PING', (data) => {
  const sender = data?.from ?? '?';
  if (sender === USER) return;
  if (sender !== PING_USER) return;

  const expr = data?.expr;
  if (!expr) return;

  pongCount += 1;
  console.log(`[${USER}] ← PING #${data?.n ?? '?'} from ${sender} · ${expr}`);

  const base = { n: pongCount, from: USER, replyTo: data?.n, expr, ts: Date.now() };

  try {
    const answer = solveExpr(expr);
    client.room('PONG', { ...base, answer }, GAME_ROOM);
    console.log(`[${USER}] → PONG #${pongCount} · answer=${answer}`);
    maybeCastSelection();
  } catch (err) {
    client.room('PONG', { ...base, error: err.message }, GAME_ROOM);
    console.log(`[${USER}] → PONG #${pongCount} · error: ${err.message}`);
  }
});

client.io.onAny((event, ...args) => {
  if (event === 'room_joined' || event === 'room_left') {
    console.log(`[${USER}] ${event}:`, args[0]);
  }
});

console.log(`\n🏓 PONG app · user=${USER} · ping=${PING_USER} · room=${GAME_ROOM}${SESSION_MODE ? ' · SESSION MODE' : ''} · esperando PINGs…\n`);

await connectAndJoin(client, USER, SESSION_MODE
  ? { room: GAME_ROOM, type: 'PingPongSession', features: ['ping-pong-demo', 'session-participant'] }
  : {});

if (SESSION_MODE) {
  session = attachSessionParticipant(client, { room: GAME_ROOM, actorId: USER, deckId: 'B' });
}

process.on('SIGINT', () => {
  console.log(`\n[${USER}] saliendo (${pongCount} pongs enviados)`);
  client.io.close();
  process.exit(0);
});
