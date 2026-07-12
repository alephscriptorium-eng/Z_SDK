#!/usr/bin/env node
/**
 * VitePress dev server for Zeus documentation portal.
 * Run: npm run docs:dev [-- --port N]
 */

import { spawn } from 'node:child_process';
import { resolveSpecToolPorts } from '@zeus/presets-sdk/env';

function parsePortArg(argv) {
  const idx = argv.indexOf('--port');
  if (idx === -1) return null;
  const raw = argv[idx + 1];
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const override = parsePortArg(process.argv.slice(2));
const { docs } = resolveSpecToolPorts();
const port = override ?? docs;

const child = spawn(
  'npx',
  ['vitepress', 'dev', 'docs', '--port', String(port)],
  { cwd: process.cwd(), stdio: 'inherit', shell: true }
);

child.on('exit', (code) => process.exit(code ?? 1));
