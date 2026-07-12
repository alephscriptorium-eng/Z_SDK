#!/usr/bin/env node
/**
 * Stop Zeus services by id — ports resolved from root .env via @zeus/presets-sdk/env.
 * Run: npm run stop:services -- "<message>" <service-id> [service-id...]
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZEUS_STOP_SERVICES, resolveStopTargets } from '@zeus/presets-sdk/env';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const label = process.argv[2];
const serviceIds = process.argv.slice(3);

if (!label || serviceIds.length === 0) {
  console.error('Usage: npm run stop:services -- "<message>" <service-id> [service-id...]');
  console.error(`Services: all, ${ZEUS_STOP_SERVICES.join(', ')}`);
  process.exit(1);
}

let ports;
try {
  ports = resolveStopTargets(serviceIds);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const script = path.join(__dirname, 'stop-ports.sh');
const result = spawnSync('bash', [script, label, ...ports.map(String)], {
  cwd: root,
  stdio: 'inherit'
});

process.exit(result.status ?? 1);
