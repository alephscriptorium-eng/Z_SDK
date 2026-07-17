import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
// bots now live inside zeus-sdk (block-11 GA-C): packageRoot is
// zeus-sdk/examples/ping-pong-bots → zeus-sdk root is 2 levels up.
const zeusSdkRoot = join(packageRoot, '..', '..');
const children = [];

const ROLES = [
  { label: 'pong', role: 'pong', delay: 0 },
  { label: 'ping', role: 'ping', delay: 1500 },
  { label: 'rabbit-a', role: 'rabbit', delay: 2000, env: { ZEUS_SCRIPTORIUM_USER: 'rabbit-a' } },
  { label: 'rabbit-b', role: 'rabbit', delay: 2500, env: { ZEUS_SCRIPTORIUM_USER: 'rabbit-b' } },
  { label: 'spider', role: 'spider', delay: 3000 },
  { label: 'horse', role: 'horse', delay: 3500 }
];

console.log('');
console.log('┌─────────────────────────────────────────┐');
console.log('│  🏓 Ping-Pong · 5 roles (ZEUS rooms)    │');
console.log('└─────────────────────────────────────────┘');
console.log(`[launch] scriptorium=${process.env.ZEUS_SCRIPTORIUM_URL ?? 'http://localhost:3017'}`);
console.log('[launch] Ctrl+C para parar\n');

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

function startApp(label, role, extraEnv = {}) {
  process.env.PING_SESSION_MODE = 1;
  const child = spawn(process.execPath, [join(packageRoot, 'run-one.mjs'), role], {
    cwd: zeusSdkRoot,
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

for (const { label, role, delay, env } of ROLES) {
  setTimeout(() => startApp(label, role, env ?? {}), delay);
}
