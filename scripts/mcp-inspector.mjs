#!/usr/bin/env node
/**
 * MCP Inspector UI + proxy for Zeus MCP servers.
 * Run: npm run spec:inspector
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveInspectorEndpoint } from '@zeus/presets-sdk/env';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { uiPort, proxyPort, token } = resolveInspectorEndpoint();

const child = spawn(
  'npx',
  ['@modelcontextprotocol/inspector'],
  {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      CLIENT_PORT: String(uiPort),
      SERVER_PORT: String(proxyPort),
      MCP_PROXY_AUTH_TOKEN: token
    }
  }
);

child.on('exit', (code) => process.exit(code ?? 1));
