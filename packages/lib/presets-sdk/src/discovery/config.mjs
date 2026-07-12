/**
 * Shared Zeus ecosystem MCP discovery configuration.
 * Merge order: DEFAULT → data/zeus-discovery.json → local config.json.
 */

import {
  applyEnvToMcp,
  mcpToDiscoveryUrls,
  resolveExtraDiscoveryUrls,
  DEFAULT_ZEUS_MCP,
  DEFAULT_ZEUS_UI_MESH
} from '../env/index.mjs';
import { loadSharedDiscoveryFile } from './config-file.mjs';

export { DEFAULT_ZEUS_MCP, DEFAULT_ZEUS_UI_MESH };

export const DEFAULT_ZEUS_DISCOVERY = {
  timeoutMs: 2000,
  urls: []
};

DEFAULT_ZEUS_DISCOVERY.urls = mcpToDiscoveryUrls('localhost', DEFAULT_ZEUS_MCP);

export function mergeUrls(base = [], override = []) {
  const merged = [...base];
  for (const url of override) {
    if (url && !merged.includes(url)) merged.push(url);
  }
  return merged;
}

/**
 * Resolve discoverServers() sources from layered config.
 * @param {{ dataDir?: string, localDiscovery?: { urls?: string[], timeoutMs?: number, exclusiveUrls?: boolean } }} opts
 * @returns {{ urls: string[], timeoutMs: number }}
 */
export function resolveDiscoverySources({ dataDir, localDiscovery = {} } = {}) {
  const timeoutMs =
    localDiscovery.timeoutMs ??
    loadSharedDiscoveryFile(dataDir).timeoutMs ??
    DEFAULT_ZEUS_DISCOVERY.timeoutMs;

  if (localDiscovery.exclusiveUrls && localDiscovery.urls?.length) {
    return { urls: [...localDiscovery.urls], timeoutMs };
  }

  const shared = loadSharedDiscoveryFile(dataDir);
  const mcpBlock = { ...DEFAULT_ZEUS_MCP, ...shared.mcp };
  const { host, mcp } = applyEnvToMcp(mcpBlock, shared.host);
  const derivedUrls = mcpToDiscoveryUrls(host, mcp);
  const urls = mergeUrls(
    mergeUrls(derivedUrls, shared.urls || []),
    mergeUrls(localDiscovery.urls || [], resolveExtraDiscoveryUrls())
  );
  return { urls, timeoutMs };
}
