/**
 * E2E dual-ui — WP-U32: player-ui (DJ) + player-3d + operator-ui on contrato único.
 *
 * Gates:
 *  - G-DUI.0 health of socket + player-ui DJ + player-3d + operator-ui
 *  - G-DUI.1 operator inspect role=operator → ledger
 *  - G-DUI.2 operator inspect role=player → rejected
 *  - G-DUI.3 operator bundle has operator/inspect, no session:state
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { io as ioClient } from 'socket.io-client';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { makeIntent } from '@zeus/arg-domain';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { createPlayer3dServer } from '../packages/app/player-3d-ui/src/server.mjs';
import { createOperatorUiServer } from '../packages/operator-ui/serve.mjs';
import { assert, safeClose } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data', 'e2e-dual-ui-run');
const distBrowser = path.join(repoRoot, 'packages', 'operator-ui', 'dist', 'public', 'browser');

const HOST = 'localhost';
const SCRIPTORIUM_PORT = 13047;
const PLAYER_PORT = 13048;
const PLAYER_3D_PORT = 13049;
const OPERATOR_UI_PORT = 13050;
const ROOM = 'ARG_DUAL';
const SECRET = resolveScriptoriumSecret();
const RUNTIME_URL = `http://${HOST}:${SCRIPTORIUM_PORT}/runtime`;
const ACTOR_ID = 'operator-ui';

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

process.env.ZEUS_HOST = HOST;
process.env.ZEUS_PORT_SCRIPTORIUM = String(SCRIPTORIUM_PORT);
process.env.ZEUS_SCRIPTORIUM_URL = `http://${HOST}:${SCRIPTORIUM_PORT}`;
process.env.ZEUS_SCRIPTORIUM_SECRET = SECRET;
process.env.ZEUS_ARG_ROOM = ROOM;
process.env.ZEUS_ARG_FEEDS = 'synthetic';
process.env.ZEUS_ARG_SEED = '7';

const children = [];
const handles = [];

function startApp(label, appPath, extraEnv = {}) {
  const child = spawn(process.execPath, [appPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      ZEUS_HOST: HOST,
      ZEUS_PORT_SCRIPTORIUM: String(SCRIPTORIUM_PORT),
      ZEUS_SCRIPTORIUM_URL: `http://${HOST}:${SCRIPTORIUM_PORT}`,
      ZEUS_SCRIPTORIUM_SECRET: SECRET,
      ZEUS_ARG_ROOM: ROOM,
      ZEUS_ARG_FEEDS: 'synthetic',
      ZEUS_ARG_SEED: '7',
      ...extraEnv
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', (c) => process.env.U32_E2E_VERBOSE && process.stdout.write(`[${label}] ${c}`));
  child.stderr.on('data', (c) => process.stderr.write(`[${label}!] ${c}`));
  children.push(child);
  return child;
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

function findMainBundle() {
  const files = fs.readdirSync(distBrowser).filter((f) => /^main-.*\.js$/.test(f));
  assert(files.length > 0, 'operator-ui main bundle missing — run npm run build:operator-ui');
  return path.join(distBrowser, files[0]);
}

function shutdownChildren() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
}

try {
  console.log('1. [G-DUI.3 prep] operator-ui build artifact...');
  const mainBundle = findMainBundle();
  assert(fs.statSync(mainBundle).size > 0, 'operator-ui main bundle is empty');

  console.log('2. Starting socket-server + authority...');
  startApp('socket', path.join(repoRoot, 'packages/platform/socket-server/src/index.mjs'));
  await waitForHttp(`http://${HOST}:${SCRIPTORIUM_PORT}/health`);
  startApp('authority', path.join(repoRoot, 'packages/arg/arg-demos/apps/authority/index.mjs'));

  console.log('3. Starting player-ui (DJ)...');
  const player = await createPlayerServer({
    port: PLAYER_PORT,
    host: HOST,
    dataDir,
    room: ROOM,
    discoveryExclusive: false,
    discoveryTimeoutMs: 2000
  });
  handles.push(player);

  console.log('4. Starting player-3d-ui...');
  const player3d = await createPlayer3dServer({
    port: PLAYER_3D_PORT,
    host: HOST
  });
  handles.push(player3d);

  const zeusInject = {
    scriptoriumUrl: RUNTIME_URL,
    room: ROOM,
    token: SECRET,
    user: ACTOR_ID,
    game: 'delta'
  };

  console.log('5. Starting operator-ui...');
  const operatorUi = await createOperatorUiServer({
    port: OPERATOR_UI_PORT,
    host: HOST,
    zeus: zeusInject
  });
  handles.push(operatorUi);

  console.log('6. [G-DUI.0] health of all services...');
  const playerHealth = await fetch(`http://${HOST}:${PLAYER_PORT}/health`);
  const playerJson = await playerHealth.json();
  assert(playerHealth.status === 200, `player-ui /health status ${playerHealth.status}`);
  assert(playerJson.role === 'dj', 'player-ui must report role=dj');
  assert(playerJson.room === ROOM, `player-ui room ${playerJson.room}`);

  const p3dHealth = await fetch(`http://${HOST}:${PLAYER_3D_PORT}/health`);
  assert(p3dHealth.status === 200, `player-3d /health status ${p3dHealth.status}`);

  const opHealth = await fetch(`http://${HOST}:${operatorUi.port}/health`);
  const opJson = await opHealth.json();
  assert(opHealth.status === 200, `operator-ui /health status ${opHealth.status}`);
  assert(opJson.role === 'operator', 'operator-ui must report role=operator');
  assert(opJson.room === ROOM, `operator-ui room ${opJson.room}`);
  console.log('   G-DUI.0 OK');

  console.log('7. [G-DUI.3] operator bundle contrato único...');
  const bundleSrc = fs.readFileSync(mainBundle, 'utf8');
  assert(bundleSrc.includes('inspect'), 'bundle missing inspect');
  assert(bundleSrc.includes('operator'), 'bundle missing operator');
  assert(!/session:state/.test(bundleSrc), 'bundle still has session:state');
  console.log('   G-DUI.3 OK');

  console.log('8. Wire observer for roles e2e...');
  const socket = ioClient(RUNTIME_URL, {
    transports: ['websocket'],
    auth: { token: SECRET, room: ROOM, user: 'e2e-dual-observer' }
  });
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('observer connect timeout')), 10000);
    socket.on('connect', () => {
      socket.emit('CLIENT_REGISTER', {
        usuario: 'e2e-dual-observer',
        sesion: `obs-${Date.now()}`,
        type: 'E2EClient',
        features: ['e2e']
      });
      socket.emit('CLIENT_SUSCRIBE', { room: ROOM });
      clearTimeout(t);
      resolve();
    });
    socket.on('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
    socket.connect();
  });

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout waiting for initial state')), 15000);
    const onState = () => {
      clearTimeout(t);
      socket.off('state', onState);
      socket.off('arg:state', onState);
      resolve();
    };
    socket.on('state', onState);
    socket.on('arg:state', onState);
  });
  console.log('   Initial state received.');

  const emitIntent = (payload) => {
    socket.emit('ROOM_MESSAGE', { event: 'intent', room: ROOM, data: payload });
  };

  console.log('9. [G-DUI.1] inspect operator → ledger...');
  const ledgerPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout inspect ledger')), 15000);
    const onEntry = (e) => {
      if ((e.kind === 'inspect' || e.entryKind === 'inspect') && e.actorId === ACTOR_ID) {
        clearTimeout(t);
        socket.off('ledger', onEntry);
        socket.off('arg:ledger', onEntry);
        resolve(e);
      }
    };
    socket.on('ledger', onEntry);
    socket.on('arg:ledger', onEntry);
  });
  emitIntent(
    makeIntent(ACTOR_ID, 'inspect', { targetId: 'dual-spawn', label: 'dual' }, { role: 'operator' })
  );
  await ledgerPromise;
  console.log('   G-DUI.1 OK');

  console.log('10. [G-DUI.2] inspect player → rejected...');
  let spoofLedger = false;
  const watch = (e) => {
    if ((e.kind === 'inspect' || e.entryKind === 'inspect') && e.actorId === 'player-spoof') {
      spoofLedger = true;
    }
  };
  socket.on('ledger', watch);
  socket.on('arg:ledger', watch);
  emitIntent(makeIntent('player-spoof', 'inspect', { targetId: 'x' }, { role: 'player' }));
  await sleep(1500);
  socket.off('ledger', watch);
  socket.off('arg:ledger', watch);
  assert(!spoofLedger, 'player must not land inspect on ledger');
  console.log('   G-DUI.2 OK');

  socket.disconnect();
  console.log('\ne2e dual-ui-demo: OK (G-DUI.0–G-DUI.3)');
} catch (err) {
  console.error('\ne2e dual-ui-demo: FAILED', err);
  process.exitCode = 1;
} finally {
  shutdownChildren();
  await Promise.allSettled(handles.map((h) => safeClose(h)));
  // player-ui/dj keeps sockets open; force exit after cleanup
  setTimeout(() => process.exit(process.exitCode ?? 0), 400).unref();
}
