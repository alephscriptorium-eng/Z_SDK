/**
 * e2e:domain — runs all L-session domain gate e2e scripts sequentially.
 * Each sub-script has its own 30s hard timeout via domain-helpers.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scripts = [
  'domain-manifest.mjs',
  'domain-map.mjs',
  'domain-firehose.mjs',
  'domain-selection.mjs'
];

for (const script of scripts) {
  const file = path.join(__dirname, script);
  console.log(`\n=== ${script} ===`);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('close', resolve);
  });
  if (code !== 0) {
    console.error(`\ne2e:domain: FAILED at ${script}`);
    process.exit(code ?? 1);
  }
}

console.log('\ne2e:domain: all domain gate scripts OK');
