/**
 * E2E bridge transparency: local authority + remote-mode proxy on separate ports.
 * Verifies SET_STATE and ROOM_MESSAGE flow through the bridge relay.
 *
 * Optional online gate (E2E_BRIDGE_ONLINE=1):
 *   proxy → https://rooms.scriptorium.escrivivir.co with isolated room scriptorium.e2e-bridge-*
 */

import { io as ioClient } from 'socket.io-client';
import { createScriptoriumServer } from '@zeus/socket-server';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { assert, safeClose } from './helpers.mjs';

const SECRET = resolveScriptoriumSecret();
const RUN_ONLINE = process.env.E2E_BRIDGE_ONLINE === '1' || process.env.E2E_BRIDGE_ONLINE === 'true';

const ONLINE_UPSTREAM = process.env.E2E_BRIDGE_UPSTREAM_URL || 'https://rooms.scriptorium.escrivivir.co';

function listenPort(httpServer, fallback) {
  const addr = httpServer?.address?.();
  if (typeof addr === 'object' && addr?.port) return addr.port;
  return fallback;
}

const sockets = [];
const servers = [];

function createRoomViewer(bridgePort, room, name) {
  const url = `http://localhost:${bridgePort}/runtime`;
  const socket = ioClient(url, {
    transports: ['websocket'],
    auth: { token: SECRET, room, user: name }
  });

  const connect = () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${name}: connect timeout`)), 12000);
      socket.on('connect', () => {
        socket.emit('CLIENT_REGISTER', {
          usuario: name,
          sesion: `${name}-${Date.now()}`,
          type: 'E2EBridgeClient',
          features: ['e2e-bridge']
        });
        socket.emit('CLIENT_SUSCRIBE', { room });
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

  const emitRoom = (event, data) => socket.emit('ROOM_MESSAGE', { event, room, data });

  return { name, socket, connect, waitForState, emitRoom, disconnect: () => socket.disconnect() };
}

async function probeUpstream(url) {
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const body = await res.json();
    return body?.ok === true;
  } catch {
    return false;
  }
}

/**
 * @param {object} opts
 * @param {number} [opts.upstreamPort]
 * @param {number} [opts.bridgePort]
 * @param {number} [opts.playerPort]
 * @param {string} opts.room
 * @param {string} opts.sessionId
 * @param {string} [opts.upstreamUrl]
 * @param {string} label
 */
async function runBridgeScenario({ upstreamPort = 0, bridgePort = 0, playerPort = 0, room, sessionId, upstreamUrl, label }) {
  let upstream = null;
  let bridge = null;
  let player = null;

  console.log(`\n[${label}] 1. Starting upstream...`);
  if (!upstreamUrl) {
    upstream = await createScriptoriumServer({
      port: upstreamPort,
      host: 'localhost',
      bridge: 'local'
    });
    servers.push(upstream);
  } else {
    const ok = await probeUpstream(upstreamUrl);
    if (!ok) {
      console.log(`[${label}] SKIP — upstream unreachable: ${upstreamUrl}`);
      return { skipped: true };
    }
  }

  const bridgeTarget = upstreamUrl || `http://localhost:${listenPort(upstream?.httpServer, upstreamPort)}`;
  console.log(`[${label}] 2. Starting bridge (remote → ${bridgeTarget})...`);
  process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL = bridgeTarget;
  bridge = await createScriptoriumServer({
    port: bridgePort,
    host: 'localhost',
    bridge: 'remote'
  });
  servers.push(bridge);
  const bridgeListenPort = listenPort(bridge.httpServer, bridgePort);

  console.log(`[${label}] 3. Starting player-ui master on ${room}...`);
  process.env.ZEUS_SESSION_TRANSPORT = 'room';
  process.env.ZEUS_SCRIPTORIUM_URL = bridgeTarget;
  process.env.ZEUS_SCRIPTORIUM_ROOM = room;
  player = await createPlayerServer({
    port: playerPort,
    host: 'localhost',
    sessionId
  });
  servers.push(player);

  console.log(`[${label}] 4. Connecting viewer through bridge proxy...`);
  const viewer = createRoomViewer(bridgeListenPort, room, `${label}-viewer`);
  sockets.push(viewer);
  await viewer.connect();
  await viewer.waitForState(() => true, 'initial snapshot through bridge');

  const CASO = 'e2e-bridge-caso';
  console.log(`[${label}] 5. caso:set via bridge ROOM_MESSAGE...`);
  const casoPromise = viewer.waitForState(
    (d) => d.snapshot?.activeCaso === CASO,
    `activeCaso ${CASO}`
  );
  viewer.emitRoom('caso:set', { casoId: CASO });
  const snap = await casoPromise;
  assert(snap.snapshot.activeCaso === CASO, 'activeCaso mismatch through bridge');

  console.log(`[${label}] OK`);
  return { skipped: false };
}

try {
  const local = await runBridgeScenario({
    room: 'scriptorium.e2e-bridge-local',
    sessionId: 'e2e-bridge-local',
    label: 'local-local'
  });
  if (local.skipped) throw new Error('local bridge scenario must not skip');

  if (RUN_ONLINE) {
    const stamp = Date.now();
    const onlineRoom = `scriptorium.e2e-bridge-${stamp}`;
    const online = await runBridgeScenario({
      bridgePort: 0,
      playerPort: 0,
      room: onlineRoom,
      sessionId: `e2e-bridge-${stamp}`,
      upstreamUrl: ONLINE_UPSTREAM,
      label: 'online'
    });
    if (online.skipped) {
      console.log('\ne2e-bridge: online scenario skipped (upstream unreachable)');
    }
  } else {
    console.log('\n(online gate skipped — set E2E_BRIDGE_ONLINE=1 to probe rooms.scriptorium.escrivivir.co)');
  }

  console.log('\ne2e-bridge: OK');
} catch (err) {
  console.error('\ne2e-bridge: FAILED');
  console.error(err);
  process.exitCode = 1;
} finally {
  for (const s of sockets) s.disconnect?.();
  await Promise.allSettled(servers.map((s) => safeClose(s)));
  delete process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL;
  delete process.env.ZEUS_SCRIPTORIUM_ROOM;
  process.exit(process.exitCode ?? 0);
}
