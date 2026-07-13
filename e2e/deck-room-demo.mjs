/**
 * E2E deck room demo (visor 3D Fase 0): socket-server + player-ui in
 * room transport mode (ZEUS_SESSION_TRANSPORT=room) with two raw socket.io
 * clients joined to scriptorium.default via CLIENT_REGISTER/CLIENT_SUSCRIBE.
 *
 * Gates:
 *  - G-E6.1 paridad: domain:deck:load + domain:playhead:set via ROOM_MESSAGE reach both
 *    clients as SET_STATE snapshots reflecting the change.
 *  - G-E6.2 orden: N=5 domain:playhead:set with increasing years → snapshots keep
 *    monotonic seq/year order (no reordering).
 *  - G-E6.3 reconexión: master (player-ui room socket) disconnects and
 *    reconnects → clients receive a re-affirmed full snapshot and the master
 *    keeps consuming inbound room events (not orphaned).
 *  - G-E6.4 heartbeat: without activity, periodic SET_STATE at ~1000 ms
 *    cadence (>= 2 in 3.5 s).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';
import { startAll } from '@zeus/linea-system';
import { createScriptoriumServer } from '@zeus/socket-server';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { ServerRegistry, PresetStore, discoverServers } from '@zeus/presets-sdk';
import {
  assert,
  shutdownE2E,
  safeClose,
  lineasBasePath,
  applyE2eLineaPorts
} from './helpers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const dataDir = path.join(repoRoot, 'data', 'e2e-deck-room-run');

/** Isolated ports: avoid clashing with dev scriptorium (:3017) / player (:3013). */
const SCRIPTORIUM_PORT = 13017;
const PLAYER_PORT = 13019;
const SESSION_ID = 'default';
const ROOM = `scriptorium.${SESSION_ID}`;
const RUNTIME_URL = `http://localhost:${SCRIPTORIUM_PORT}/runtime`;

fs.rmSync(dataDir, { recursive: true, force: true });
fs.mkdirSync(dataDir, { recursive: true });

const restoreLineaPorts = applyE2eLineaPorts();
process.env.ZEUS_SESSION_TRANSPORT = 'room';
process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;
delete process.env.ZEUS_SCRIPTORIUM_ROOM; // default room = scriptorium.default

let scriptorium = null;
let lineaHandles = [];
let player = null;
const sockets = [];

/** Raw socket.io client joined to ROOM; collects session:state SET_STATE frames. */
function createRoomClient(name) {
  const socket = ioClient(RUNTIME_URL, {
    transports: ['websocket'],
    auth: { token: resolveScriptoriumSecret(), room: ROOM, user: name }
  });

  const states = [];
  socket.on('SET_STATE', (data) => {
    if (data?.type === 'session:state' && data.snapshot) states.push(data);
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

  return { name, socket, states, connect, waitForState, emitRoom, disconnect: () => socket.disconnect() };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  console.log('1. Starting socket-server (room runtime)...');
  scriptorium = await createScriptoriumServer({ port: SCRIPTORIUM_PORT, host: 'localhost', bridge: 'local' });

  console.log('2. Starting linea-system servers...');
  lineaHandles = await startAll(lineasBasePath);
  const lineaUrls = lineaHandles.map((h) => new URL(h.url).origin);

  console.log('3. Building catalog and preset...');
  const found = await discoverServers({ urls: lineaUrls, timeoutMs: 5000 });
  assert(found.length === 2, `Expected 2 linea servers, got ${found.length}`);

  const registry = new ServerRegistry();
  for (const s of found) {
    await registry.registerServer(s.name, s.url, 'http');
  }
  const catalog = await registry.buildCatalog();
  assert(catalog.length === 2, 'catalog should have 2 linea servers');

  const store = new PresetStore({ dataDir, fileName: 'presets.json' });
  const items = [];
  for (const server of catalog) {
    items.push(
      { serverName: server.serverName, type: 'resource', name: 'linea-info' },
      { serverName: server.serverName, type: 'tool', name: 'get_nodo' },
      { serverName: server.serverName, type: 'resourceTemplate', name: 'linea-nodo' },
      { serverName: server.serverName, type: 'prompt', name: 'report-nodo' }
    );
    if (server.serverName === 'linea-wp-historia') {
      items.push(
        { serverName: server.serverName, type: 'tool', name: 'get_oldid' },
        { serverName: server.serverName, type: 'resourceTemplate', name: 'linea-oldid' }
      );
    }
  }
  const preset = store.create({
    name: 'linea-sync-observer-room',
    description: 'Cross-linea preset for the room-mode deck e2e',
    category: 'Analysis',
    prompt: 'Report the nodo at the given historical year using linea resources.',
    items
  });
  await registry.close();

  console.log('4. Starting player-ui with ZEUS_SESSION_TRANSPORT=room...');
  player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir,
    discoveryUrls: lineaUrls,
    sessionId: SESSION_ID
  });

  console.log('5. Connecting room clients A and B...');
  const clientA = createRoomClient('e2e-room-a');
  const clientB = createRoomClient('e2e-room-b');
  sockets.push(clientA, clientB);
  await Promise.all([clientA.connect(), clientB.connect()]);

  // Heartbeat runs at 1000 ms — initial snapshot arrives within ~1.5 s.
  await Promise.all([
    clientA.waitForState(() => true, 'initial snapshot (A)'),
    clientB.waitForState(() => true, 'initial snapshot (B)')
  ]);
  console.log('   Initial snapshots received by both clients.');

  /* ---------------- G-E6.1 paridad ---------------- */
  console.log('6. [G-E6.1] domain:deck:load + domain:playhead:set via ROOM_MESSAGE...');
  const deckLoadedA = clientA.waitForState(
    (d) => ['cued', 'playing'].includes(d.snapshot?.decks?.A?.phase),
    'deck A loaded (A)'
  );
  const deckLoadedB = clientB.waitForState(
    (d) => ['cued', 'playing'].includes(d.snapshot?.decks?.A?.phase),
    'deck A loaded (B)'
  );
  clientA.emitRoom('domain:deck:load', { deckId: 'A', serverName: 'linea-espana', presetId: preset.id });
  await Promise.all([deckLoadedA, deckLoadedB]);

  const YEAR_1 = 2010;
  const yearA = clientA.waitForState((d) => d.snapshot?.playhead?.year === YEAR_1, `year ${YEAR_1} (A)`);
  const yearB = clientB.waitForState((d) => d.snapshot?.playhead?.year === YEAR_1, `year ${YEAR_1} (B)`);
  clientA.emitRoom('domain:playhead:set', { year: YEAR_1 });
  const [snapA, snapB] = await Promise.all([yearA, yearB]);
  assert(snapA.snapshot.playhead.year === YEAR_1, 'client A snapshot year mismatch');
  assert(snapB.snapshot.playhead.year === YEAR_1, 'client B snapshot year mismatch');
  assert(snapA.snapshot.phase === snapB.snapshot.phase, 'phases should match across clients');
  console.log('   G-E6.1 OK: both clients received SET_STATE with deck A loaded and year', YEAR_1);

  /* ---------------- G-E6.2 orden ---------------- */
  console.log('7. [G-E6.2] 5 domain:playhead:set with increasing years, order preserved...');
  const YEARS = [2011, 2012, 2013, 2014, 2015];
  const markA = clientA.states.length;
  const markB = clientB.states.length;
  const lastYearA = clientA.waitForState((d) => d.snapshot?.playhead?.year === YEARS.at(-1), 'last year (A)');
  const lastYearB = clientB.waitForState((d) => d.snapshot?.playhead?.year === YEARS.at(-1), 'last year (B)');
  for (const year of YEARS) {
    clientA.emitRoom('domain:playhead:set', { year });
    await sleep(120);
  }
  await Promise.all([lastYearA, lastYearB]);

  for (const [client, mark] of [[clientA, markA], [clientB, markB]]) {
    const received = client.states.slice(mark);
    assert(received.length >= YEARS.length, `${client.name}: expected >= ${YEARS.length} snapshots, got ${received.length}`);
    for (let i = 1; i < received.length; i += 1) {
      assert(
        received[i].seq > received[i - 1].seq,
        `${client.name}: seq reordering at index ${i} (${received[i - 1].seq} -> ${received[i].seq})`
      );
      assert(
        received[i].snapshot.playhead.year >= received[i - 1].snapshot.playhead.year,
        `${client.name}: year regression at index ${i} (${received[i - 1].snapshot.playhead.year} -> ${received[i].snapshot.playhead.year})`
      );
    }
    const seenYears = [...new Set(received.map((d) => d.snapshot.playhead.year))];
    assert(seenYears.at(-1) === YEARS.at(-1), `${client.name}: final year should be ${YEARS.at(-1)}`);
  }
  console.log('   G-E6.2 OK: monotonic seq/year across', clientA.states.length - markA, '(A) and', clientB.states.length - markB, '(B) snapshots');

  /* ---------------- G-E6.3 reconexión ---------------- */
  console.log('8. [G-E6.3] master reconnection...');
  const masterSocket = player.io; // room mode: socket.io-client socket of the master
  masterSocket.disconnect();
  await sleep(500);
  const markA2 = clientA.states.length;
  const markB2 = clientB.states.length;
  const reaffirmA = clientA.waitForState(
    (d) => d.snapshot?.playhead?.year === YEARS.at(-1) && d.snapshot?.decks,
    'reaffirmed snapshot (A)'
  );
  const reaffirmB = clientB.waitForState(
    (d) => d.snapshot?.playhead?.year === YEARS.at(-1) && d.snapshot?.decks,
    'reaffirmed snapshot (B)'
  );
  masterSocket.connect();
  const [reA, reB] = await Promise.all([reaffirmA, reaffirmB]);
  assert(reA.snapshot.decks && reA.snapshot.playhead, 'client A reaffirmed snapshot incomplete');
  assert(reB.snapshot.decks && reB.snapshot.playhead, 'client B reaffirmed snapshot incomplete');

  // Not orphaned: the reconnected master must keep consuming room events.
  // Buffered heartbeats flush before the master's re-CLIENT_SUSCRIBE is
  // processed server-side, so retry the (idempotent) emit until it lands.
  const YEAR_POST = 2017;
  let postOk = false;
  for (let attempt = 0; attempt < 8 && !postOk; attempt += 1) {
    clientB.emitRoom('domain:playhead:set', { year: YEAR_POST });
    try {
      await clientA.waitForState(
        (d) => d.snapshot?.playhead?.year === YEAR_POST,
        `post-reconnect year (A, attempt ${attempt + 1})`,
        1500
      );
      postOk = true;
    } catch {
      /* master may not have re-joined the room yet — retry */
    }
  }
  assert(postOk, 'master did not process inbound room events after reconnect (orphaned)');
  await clientB.waitForState((d) => d.snapshot?.playhead?.year === YEAR_POST, 'post-reconnect year (B)', 5000);
  console.log(
    '   G-E6.3 OK: reaffirmed snapshots after reconnect (A:+%d, B:+%d) and inbound events still processed',
    clientA.states.length - markA2,
    clientB.states.length - markB2
  );

  /* ---------------- G-E6.4 heartbeat ---------------- */
  console.log('9. [G-E6.4] heartbeat cadence without activity (3.5 s window)...');
  const hbMarkA = clientA.states.length;
  const hbMarkB = clientB.states.length;
  await sleep(3500);
  const hbA = clientA.states.length - hbMarkA;
  const hbB = clientB.states.length - hbMarkB;
  assert(hbA >= 2, `client A: expected >= 2 heartbeat SET_STATE in 3.5s, got ${hbA}`);
  assert(hbB >= 2, `client B: expected >= 2 heartbeat SET_STATE in 3.5s, got ${hbB}`);
  const hbYearsOk = clientA.states
    .slice(hbMarkA)
    .every((d) => d.snapshot.playhead.year === YEAR_POST);
  assert(hbYearsOk, 'heartbeat snapshots should carry the unchanged state');
  console.log(`   G-E6.4 OK: heartbeats in 3.5s window — A: ${hbA}, B: ${hbB} (~1000ms cadence)`);

  console.log('\ne2e deck-room-demo: OK (G-E6.1, G-E6.2, G-E6.3, G-E6.4)');
} catch (err) {
  console.error('\ne2e deck-room-demo: FAILED');
  console.error(err);
  process.exitCode = 1;
} finally {
  restoreLineaPorts();
  await shutdownE2E({ lineaHandles, player, sockets });
  await safeClose(scriptorium);
  // socket.io server + SocketClient intervals keep handles alive; exit explicitly.
  process.exit(process.exitCode ?? 0);
}
