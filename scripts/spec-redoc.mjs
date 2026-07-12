#!/usr/bin/env node
/**
 * Generate static Redoc HTML for Zeus REST OpenAPI specs.
 * Run: npm run spec:redoc
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const redoclyBin = require.resolve('@redocly/cli/bin/cli.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'public', 'api');

/** Single source of truth for OpenAPI specs rendered as Redoc HTML. */
const SPECS = [
  { slug: 'editor-ui', label: 'Editor UI', rel: 'packages/app/editor-ui/spec/openapi.yaml' },
  { slug: 'player-ui', label: 'Player UI (Tablero)', rel: 'packages/app/player-ui/spec/openapi.yaml' },
  { slug: 'view-ui', label: 'View UI', rel: 'packages/app/view-ui/spec/openapi.yaml' },
  { slug: 'firehose-view-ui', label: 'Firehose View UI', rel: 'packages/app/firehose-view-ui/spec/openapi.yaml' },
  { slug: 'mcp-http', label: 'MCP HTTP Transport', rel: 'packages/lib/presets-sdk/spec/mcp-http.openapi.yaml' }
];

fs.mkdirSync(outDir, { recursive: true });

const outputs = [];

for (const { slug, label, rel } of SPECS) {
  const specPath = path.join(root, rel);
  const outPath = path.join(outDir, `${slug}.html`);
  console.log(`→ ${label}: ${rel}`);

  const result = spawnSync(
    process.execPath,
    [redoclyBin, 'build-docs', specPath, '-o', outPath],
    { cwd: root, stdio: 'inherit' }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  outputs.push({ slug, label, outPath });
}

console.log('\nRedoc HTML generated:');
for (const { label, outPath } of outputs) {
  console.log(`  ${label}: ${pathToFileURL(outPath).href}`);
}
