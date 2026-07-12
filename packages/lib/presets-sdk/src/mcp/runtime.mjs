/**
 * Shared MCP server launcher: isMain detection, health URL contract, graceful shutdown.
 */

import { pathToFileURL } from 'node:url';

/**
 * @param {string} importMetaUrl
 */
export function isMainModule(importMetaUrl) {
  return Boolean(process.argv[1] && importMetaUrl === pathToFileURL(process.argv[1]).href);
}

/**
 * Canonical health probe path for Streamable HTTP MCP servers.
 * @param {string} mcpUrl - e.g. http://localhost:4101/mcp
 */
export function healthUrlFor(mcpUrl) {
  const base = mcpUrl.replace(/\/$/, '');
  if (base.endsWith('/mcp')) {
    return `${base}/health`;
  }
  return base.replace(/\/mcp$/, '/mcp/health');
}

/**
 * @param {string|number|{ name?: string, url?: string, close?: () => Promise<void> }} item
 */
function normalizeHandle(item) {
  if (item && typeof item === 'object' && ('close' in item || 'url' in item || 'name' in item)) {
    return item;
  }
  return null;
}

/**
 * Start MCP server(s), log handles, install shutdown handlers once.
 *
 * @param {() => Promise<object|object[]>} startFn
 * @param {{ label?: string }} [options]
 */
export async function runMcpMain(startFn, options = {}) {
  const result = await startFn();
  const handles = (Array.isArray(result) ? result : [result])
    .map(normalizeHandle)
    .filter(Boolean);

  for (const handle of handles) {
    if (handle.url) {
      const name = handle.name || options.label || 'mcp';
      console.log(`[${name}] MCP server listening at ${handle.url} (health: ${healthUrlFor(handle.url)})`);
    }
  }

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down${handles.length > 1 ? ` ${handles.length} servers` : ''}...`);
    await Promise.allSettled(handles.map((h) => h.close?.()));
    console.log(handles.length > 1 ? 'All servers stopped.' : 'Server stopped.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
