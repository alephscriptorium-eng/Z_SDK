/**
 * Starts the mcp-launcher MCP server.
 */

import { isMainModule, runMcpMain } from '@zeus/presets-sdk/mcp';
import { createServer, resolveLauncherPort, SERVER_NAME } from './launcher-server.mjs';
import { resolveCatalogLive } from './catalog.mjs';

/**
 * @param {{ port?: number, refreshEditor?: boolean }} [opts]
 */
export async function startAll(opts = {}) {
  const catalog = await resolveCatalogLive();
  const port = opts.port ?? resolveLauncherPort();
  const handle = await createServer({
    port,
    catalog,
    refreshEditor: opts.refreshEditor
  }).start();
  return [handle];
}

export { SERVER_NAME };

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
