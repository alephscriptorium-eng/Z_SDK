/**
 * Starts linea-editor MCP. CLI: npm start -w @zeus/linea-editor
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveZeusMcpPorts,
  isMainModule,
  runMcpMain
} from '@zeus/presets-sdk';
import { createServer } from './editor-server.mjs';
import { SERVER_NAME } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultLineasRoot() {
  // packages/mesh/linea-editor/src → repo VOLUMES/LINEAS
  return path.resolve(__dirname, '../../../../VOLUMES/LINEAS');
}

/**
 * @param {{ lineasRoot?: string, port?: number }} [opts]
 */
export async function startAll(opts = {}) {
  const ports = resolveZeusMcpPorts();
  const port = opts.port ?? ports.lineaEditor?.disk ?? 4115;
  const lineasRoot = opts.lineasRoot || process.env.ZEUS_LINEAS_ROOT || defaultLineasRoot();
  const handle = await createServer({ lineasRoot, port }).start();
  return [handle];
}

export { SERVER_NAME };

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
