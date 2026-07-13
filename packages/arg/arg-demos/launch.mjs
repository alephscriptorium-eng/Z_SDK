/**
 * Demo CAUDAL de 3 visores: socket-server (si no está ya corriendo) +
 * autoridad + arg-console. Imprime las tres URLs (tablero + 2 jugadores).
 * Patrón heredado de game-demos/launch.mjs.
 */

import { spawn } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, monorepoRoot } from './lib/load-env.mjs';
import { resolveZeusUiPorts } from '@zeus/presets-sdk/env';

const packageRoot = dirname(fileURLToPath(import.meta.url));
loadEnv();

const HOST = process.env.ZEUS_HOST || 'localhost';
const SOCKET_PORT = Number(process.env.ZEUS_PORT_SCRIPTORIUM || 3017);
const CONSOLE_PORT = Number(process.env.ZEUS_PORT_ARG_CONSOLE || 3021);
const ROOM = process.env.ZEUS_ARG_ROOM || 'ARG_DELTA';

const children = [];

function portOpen(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host, timeout: 1200 });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function pipeWithPrefix(label, stream, target) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.length > 0) target.write(`[${label}] ${line}\n`);
    }
  });
}

function startApp(label, appPath, extraEnv = {}) {
  const child = spawn(process.execPath, [appPath], {
    cwd: monorepoRoot,
    env: { ...process.env, ...extraEnv },
    stdio: ['inherit', 'pipe', 'pipe']
  });
  pipeWithPrefix(label, child.stdout, process.stdout);
  pipeWithPrefix(label, child.stderr, process.stderr);
  child.on('exit', (code, signal) => {
    if (signal) console.log(`[launch] ${label} terminó (${signal})`);
    else if (code && code !== 0) console.error(`[launch] ${label} salió con código ${code}`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 300);
}

process.on('SIGINT', () => {
  console.log('\n[launch] parando demo…');
  shutdown(0);
});

console.log('');
console.log('┌────────────────────────────────────────────┐');
console.log('│  🌊 CAUDAL · demo 3 visores · @zeus/arg    │');
console.log('└────────────────────────────────────────────┘');
console.log('');

const socketAlready = await portOpen(SOCKET_PORT, HOST);
if (socketAlready) {
  console.log(`[launch] socket-server ya corriendo en :${SOCKET_PORT} — lo reutilizo`);
} else {
  console.log(`[launch] levantando socket-server en :${SOCKET_PORT}`);
  startApp('socket', join(monorepoRoot, 'packages/platform/socket-server/src/index.mjs'));
  for (let i = 0; i < 40; i++) {
    if (await portOpen(SOCKET_PORT, HOST)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
}

startApp('authority', join(packageRoot, 'apps/authority/index.mjs'), {
  ZEUS_ARG_ROOM: ROOM,
  ZEUS_SCRIPTORIUM_URL: process.env.ZEUS_SCRIPTORIUM_URL || `http://${HOST}:${SOCKET_PORT}`
});

setTimeout(() => {
  startApp('console', join(monorepoRoot, 'packages/arg/arg-console/src/server.mjs'), {
    ZEUS_PORT_ARG_CONSOLE: String(CONSOLE_PORT),
    ZEUS_ARG_ROOM: ROOM
  });
}, 600);

setTimeout(() => {
  const base = `http://${HOST}:${CONSOLE_PORT}`;
  const ui = resolveZeusUiPorts();
  const cacheBase = `http://${HOST}:${ui.view.port}`;
  const firehoseBase = `http://${HOST}:${ui.firehose.port}`;
  console.log('');
  console.log('[launch] ── los 3 visores ─────────────────────────────');
  console.log(`[launch]   🗺️  tablero    → ${base}/views/tablero`);
  console.log(`[launch]   🧍 jugador 1  → ${base}/views/jugador?actor=uno`);
  console.log(`[launch]   🧍 jugador 2  → ${base}/views/jugador?actor=dos`);
  console.log('[launch] ── navegadores con tracking (?actor=) ────────');
  console.log(`[launch]   📂 cache-browser   → ${cacheBase}/?actor=uno`);
  console.log(`[launch]   📂 cache (dos)     → ${cacheBase}/?actor=dos`);
  console.log(`[launch]   🔥 firehose-browser → ${firehoseBase}/?actor=uno`);
  console.log(`[launch]   🔥 firehose (dos)   → ${firehoseBase}/?actor=dos`);
  console.log(`[launch]   (room ${ROOM} · levanta browsers con ZEUS_ARG_TRACK_ACTOR=uno|dos)`);
  console.log(`[launch]   (room ${ROOM} · Ctrl+C para parar)`);
  console.log('[launch] ──────────────────────────────────────────────');
  console.log('');
}, 1800);
