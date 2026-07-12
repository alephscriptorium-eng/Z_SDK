import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const role = process.argv[2];

const ROLES = ['ping', 'pong', 'rabbit', 'spider', 'horse'];

if (!ROLES.includes(role)) {
  console.error(`Uso: node run-one.mjs <${ROLES.join('|')}>`);
  process.exit(1);
}

const apps = {
  ping: { path: 'apps/ping/index.mjs', userKey: 'PING_USER', fallback: 'ping-demo' },
  pong: { path: 'apps/pong/index.mjs', userKey: 'PONG_USER', fallback: 'pong-demo' },
  rabbit: { path: 'apps/rabbit/index.mjs', userKey: 'RABBIT_USER', fallback: 'rabbit-demo' },
  spider: { path: 'apps/spider/index.mjs', userKey: 'SPIDER_USER', fallback: 'spider-demo' },
  horse: { path: 'apps/horse/index.mjs', userKey: 'HORSE_USER', fallback: 'horse-demo' }
};

const spec = apps[role];
// bots now live inside zeus-sdk (block-11 GA-C): packageRoot is
// zeus-sdk/packages/app/ping-pong-bots → zeus-sdk root is 3 levels up.
const zeusSdkRoot = join(packageRoot, '..', '..', '..');

const child = spawn(process.execPath, [join(packageRoot, spec.path)], {
  cwd: zeusSdkRoot,
  env: {
    ...process.env,
    ZEUS_SCRIPTORIUM_USER: process.env[spec.userKey] || process.env.ZEUS_SCRIPTORIUM_USER || spec.fallback
  },
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
