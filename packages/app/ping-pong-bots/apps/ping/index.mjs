import { config, createClient, connectAndJoin, loadScriptoriumConfig as scriptoriumConfig, resolveSessionRoom } from '@zeus/rooms';
import { randomExpr, solveExpr } from '../../lib/math.mjs';
import { attachSessionParticipant, strategies } from '../../lib/session-participant.mjs';

const USER = process.env.ZEUS_SCRIPTORIUM_USER || process.env.PING_USER || 'ping-demo';
const PONG_USER = process.env.PONG_USER || 'pong-demo';
const INTERVAL_MS = Number(process.env.PING_INTERVAL_MS || 10000);

// --- session mode (opt-in) ---
const SESSION_MODE = process.env.PING_SESSION_MODE === '1';
const SESSION_EVERY = Number(process.env.PING_SESSION_EVERY || 1); // cast every N correct exchanges
const sessionRoom = SESSION_MODE ? resolveSessionRoom(process.env.ZEUS_SESSION_ID || 'default') : null;

// In session mode all activity (PING/PONG + selection:cast) happens on the
// unified session room served by socket-server, so bots and master meet.
const client = SESSION_MODE
  ? createClient(USER, { ...scriptoriumConfig(), room: sessionRoom })
  : createClient(USER);
const GAME_ROOM = SESSION_MODE ? sessionRoom : config.room;
let session = null;
let solveCount = 0;
let pongCount = 0;
let pingCount = 0;
let waitingForAnswer = false;
let currentPingN = 0;
let currentExpr = null;
let scheduleTimer = null;

function scheduleNext(afterMs = INTERVAL_MS) {
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => {
    if (!waitingForAnswer) sendPing();
  }, afterMs);
}

function sendPing() {
  if (waitingForAnswer) return;

  pingCount += 1;
  const expr = randomExpr();
  currentPingN = pingCount;
  currentExpr = expr;
  waitingForAnswer = true;

  const data = { n: pingCount, expr, from: USER, ts: Date.now() };
  client.room('PING', data, GAME_ROOM);
  console.log(`[${USER}] → PING #${pingCount} · ${expr}`);
}

function isCorrectAnswer(expr, answer) {
  const expected = solveExpr(expr);
  return Number(answer) === expected;
}

client.io.on('PONG', (data) => {
  const sender = data?.from ?? '?';
  if (sender !== PONG_USER) return;
  if (data?.replyTo !== currentPingN) return;

  pongCount += 1;
  const latency = Date.now() - (data?.ts ?? Date.now());
  const expr = data?.expr ?? currentExpr ?? '?';

  if (data?.error) {
    console.log(`[${USER}] ← PONG #${pongCount} from ${sender} · ${expr} · error: ${data.error} (~${latency}ms)`);
    return;
  }

  let mark = '';
  let correct = false;
  try {
    correct = isCorrectAnswer(expr, data?.answer);
    const expected = solveExpr(expr);
    mark = correct ? ' ✓' : ` ✗ (esperado ${expected})`;
  } catch {
    mark = ' ?';
  }

  console.log(`[${USER}] ← PONG #${pongCount} from ${sender} · ${expr} = ${data?.answer ?? '?'}${mark} (~${latency}ms)`);

  if (correct) {
    waitingForAnswer = false;
    solveCount += 1;
    maybeCastSelection();
    scheduleNext(INTERVAL_MS);
  }
});

// In session mode, every SESSION_EVERY correct exchanges pick a rev from deck B
// and cast an attributed selection. PING uses the FIRST rev (vs PONG's LAST) so
// attribution disputes are visible on the master. Silent no-op if no snapshot yet.
function maybeCastSelection() {
  if (!SESSION_MODE || !session) return;
  if (SESSION_EVERY > 1 && solveCount % SESSION_EVERY !== 0) return;
  const data = session.cast({ strategy: strategies.first, label: `ping pick #${solveCount}` });
  if (data) {
    console.log(`[${USER}] ⇒ selection:cast (first) targetId=${data.targetId} on ${GAME_ROOM}`);
  }
}

client.io.onAny((event, ...args) => {
  if (event === 'room_joined' || event === 'room_left') {
    console.log(`[${USER}] ${event}:`, args[0]);
  }
});

console.log(`\n🏓 PING app · user=${USER} · pong=${PONG_USER} · interval=${INTERVAL_MS}ms · room=${GAME_ROOM}${SESSION_MODE ? ' · SESSION MODE' : ''}\n`);

await connectAndJoin(client, USER, SESSION_MODE
  ? { room: GAME_ROOM, type: 'PingPongSession', features: ['ping-pong-demo', 'session-participant'] }
  : {});

if (SESSION_MODE) {
  session = attachSessionParticipant(client, { room: GAME_ROOM, actorId: USER, deckId: 'B' });
}

sendPing();

process.on('SIGINT', () => {
  if (scheduleTimer) clearTimeout(scheduleTimer);
  console.log(`\n[${USER}] saliendo (${pingCount} pings, ${pongCount} pongs)`);
  client.io.close();
  process.exit(0);
});
