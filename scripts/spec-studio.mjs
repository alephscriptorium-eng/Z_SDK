#!/usr/bin/env node
/**
 * AsyncAPI Studio for Zeus protocol spec.
 * Run: npm run spec:studio
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSpecToolPorts } from '@zeus/presets-sdk/env';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = path.join(root, 'packages/lib/protocol/spec/asyncapi.yaml');
const { studio } = resolveSpecToolPorts();

const child = spawn(
  'npx',
  ['asyncapi', 'start', 'studio', spec, '--port', String(studio), '--noBrowser'],
  { cwd: root, stdio: 'inherit', shell: true }
);

child.on('exit', (code) => process.exit(code ?? 1));
