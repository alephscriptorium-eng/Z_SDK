/**
 * Cliente MCP ligero para la autoridad delta (probe + tools).
 * Node-only — no importar desde arg-domain ni visores.
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
 * Probe GET /mcp/health on firehose + linea MCP ports (2 s timeout each).
 * @param {{ firehose?: { disk: number }, lineas?: { espana: number, wpHistoria: number } }} ports
 * @param {{ timeoutMs?: number, host?: string }} [opts]
 */
export async function probeMcpHealth(ports, { timeoutMs = DEFAULT_PROBE_MS, host = 'localhost' } = {}) {
  const urls = [];
  if (ports?.firehose?.disk) urls.push(`http://${host}:${ports.firehose.disk}/mcp`);
  if (ports?.lineas?.espana) urls.push(`http://${host}:${ports.lineas.espana}/mcp`);
  if (ports?.lineas?.wpHistoria) urls.push(`http://${host}:${ports.lineas.wpHistoria}/mcp`);
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
 * Conecta clientes MCP persistentes para firehose + linea (espana, wp-historia).
 * @param {{ firehose?: { disk: number }, lineas?: { espana: number, wpHistoria: number } }} ports
 * @param {{ host?: string }} [opts]
 */
export async function createArgMcpClients(ports, { host = 'localhost' } = {}) {
  const clients = { firehose: null, espana: null, wp: null, close: async () => {} };

  async function connectOne(extractor, baseUrl) {
    await extractor.connectToServer(baseUrl, 'http');
    return extractor;
  }

  const closers = [];

  if (ports?.firehose?.disk) {
    const ex = new MCPToolsExtractor();
    await connectOne(ex, `http://${host}:${ports.firehose.disk}`);
    clients.firehose = ex;
    closers.push(() => ex.disconnect());
  }
  if (ports?.lineas?.espana) {
    const ex = new MCPToolsExtractor();
    await connectOne(ex, `http://${host}:${ports.lineas.espana}`);
    clients.espana = ex;
    closers.push(() => ex.disconnect());
  }
  if (ports?.lineas?.wpHistoria) {
    const ex = new MCPToolsExtractor();
    await connectOne(ex, `http://${host}:${ports.lineas.wpHistoria}`);
    clients.wp = ex;
    closers.push(() => ex.disconnect());
  }

  clients.close = async () => {
    await Promise.allSettled(closers.map((fn) => fn()));
  };

  return clients;
}

/**
 * @param {import('@zeus/presets-sdk').MCPToolsExtractor} client
 */
export async function callToolJson(client, name, args = {}) {
  const raw = await client.callTool(name, args);
  return parseToolJson(raw);
}
