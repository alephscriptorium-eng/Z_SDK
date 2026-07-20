/**
 * Generate VS Code / Cursor-compatible mcp.json for the Zeus fleet catalog.
 */

/**
 * @param {import('./catalog.mjs').CatalogEntry[]} catalog
 * @param {{ host?: string }} [opts]
 */
export function generateVscodeMcpConfig(catalog, opts = {}) {
  const servers = {};
  for (const entry of catalog) {
    const url = entry.url || `http://${opts.host || 'localhost'}:${entry.port}${entry.mcpPath || '/mcp'}`;
    servers[entry.id] = {
      type: 'http',
      url
    };
  }
  return {
    inputs: [],
    servers
  };
}

/**
 * @param {object} config
 */
export function isValidVscodeMcpConfig(config) {
  if (!config || typeof config !== 'object') return false;
  if (!config.servers || typeof config.servers !== 'object') return false;
  for (const [id, server] of Object.entries(config.servers)) {
    if (!id || typeof id !== 'string') return false;
    if (!server || typeof server !== 'object') return false;
    if (server.type !== 'http') return false;
    if (typeof server.url !== 'string' || !/^https?:\/\//.test(server.url)) return false;
  }
  return true;
}
