import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, monorepoRoot } from './lib/load-env.mjs';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const loaded = loadEnv();
const children = [];

console.log('');
console.log('┌─────────────────────────────────────────┐');
console.log('│  🗺️  Map demo · @zeus/game-demos        │');
console.log('└─────────────────────────────────────────┘');
console.log('');

if (!loaded) {
  console.warn('[launch] AVISO: no hay .env en la raíz del monorepo');
} else {
  console.log(`[launch] room=${process.env.ZEUS_SCRIPTORIUM_ROOM ?? '?'}`);
}

console.log('[launch] map → watch → walk · Ctrl+C para parar\n');

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
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  pipeWithPrefix(label, child.stdout, process.stdout);
  pipeWithPrefix(label, child.stderr, process.stderr);
  child.on('exit', (code, signal) => {
    if (signal) console.log(`[launch] ${label} terminó (${signal})`);
    else if (code && code !== 0) console.error(`[launch] ${label} salió con código ${code}`);
    shutdown(code ?? 0);
  });
  children.push(child);
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

startApp('map', join(packageRoot, 'apps/map/index.mjs'), {
  ZEUS_SCRIPTORIUM_USER: process.env.MAP_USER || 'map-authority',
});

setTimeout(() => {
  startApp('watch', join(packageRoot, 'apps/watch/index.mjs'), {
    ZEUS_SCRIPTORIUM_USER: process.env.WATCH_USER || 'watch-demo',
  });
}, 800);

setTimeout(() => {
  startApp('walk', join(packageRoot, 'apps/walk/index.mjs'), {
    ZEUS_SCRIPTORIUM_USER: process.env.WALK_USER || 'walk-demo',
  });
}, 1600);
