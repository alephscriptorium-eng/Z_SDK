import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, monorepoRoot } from './lib/load-env.mjs';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const role = process.argv[2];

const roles = {
  map: { path: 'apps/map/index.mjs', userKey: 'MAP_USER', fallback: 'map-authority' },
  walk: { path: 'apps/walk/index.mjs', userKey: 'WALK_USER', fallback: 'walk-demo' },
  watch: { path: 'apps/watch/index.mjs', userKey: 'WATCH_USER', fallback: 'watch-demo' },
};

const spec = roles[role];
if (!spec) {
  console.error('Uso: node run-one.mjs <map|walk|watch>');
  process.exit(1);
}

loadEnv();

const child = spawn(process.execPath, [join(packageRoot, spec.path)], {
  cwd: monorepoRoot,
  env: { ...process.env, ZEUS_SCRIPTORIUM_USER: process.env[spec.userKey] || spec.fallback },
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
