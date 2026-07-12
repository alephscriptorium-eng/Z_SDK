/**
 * Standard bootstrap for Zeus Streamable HTTP MCP servers.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServerCardResource, updateServerCard } from './server-card.mjs';
import { registerCommonMCP } from './register-bridge-tools.mjs';
import { createMcpApp } from './create-app.mjs';

/**
 * @param {{
 *   name: string,
 *   version: string,
 *   port: number,
 *   host?: string,
 *   registry?: Array<object>,
 *   templateRegistry?: Array<object>,
 *   promptRegistry?: Array<object>,
 *   buildMcp?: (mcpServer: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer) => void,
 *   serverCard?: boolean,
 *   extraHealth?: (req: import('express').Request) => Record<string, unknown>,
 *   extraRoutes?: (app: import('express').Express) => void,
 *   mcpPath?: string,
 *   logLabel?: string,
 *   getCardExamples?: () => Record<string, unknown>
 * }} options
 */
export function createStandardMcpServer({
  name,
  version,
  port,
  host = 'localhost',
  registry = [],
  templateRegistry = [],
  promptRegistry = [],
  buildMcp,
  serverCard = true,
  extraHealth,
  extraRoutes,
  mcpPath,
  logLabel,
  getCardExamples
}) {
  const mcpServer = new McpServer({ name, version });
  const resourceRegistry = serverCard
    ? [...registry, createServerCardResource(name)]
    : [...registry];

  if (buildMcp) {
    buildMcp(mcpServer);
  }

  registerCommonMCP(mcpServer, {
    serverName: name,
    registry: resourceRegistry,
    templateRegistry,
    promptRegistry
  });

  if (serverCard) {
    updateServerCard(resourceRegistry, mcpServer, { name, version, port, host, getCardExamples });
  }

  const appBundle = createMcpApp({
    mcpServer,
    name,
    version,
    port,
    extraHealth,
    extraRoutes,
    mcpPath,
    logLabel: logLabel || name
  });

  return { ...appBundle, mcpServer };
}
