import { getMcpCapabilities } from './introspection.mjs';

export const SERVER_CARD_URI = 'server://card';

/**
 * @param {{
 *   name: string,
 *   version: string,
 *   port: number,
 *   server: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
 *   host?: string,
 *   examples?: Record<string, unknown>
 * }}
 */
export function buildServerCard({ name, version, port, server, host = 'localhost', examples }) {
  const card = {
    name,
    version,
    port,
    transport: 'streamable-http',
    endpoint: `http://${host}:${port}/mcp`,
    capabilities: getMcpCapabilities(server)
  };
  if (examples && Object.keys(examples).length > 0) {
    card.examples = examples;
  }
  return card;
}

/**
 * Registry entry for server://card. Wire with updateServerCard after MCP build.
 * @param {string} serverName
 */
export function createServerCardResource(serverName) {
  return {
    name: 'server-card',
    uri: SERVER_CARD_URI,
    title: `${serverName} server card`,
    mimeType: 'application/json',
    description: `Card describing the "${serverName}" MCP server itself: name, version, port and capabilities summary.`,
    read: () => {
      throw new Error('server://card is not wired yet; call updateServerCard after registerCommonMCP');
    }
  };
}

/**
 * Patches server://card in the registry to read capabilities dynamically from the built McpServer.
 * @param {Array<{ uri: string, read: () => unknown }>} registry
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ name: string, version: string, port: number, host?: string, getCardExamples?: () => Record<string, unknown> }} meta
 */
export function updateServerCard(registry, server, { name, version, port, host, getCardExamples }) {
  const entry = registry.find((item) => item.uri === SERVER_CARD_URI);
  if (entry) {
    entry.read = () =>
      buildServerCard({
        name,
        version,
        port,
        server,
        host,
        examples: getCardExamples ? getCardExamples() : undefined
      });
  }
}
