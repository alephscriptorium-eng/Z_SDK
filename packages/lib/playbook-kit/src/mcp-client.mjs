/**
 * Cliente JSON-RPC HTTP crudo contra un MCP Streamable HTTP (POST /mcp).
 * Puerto/URL los aporta el caller (presets-sdk/env — PRACTICAS §1.1).
 */

/**
 * @param {{ host?: string, port: number, basePath?: string }} opts
 */
export function createMcpHttpClient({ host = 'localhost', port, basePath = '/mcp' }) {
  if (!port) throw new Error('createMcpHttpClient: port requerido (resolveZeusMcpPorts)');
  const origin = `http://${host}:${port}`;
  const mcpUrl = `${origin}${basePath}`;
  const healthUrl = `${origin}${basePath}/health`;
  let rpcSeq = 1;

  async function rpc(method, params = {}) {
    const res = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: rpcSeq++, method, params })
    });
    const body = await res.json();
    if (body.error) throw new Error(`${method} → ${body.error.message}`);
    return body.result;
  }

  return {
    origin,
    mcpUrl,
    healthUrl,
    async health() {
      const res = await fetch(healthUrl);
      if (!res.ok) throw new Error(`health HTTP ${res.status}`);
      return res.json();
    },
    async waitConnected(timeoutMs = 25000) {
      const start = Date.now();
      let last = null;
      while (Date.now() - start < timeoutMs) {
        try {
          last = await this.health();
          if (last.connected === true) return last;
        } catch {
          /* retry */
        }
        await sleep(250);
      }
      throw new Error(
        `timeout esperando health connected en ${healthUrl} (último: ${JSON.stringify(last)})`
      );
    },
    initialize() {
      return rpc('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'zeus-playbook-kit', version: '0.1.0' }
      });
    },
    listTools() {
      return rpc('tools/list', {});
    },
    /**
     * @param {string} name
     * @param {Record<string, unknown>} [args]
     * @returns {Promise<{ ok?: boolean, error?: string, evidencia?: unknown, [k: string]: unknown }>}
     */
    async callTool(name, args = {}) {
      const result = await rpc('tools/call', { name, arguments: args });
      const text = result?.content?.[0]?.text;
      if (typeof text !== 'string') {
        throw new Error(`tools/call ${name}: sin content[0].text`);
      }
      return JSON.parse(text);
    }
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
