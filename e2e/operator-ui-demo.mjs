import { gamesPaths } from './games-root.mjs';
/**
 * E2E WP-U32 CA: operator-ui sobre contrato único.
 *
 * socket + authority + operator-ui: health, shell inject, bundle wiring,
 * intent `inspect` rol operator → ledger; mismo intent rol player → rechazo.
 *
 * Sin navegador (ZEUS_OPEN_BROWSER no seteado).
 * Uso: npm run e2e:operator-ui  (requiere build:operator-ui previo)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { io as ioClient } from 'socket.io-client';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { makeIntent } from '@zeus/protocol';
import { createOperatorUiServer } from '../packages/mesh/operator-ui/serve.mjs';
import { assert, safeClose } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distBrowser = path.join(repoRoot, 'packages', 'mesh', 'operator-ui', 'dist', 'public', 'browser');

const HOST = 'localhost';
const SCRIPTORIUM_PORT = 13037;
const OPERATOR_UI_PORT = 13022;
const ROOM = 'ARG_U32';
const SECRET = resolveScriptoriumSecret();
const RUNTIME_URL = `http://${HOST}:${SCRIPTORIUM_PORT}/runtime`;
const ACTOR_ID = 'operator-ui';

const children = [];
const handles = [];
const sockets = [];

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

function createObserver(name) {
  const socket = ioClient(RUNTIME_URL, {
    transports: ['websocket'],
    auth: { token: SECRET, room: ROOM, user: name }
  });

  const connect = () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${name}: connect timeout`)), 10000);
      socket.on('connect', () => {
        socket.emit('CLIENT_REGISTER', {
          usuario: name,
          sesion: `${name}-${Date.now()}`,
          type: 'E2EClient',
          features: ['e2e-room']
        });
        socket.emit('CLIENT_SUSCRIBE', { room: ROOM });
        clearTimeout(timer);
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      socket.connect();
    });

  const waitFor = (events, predicate, label, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      const handler = (data) => {
        if (!predicate(data)) return;
        clearTimeout(timer);
        for (const ev of events) socket.off(ev, handler);
        resolve(data);
      };
      const timer = setTimeout(() => {
        for (const ev of events) socket.off(ev, handler);
        reject(new Error(`${name}: timeout waiting for ${label}`));
      }, timeoutMs);
      for (const ev of events) socket.on(ev, handler);
    });

  const emitIntent = (payload) => {
    socket.emit('ROOM_MESSAGE', { event: 'intent', room: ROOM, data: payload });
  };

  return { name, socket, connect, waitFor, emitIntent, disconnect: () => socket.disconnect() };
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
  console.log('1. [G-U32.0] operator-ui build artifact...');
  const mainBundle = findMainBundle();
  assert(fs.statSync(mainBundle).size > 0, 'operator-ui main bundle is empty');
  console.log(`   G-U32.0 OK: ${path.basename(mainBundle)}`);

  console.log('2. Starting socket-server + authority...');
  startApp('socket', path.join(repoRoot, 'packages/mesh/socket-server/src/index.mjs'));
  await waitForHttp(`http://${HOST}:${SCRIPTORIUM_PORT}/health`);
  startApp('authority', gamesPaths().deltaAuthority);

  const zeusInject = {
    scriptoriumUrl: RUNTIME_URL,
    room: ROOM,
    token: SECRET,
    user: ACTOR_ID,
    game: 'delta'
  };

  console.log('3. Starting operator-ui...');
  const operatorUi = await createOperatorUiServer({
    port: OPERATOR_UI_PORT,
    host: HOST,
    zeus: zeusInject
  });
  handles.push(operatorUi);

  console.log('4. [G-U32.1] operator-ui /health...');
  const healthRes = await fetch(`http://${HOST}:${operatorUi.port}/health`);
  assert(healthRes.status === 200, `operator-ui /health status ${healthRes.status}`);
  const healthJson = await healthRes.json();
  assert(healthJson.ok === true, 'operator-ui /health ok not true');
  assert(healthJson.service === 'operator-ui', 'operator-ui /health service mismatch');
  assert(healthJson.role === 'operator', 'operator-ui /health role mismatch');
  assert(healthJson.room === ROOM, `operator-ui room ${healthJson.room}`);
  console.log('   G-U32.1 OK: /health role=operator');

  console.log('5. [G-U32.2] shell injects window.__ZEUS__...');
  const shellRes = await fetch(`http://${HOST}:${operatorUi.port}/`);
  assert(shellRes.status === 200, `operator-ui / status ${shellRes.status}`);
  const shellHtml = await shellRes.text();
  assert(/window\.__ZEUS__/.test(shellHtml), 'shell missing window.__ZEUS__');
  assert(shellHtml.includes(RUNTIME_URL), `shell __ZEUS__ missing scriptoriumUrl`);
  assert(shellHtml.includes(ROOM), `shell __ZEUS__ missing room ${ROOM}`);
  console.log('   G-U32.2 OK: window.__ZEUS__ → game room');

  console.log('6. [G-U32.3] bundle wiring (CLIENT_SUSCRIBE, inspect, CentralHub)...');
  const bundleSrc = fs.readFileSync(mainBundle, 'utf8');
  assert(bundleSrc.includes('CLIENT_SUSCRIBE'), 'bundle missing CLIENT_SUSCRIBE');
  assert(bundleSrc.includes('inspect'), 'bundle missing inspect');
  assert(bundleSrc.includes('CentralHub'), 'bundle missing CentralHub');
  assert(!bundleSrc.includes('selection:cast'), 'bundle still has selection:cast');
  assert(!/session:state/.test(bundleSrc), 'bundle still has session:state');
  console.log('   G-U32.3 OK: bundle contrato único (sin session:*)');

  console.log('7. Connecting observer...');
  const observer = createObserver('e2e-u32-observer');
  sockets.push(observer);
  await observer.connect();
  await observer.waitFor(['state', 'arg:state'], () => true, 'initial state');
  console.log('   Initial state received.');

  console.log('8. [G-U32.4] inspect role=operator → ledger...');
  const ledgerOk = observer.waitFor(
    ['ledger', 'arg:ledger'],
    (e) => (e.kind === 'inspect' || e.entryKind === 'inspect') && e.actorId === ACTOR_ID,
    'inspect ledger',
    12000
  );
  observer.emitIntent(
    makeIntent(ACTOR_ID, 'inspect', { targetId: 'spawn', label: 'e2e-operator' }, { role: 'operator', game: 'delta' })
  );
  const entry = await ledgerOk;
  assert(
    entry.detail?.targetId === 'spawn' || entry.targetId === 'spawn',
    'inspect ledger targetId'
  );
  console.log('   G-U32.4 OK: ledger inspect');

  console.log('9. [G-U32.5] inspect role=player → rejected (no ledger)...');
  let playerLedger = false;
  const rejectWatch = (e) => {
    if ((e.kind === 'inspect' || e.entryKind === 'inspect') && e.actorId === 'player-spoof') {
      playerLedger = true;
    }
  };
  observer.socket.on('ledger', rejectWatch);
  observer.socket.on('arg:ledger', rejectWatch);
  observer.emitIntent(
    makeIntent('player-spoof', 'inspect', { targetId: 'spawn' }, { role: 'player', game: 'delta' })
  );
  await sleep(1500);
  observer.socket.off('ledger', rejectWatch);
  observer.socket.off('arg:ledger', rejectWatch);
  assert(!playerLedger, 'player role must not produce inspect ledger');
  console.log('   G-U32.5 OK: player inspect rejected (no ledger)');

  console.log('\ne2e operator-ui-demo: OK (G-U32.0–G-U32.5)');
} catch (err) {
  console.error('\ne2e operator-ui-demo: FAILED', err);
  process.exitCode = 1;
} finally {
  for (const s of sockets) {
    try {
      s.disconnect();
    } catch {
      /* ignore */
    }
  }
  shutdownChildren();
  await Promise.allSettled(handles.map((h) => safeClose(h)));
  setTimeout(() => process.exit(process.exitCode ?? 0), 400).unref();
}
