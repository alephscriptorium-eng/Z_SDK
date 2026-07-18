/**
 * MCP client helpers for feed loaders (node-only).
 */

import { MCPToolsExtractor, healthUrlFor } from '@zeus/presets-sdk';

const DEFAULT_PROBE_MS = 2000;

/**
 * @param {object} content
 */
export function parseToolJson(content) {
  const block = Array.isArray(content) ? content[0] : content?.content?.[0];
  if (!block || block.type !== 'text') {
    throw new Error('MCP tool result missing JSON text block');
  }
  return JSON.parse(block.text);
}

/**
 * @param {import('@zeus/presets-sdk').MCPToolsExtractor} client
 * @param {string} name
 * @param {object} [args]
 */
export async function callToolJson(client, name, args = {}) {
  const raw = await client.callTool(name, args);
  return parseToolJson(raw);
}

/**
 * Probe GET /mcp/health for the ports that back feed families.
 * @param {{
 *   firehose?: { disk: number },
 *   lineas?: { espana?: number, wpHistoria?: number },
 *   ssb?: { disk: number }
 * }} ports
 * @param {{
 *   timeoutMs?: number,
 *   host?: string,
 *   require?: ('stream'|'static'|'gossip')[]
 * }} [opts]
 */
export async function probeFeedMcpHealth(
  ports,
  { timeoutMs = DEFAULT_PROBE_MS, host = 'localhost', require = ['stream', 'static'] } = {}
) {
  /** @type {Record<string, string[]>} */
  const byFamily = {
    stream: [],
    static: [],
    gossip: []
  };
  if (ports?.firehose?.disk) {
    byFamily.stream.push(`http://${host}:${ports.firehose.disk}/mcp`);
  }
  if (ports?.lineas?.espana) {
    byFamily.static.push(`http://${host}:${ports.lineas.espana}/mcp`);
  }
  if (ports?.lineas?.wpHistoria) {
    byFamily.static.push(`http://${host}:${ports.lineas.wpHistoria}/mcp`);
  }
  if (ports?.ssb?.disk) {
    byFamily.gossip.push(`http://${host}:${ports.ssb.disk}/mcp`);
  }

  const urls = [];
  for (const family of require) {
    const list = byFamily[family] ?? [];
    if (list.length === 0) return false;
    urls.push(...list);
  }
  if (urls.length === 0) return false;

  const checks = urls.map(async (mcpUrl) => {
    const healthUrl = healthUrlFor(mcpUrl);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(healthUrl, { signal: controller.signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  });

  const results = await Promise.all(checks);
  return results.every(Boolean);
}

/**
 * Persistent MCP clients for feed families.
 * Soft-fail: unreachable ports leave the slot null (caller uses synthetic).
 * @param {{
 *   firehose?: { disk: number },
 *   lineas?: { espana?: number, wpHistoria?: number },
 *   ssb?: { disk: number }
 * }} ports
 * @param {{ host?: string, logger?: Console }} [opts]
 */
export async function createFeedMcpClients(ports, { host = 'localhost', logger = console } = {}) {
  const clients = {
    firehose: null,
    espana: null,
    wp: null,
    ssb: null,
    close: async () => {}
  };

  async function connectOne(baseUrl) {
    const extractor = new MCPToolsExtractor();
    await extractor.connectToServer(baseUrl, 'http');
    return extractor;
  }

  const closers = [];

  async function tryConnect(label, baseUrl) {
    try {
      const ex = await connectOne(baseUrl);
      closers.push(() => ex.disconnect());
      return ex;
    } catch (err) {
      logger.warn?.(`[feed-kit] MCP ${label} no disponible:`, err.message);
      return null;
    }
  }

  if (ports?.firehose?.disk) {
    clients.firehose = await tryConnect('firehose', `http://${host}:${ports.firehose.disk}`);
  }
  if (ports?.lineas?.espana) {
    clients.espana = await tryConnect('espana', `http://${host}:${ports.lineas.espana}`);
  }
  if (ports?.lineas?.wpHistoria) {
    clients.wp = await tryConnect('wp', `http://${host}:${ports.lineas.wpHistoria}`);
  }
  if (ports?.ssb?.disk) {
    clients.ssb = await tryConnect('ssb', `http://${host}:${ports.ssb.disk}`);
  }

  clients.close = async () => {
    await Promise.allSettled(closers.map((fn) => fn()));
  };

  return clients;
}
