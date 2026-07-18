#!/usr/bin/env node
/**
 * CLI: sync ATProto jetstream → DISK_01/FIREHOSE
 *
 *   node bin/jetstream-sync.mjs --fixture
 *   node bin/jetstream-sync.mjs --max=20 --ms=15000
 *
 * Env: ZEUS_VOLUMES_ROOT, ZEUS_JETSTREAM_URL, ZEUS_JETSTREAM_FIXTURE=1
 */

import path from 'node:path';
import { loadZeusEnv } from '@zeus/presets-sdk/env';
import { runJetstreamSync } from '../src/jetstream-sync.mjs';

loadZeusEnv();

function parseArgs(argv) {
  const out = { fixture: false, maxPosts: 50, durationMs: 30_000 };
  for (const arg of argv) {
    if (arg === '--fixture') out.fixture = true;
    else if (arg.startsWith('--max=')) out.maxPosts = Number(arg.slice(6)) || 50;
    else if (arg.startsWith('--ms=')) out.durationMs = Number(arg.slice(5)) || 30_000;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const volumesRoot =
  process.env.ZEUS_VOLUMES_ROOT ||
  path.resolve(process.cwd(), 'VOLUMES');

const result = await runJetstreamSync({
  volumesRoot,
  fixture: args.fixture,
  maxPosts: args.maxPosts,
  durationMs: args.durationMs,
  logger: console
});

console.log(
  `jetstream sync OK mode=${result.mode} written=${result.written} root=${volumesRoot}`
);
if (result.files?.length) {
  console.log(`files: ${result.files.slice(0, 5).join(', ')}${result.files.length > 5 ? '…' : ''}`);
}
