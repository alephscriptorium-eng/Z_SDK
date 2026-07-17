/**
 * Resolución async de feeds para la autoridad (auto probe → real | synthetic).
 */

import { resolveFeeds } from '@zeus/arg-domain';
import { resolveMcpApprovalToken } from '@zeus/presets-sdk';
import { probeMcpHealth } from './mcp-client.mjs';
import { createRealFeeds } from './real.mjs';

/**
 * @param {{
 *   mode?: 'auto'|'synthetic'|'real',
 *   seed?: number,
 *   logger?: Console,
 *   mcpPorts?: object,
 *   gamemap?: object,
 *   topology?: { chambers: object, corridors: object },
 *   host?: string
 * }} opts
 */
export async function resolveRuntimeFeeds({
  mode = 'auto',
  seed = 1,
  logger = console,
  mcpPorts = {},
  gamemap = {},
  topology = null,
  host = 'localhost'
} = {}) {
  if (mode === 'synthetic') {
    return resolveFeeds({ mode: 'synthetic', seed, logger });
  }

  if (mode === 'auto') {
    const ok = await probeMcpHealth(mcpPorts, { host });
    if (!ok) {
      logger.warn?.('[arg-feeds] auto → sintético (MCP no responde)');
      return resolveFeeds({ mode: 'synthetic', seed, logger });
    }
    mode = 'real';
  }

  const feeds = createRealFeeds({
    mcpPorts,
    seed,
    logger,
    gamemap,
    approvalToken: resolveMcpApprovalToken(),
    host
  });
  await feeds.connect();

  if (topology) {
    feeds.mazeSeed = await feeds.mazeSource.loadMaze(topology);
  }

  return feeds;
}
