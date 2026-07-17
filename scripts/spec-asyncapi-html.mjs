#!/usr/bin/env node
/**
 * Generate static AsyncAPI HTML for the Zeus protocol contract.
 * Run: npm run spec:asyncapi:html
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const spec = path.join(root, 'packages/engine/protocol/spec/asyncapi.yaml');
const outDir = path.join(root, 'docs', 'public', 'api', 'protocol');

fs.mkdirSync(outDir, { recursive: true });

console.log(`→ Zeus protocol: ${path.relative(root, spec)}`);

const result = spawnSync(
  'npx',
  [
    'asyncapi',
    'generate',
    'fromTemplate',
    spec,
    '@asyncapi/html-template',
    '-o',
    outDir,
    '--force-write',
    '--use-new-generator'
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`\nAsyncAPI HTML generated: docs/public/api/protocol/`);
