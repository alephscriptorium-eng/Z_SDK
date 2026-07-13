/**
 * Shared helpers for L-session domain e2e scripts.
 * Hard global timeout (30s) — fail fast, no infinite socket wait.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';
import { createScriptoriumServer } from '@zeus/socket-server';
import { createPlayerServer } from '../packages/app/player-ui/src/server.mjs';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { safeClose, shutdownE2E } from './helpers.mjs';

export const E2E_DOMAIN_TIMEOUT_MS = 30_000;
export const SCRIPTORIUM_PORT = 13027;
export const PLAYER_PORT = 13029;
export const SESSION_ID = 'domain-e2e';
export const ROOM = `scriptorium.${SESSION_ID}`;
export const RUNTIME_URL = `http://localhost:${SCRIPTORIUM_PORT}/runtime`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..');
export const dataDir = path.join(repoRoot, 'data', 'e2e-domain-run');

/**
 * Run an e2e body with a hard process-level timeout.
 * @param {string} label
 * @param {(ctx: object) => Promise<void>} fn
 */
export async function runDomainE2E(label, fn) {
  const deadline = setTimeout(() => {
    console.error(`\n${label}: HARD TIMEOUT after ${E2E_DOMAIN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, E2E_DOMAIN_TIMEOUT_MS);
  deadline.unref?.();

  let scriptorium = null;
  let player = null;
  const sockets = [];

  try {
    await fn({
      get scriptorium() { return scriptorium; },
      set scriptorium(v) { scriptorium = v; },
      get player() { return player; },
      set player(v) { player = v; },
      sockets,
      startStack,
      createRoomClient,
      sleep
    });
    console.log(`\n${label}: OK`);
  } catch (err) {
    console.error(`\n${label}: FAILED`);
    console.error(err);
    process.exitCode = 1;
  } finally {
    clearTimeout(deadline);
    await shutdownE2E({ player, sockets });
    await safeClose(scriptorium);
    process.exit(process.exitCode ?? 0);
  }
}

export async function startStack(ctx) {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });

  process.env.ZEUS_SESSION_TRANSPORT = 'room';
  process.env.ZEUS_SCRIPTORIUM_URL = `http://localhost:${SCRIPTORIUM_PORT}`;
  delete process.env.ZEUS_SCRIPTORIUM_ROOM;

  console.log('Starting socket-server (programmatic)...');
  ctx.scriptorium = await createScriptoriumServer({
    port: SCRIPTORIUM_PORT,
    host: 'localhost',
    bridge: 'local'
  });

  console.log('Starting player-ui room master...');
  ctx.player = await createPlayerServer({
    port: PLAYER_PORT,
    host: 'localhost',
    dataDir,
    discoveryUrls: [],
    discoveryExclusive: true,
    sessionId: SESSION_ID
  });
}

/** Raw socket.io client joined to ROOM; collects session:state SET_STATE frames. */
export function createRoomClient(name, sockets = []) {
  const socket = ioClient(RUNTIME_URL, {
    transports: ['websocket'],
    auth: {
      token: resolveScriptoriumSecret(),
      room: ROOM,
      user: name
    },
    timeout: 5000,
    reconnection: false
  });

  const states = [];
  socket.on('SET_STATE', (data) => {
    if (data?.type === 'session:state' && data.snapshot) states.push(data);
  });

  const connect = () =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${name}: connect timeout`)), 8000);
      socket.once('connect', () => {
        socket.emit('CLIENT_REGISTER', {
          usuario: name,
          sesion: `${name}-${Date.now()}`,
          type: 'E2EClient',
          features: ['e2e-domain']
        });
        socket.emit('CLIENT_SUSCRIBE', { room: ROOM });
        clearTimeout(timer);
        resolve();
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      socket.connect();
    });

  const waitForState = (predicate, label, timeoutMs = 12_000) =>
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

  const client = {
    name,
    socket,
    states,
    connect,
    waitForState,
    emitRoom,
    disconnect: () => socket.disconnect()
  };
  sockets.push(client);
  return client;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
