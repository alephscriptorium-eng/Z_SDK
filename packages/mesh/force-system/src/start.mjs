/**
 * Starts the forces MCP server. Usable as CLI (npm start) or via startAll().
 */

import { resolveZeusMcpPorts, isMainModule, runMcpMain } from '@zeus/presets-sdk';
import { createServer } from './force-server.mjs';
import { loadForcesData } from './loader.mjs';
import { SERVER_NAME } from './config.mjs';

/**
 * @param {string} [basePath]
 * @returns {Promise<Array<{ name: string, port: number, url: string, close: () => Promise<void> }>>}
 */
export async function startAll(basePath) {
  const port = resolveZeusMcpPorts().forces.disk;
  const forcesData = await loadForcesData(basePath);
  const handle = await createServer(port, forcesData).start();
  return [handle];
}

export { SERVER_NAME };

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
