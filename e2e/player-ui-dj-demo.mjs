/**
 * E2E WP-U31 CA: deck/DJ action en player-ui → intent → ledger → visible
 * en el tablero de delta (arg-console /views/tablero + wire ledger).
 *
 * Sin navegador (ZEUS_OPEN_BROWSER no seteado).
 * Uso: npm run e2e:player-ui-dj
 */

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { io } from 'socket.io-client';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const HOST = 'localhost';
const SOCKET_PORT = 13041;
const CONSOLE_PORT = 13042;
const PLAYER_PORT = 13043;
const ROOM = 'ARG_U31';
const SECRET = 'dev-secret';

const children = [];
let failures = 0;

function startApp(label, appPath, extraEnv = {}) {
  const child = spawn(process.execPath, [appPath], {
    cwd: root,
    env: {
      ...process.env,
      ZEUS_HOST: HOST,
      ZEUS_PORT_SCRIPTORIUM: String(SOCKET_PORT),
      ZEUS_SCRIPTORIUM_URL: `http://${HOST}:${SOCKET_PORT}`,
      ZEUS_SCRIPTORIUM_SECRET: SECRET,
      ZEUS_ARG_ROOM: ROOM,
      ZEUS_ARG_FEEDS: 'synthetic',
      ZEUS_ARG_SEED: '7',
      ...extraEnv
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', (c) => process.env.U31_E2E_VERBOSE && process.stdout.write(`[${label}] ${c}`));
  child.stderr.on('data', (c) => process.stderr.write(`[${label}!] ${c}`));
  children.push(child);
  return child;
}

function gate(id, ok, detail = '') {
  const mark = ok ? '✅' : '❌';
  console.log(`${mark} ${id}${detail ? ` · ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttp(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(200);
  }
  throw new Error(`timeout esperando HTTP ${url}`);
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
}

console.log('\n🎛️ e2e player-ui DJ ·', { SOCKET_PORT, CONSOLE_PORT, PLAYER_PORT, ROOM }, '\n');

try {
  startApp('socket', join(root, 'packages/platform/socket-server/src/index.mjs'));
  await waitForHttp(`http://${HOST}:${SOCKET_PORT}/health`);

  startApp('authority', join(root, 'packages/arg/arg-demos/apps/authority/index.mjs'));
  startApp('console', join(root, 'packages/arg/arg-console/src/server.mjs'), {
    ZEUS_PORT_ARG_CONSOLE: String(CONSOLE_PORT)
  });
  startApp('player', join(root, 'packages/app/player-ui/src/server.mjs'), {
    ZEUS_PORT_PLAYER: String(PLAYER_PORT),
    PORT: String(PLAYER_PORT)
  });

  await waitForHttp(`http://${HOST}:${CONSOLE_PORT}/health`);
  await waitForHttp(`http://${HOST}:${PLAYER_PORT}/health`);

  const health = await (await fetch(`http://${HOST}:${PLAYER_PORT}/health`)).json();
  gate('G-U31.1', health.role === 'dj' && health.room === ROOM, JSON.stringify(health));

  const tablero = await fetch(`http://${HOST}:${CONSOLE_PORT}/views/tablero`);
  const tableroHtml = await tablero.text();
  gate(
    'G-U31.2',
    tablero.status === 200 && tableroHtml.includes('viewer-config'),
    `status=${tablero.status}`
  );

  const ledgerSeen = [];
  const socket = io(`http://${HOST}:${SOCKET_PORT}/runtime`, {
    transports: ['websocket'],
    reconnection: false,
    auth: { token: SECRET, room: ROOM, user: 'e2e-u31-observer' }
  });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('observer connect timeout')), 10000);
    socket.on('connect', () => {
      clearTimeout(t);
      socket.emit('CLIENT_REGISTER', {
        usuario: 'e2e-u31-observer',
        sesion: `e2e-${Date.now()}`,
        type: 'E2E',
        features: ['observer']
      });
      socket.emit('CLIENT_SUSCRIBE', { room: ROOM });
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });

  const onLedger = (entry) => {
    ledgerSeen.push(entry);
  };
  socket.on('arg:ledger', onLedger);
  socket.on('ledger', onLedger);

  await sleep(800);

  const djRes = await fetch(`http://${HOST}:${PLAYER_PORT}/api/dj/cache`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lineId: 'linea-aleph', registroId: 'P03' })
  });
  const djBody = await djRes.json();
  gate(
    'G-U31.3',
    djRes.status === 200 && djBody.ok === true && djBody.payload?.intent === 'cache',
    JSON.stringify(djBody.payload ?? djBody)
  );

  const start = Date.now();
  let cacheEntry = null;
  while (Date.now() - start < 8000) {
    cacheEntry = ledgerSeen.find((e) => e?.kind === 'cache' || e?.entryKind === 'cache');
    if (cacheEntry) break;
    await sleep(150);
  }
  gate(
    'G-U31.4',
    Boolean(cacheEntry),
    cacheEntry ? JSON.stringify({ kind: cacheEntry.kind, detail: cacheEntry.detail }) : 'no ledger cache'
  );

  const proj = await (await fetch(`http://${HOST}:${PLAYER_PORT}/api/dj/projection`)).json();
  const hasLines = Boolean(proj?.state?.lines?.regs?.length);
  gate('G-U31.5', hasLines || Boolean(cacheEntry), `projection lines=${hasLines}`);

  // Tablero shell still serves while ledger wire carried the fact (CA visible path).
  gate('G-U31.6', tablero.status === 200 && Boolean(cacheEntry), 'tablero + ledger cache');

  socket.off('arg:ledger', onLedger);
  socket.off('ledger', onLedger);
  socket.close();
} catch (err) {
  console.error('e2e player-ui-dj FAILED:', err);
  failures += 1;
} finally {
  shutdown();
}

if (failures > 0) {
  console.error(`\ne2e player-ui-dj: FAILED (${failures})`);
  process.exit(1);
}
console.log('\ne2e player-ui-dj: OK');
