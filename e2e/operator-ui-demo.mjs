/**
 * E2E operator-ui demo (block-13 closure): scriptorium-server + player-ui
 * (room MASTER) + operator-ui HTTP shell, on isolated ports.
 *
 * Node e2e (no real browser): validates build artifact, HTTP surface,
 * window.__ZEUS__ injection, bundle wiring, and selection:cast via room client.
 *
 * Gates:
 *  - G-OUI.0 build: dist/public/browser/main-*.js exists (run build:operator-ui first)
 *  - G-OUI.1 health: GET /health → { ok: true, service: 'operator-ui' }
 *  - G-OUI.2 shell: GET / injects window.__ZEUS__ with scriptoriumUrl → e2e runtime
 *  - G-OUI.3 bundle: main-*.js contains CLIENT_SUSCRIBE, selection:cast, CentralHub
 *  - G-OUI.4 selection:cast: room client operator-ui updates snapshot.selections.last
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';
import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { createOperatorUiServer } from '../packages/operator-ui/serve.mjs';
import { assert, shutdownE2E, safeClose } from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data', 'e2e-operator-ui-run');
const distBrowser = path.join(repoRoot, 'packages', 'operator-ui', 'dist', 'public', 'browser');

/** Isolated ports — avoid clashing with dev (:3017 / :3013 / :3020) and player-3d e2e. */
const SCRIPTORIUM_PORT = 13037;
const PLAYER_PORT = 13038;
const OPERATOR_UI_PORT = 13022;
const SESSION_ID = 'default';
const ROOM = `scriptorium.${SESSION_ID}`;
const RUNTIME_URL = `http://localhost:${SCRIPTORIUM_PORT}/runtime`;
const ACTOR_ID = 'operator-ui';
const TARGET_ID = 424242;

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

process.env.ZEUS_SESSION_TRANSPORT = 'room';
process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;
process.env.ZEUS_PORT_SCRIPTORIUM = String(SCRIPTORIUM_PORT);
delete process.env.ZEUS_SCRIPTORIUM_ROOM;

let scriptorium = null;
let player = null;
let operatorUi = null;
const sockets = [];

/** Raw socket.io client joined to ROOM; collects session:state SET_STATE frames. */
function createRoomClient(name) {
  const socket = ioClient(RUNTIME_URL, {
    transports: ['websocket'],
    auth: { token: resolveScriptoriumSecret(), room: ROOM, user: name }
  });

  const connect = () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${name}: connect timeout`)), 8000);
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

  const waitForState = (predicate, label, timeoutMs = 15000) =>
    new Promise((resolve, reject) => {
      const handler = (data) => {
        if (data?.type !== 'session:state' || !data.snapshot) return;
        if (!predicate(data)) return;
        clearTimeout(timer);
        socket.off('SET_STATE', handler);
        resolve(data);
      };
      const timer = setTimeout(() => {
        socket.off('SET_STATE', handler);
        reject(new Error(`${name}: timeout waiting for ${label}`));
      }, timeoutMs);
      socket.on('SET_STATE', handler);
    });

  const emitRoom = (event, data) => socket.emit('ROOM_MESSAGE', { event, room: ROOM, data });

  return { name, socket, connect, waitForState, emitRoom, disconnect: () => socket.disconnect() };
}

function findMainBundle() {
  const files = fs.readdirSync(distBrowser).filter((f) => /^main-.*\.js$/.test(f));
  assert(files.length > 0, 'operator-ui main bundle missing — run npm run build:operator-ui');
  return path.join(distBrowser, files[0]);
}

try {
  /* ---------------- G-OUI.0 build artifact ---------------- */
  console.log('1. [G-OUI.0] operator-ui build artifact...');
  const mainBundle = findMainBundle();
  assert(fs.statSync(mainBundle).size > 0, 'operator-ui main bundle is empty');
  console.log(`   G-OUI.0 OK: ${path.basename(mainBundle)}`);

  console.log('2. Starting scriptorium-server (room runtime)...');
  scriptorium = await createScriptoriumServer({ port: SCRIPTORIUM_PORT, host: 'localhost', bridge: 'local' });

  console.log('3. Starting player-ui (room MASTER)...');
  player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir,
    sessionId: SESSION_ID
  });

  const zeusInject = {
    scriptoriumUrl: RUNTIME_URL,
    room: ROOM,
    sessionId: SESSION_ID,
    token: resolveScriptoriumSecret(),
    user: ACTOR_ID,
  };

  console.log('4. Starting operator-ui server...');
  operatorUi = await createOperatorUiServer({
    port: OPERATOR_UI_PORT,
    host: 'localhost',
    zeus: zeusInject,
  });

  /* ---------------- G-OUI.1 health ---------------- */
  console.log('5. [G-OUI.1] operator-ui /health...');
  const healthRes = await fetch(`http://localhost:${operatorUi.port}/health`);
  assert(healthRes.status === 200, `operator-ui /health status ${healthRes.status}`);
  const healthJson = await healthRes.json();
  assert(healthJson.ok === true, 'operator-ui /health ok not true');
  assert(healthJson.service === 'operator-ui', 'operator-ui /health service mismatch');
  console.log('   G-OUI.1 OK: /health');

  /* ---------------- G-OUI.2 shell injection ---------------- */
  console.log('6. [G-OUI.2] operator-ui shell injects window.__ZEUS__...');
  const shellRes = await fetch(`http://localhost:${operatorUi.port}/`);
  assert(shellRes.status === 200, `operator-ui / status ${shellRes.status}`);
  const shellHtml = await shellRes.text();
  assert(/window\.__ZEUS__/.test(shellHtml), 'shell missing window.__ZEUS__');
  assert(shellHtml.includes(RUNTIME_URL), `shell __ZEUS__ missing scriptoriumUrl ${RUNTIME_URL}`);
  console.log('   G-OUI.2 OK: window.__ZEUS__ → e2e scriptorium runtime');

  /* ---------------- G-OUI.3 bundle wiring ---------------- */
  console.log('7. [G-OUI.3] bundle wiring (CLIENT_SUSCRIBE, selection:cast, CentralHub)...');
  const bundleSrc = fs.readFileSync(mainBundle, 'utf8');
  assert(bundleSrc.includes('CLIENT_SUSCRIBE'), 'bundle missing CLIENT_SUSCRIBE');
  assert(bundleSrc.includes('selection:cast'), 'bundle missing selection:cast');
  assert(bundleSrc.includes('CentralHub'), 'bundle missing CentralHub');
  console.log('   G-OUI.3 OK: bundle contains session wiring symbols');

  /* ---------------- G-OUI.4 selection:cast ---------------- */
  console.log('8. Connecting room client (operator-ui actor)...');
  const operator = createRoomClient(ACTOR_ID);
  sockets.push(operator);
  await operator.connect();
  await operator.waitForState(() => true, 'initial snapshot');
  console.log('   Initial snapshot received.');

  console.log('9. [G-OUI.4] selection:cast from operator-ui...');
  const selectionApplied = operator.waitForState(
    (d) => d.snapshot?.selections?.last?.targetId === TARGET_ID,
    'selection recorded',
    12000
  );
  operator.emitRoom('selection:cast', {
    actorId: ACTOR_ID,
    kind: 'registro',
    deckId: 'B',
    targetId: TARGET_ID,
    label: 'e2e-operator-ui',
    meta: { source: 'operator-ui' },
  });
  const selState = await selectionApplied;
  const sel = selState.snapshot.selections;
  assert(sel.last.actorId === ACTOR_ID, `selections.last.actorId mismatch: ${sel.last.actorId}`);
  assert(sel.last.targetId === TARGET_ID, `selections.last.targetId mismatch: ${sel.last.targetId}`);
  assert(sel.byActor && sel.byActor[ACTOR_ID], 'selections.byActor[operator-ui] missing');
  assert(sel.byActor[ACTOR_ID].targetId === TARGET_ID, 'selections.byActor[operator-ui].targetId mismatch');
  console.log(`   G-OUI.4 OK: selections.last + byActor[${ACTOR_ID}] carry targetId ${TARGET_ID}`);

  console.log('\ne2e operator-ui-demo: OK (G-OUI.0–G-OUI.4)');
} catch (err) {
  console.error('\ne2e operator-ui-demo: FAILED');
  console.error(err);
  process.exitCode = 1;
} finally {
  await safeClose(operatorUi);
  await shutdownE2E({ player, sockets });
  await safeClose(scriptorium);
  process.exit(process.exitCode ?? 0);
}
