/**
 * Starts the SSB MCP server. Usable as CLI (npm start) or via startAll().
 */

import { resolveZeusMcpPorts, isMainModule, runMcpMain, resolveSsbBasePath } from '@zeus/presets-sdk';
import { assertVolumesRootBootable } from '@zeus/volumes-ops';
import { createServer } from './ssb-server.mjs';
import { SERVER_NAME } from './config.mjs';

/**
 * @param {string} [basePath]
 * @returns {Promise<Array<{ name: string, port: number, url: string, close: () => Promise<void> }>>}
 */
export async function startAll(basePath) {
  const port = resolveZeusMcpPorts().ssb.disk;
  // WP-U206 · decisión ⑩: comprobación ANTES de resolver y leer el volumen.
  assertVolumesRootBootable({ service: SERVER_NAME, volumeIds: ['ssb'] });
  const root = basePath ?? resolveSsbBasePath();
  const handle = await createServer(port, root).start();
  return [handle];
}

export { SERVER_NAME };

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
