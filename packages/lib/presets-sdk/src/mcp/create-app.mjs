/**
 * Express app builder for Streamable HTTP MCP servers.
 * Centralizes cors, JSON body parsing, /mcp/health, MCP mount, and HTTP start.
 */

import express from 'express';
import cors from 'cors';
import { mountFavicon, FAVICON_HREF } from '@zeus/ui-kit';
import { mountMCPRoute, createMcpHttpStart } from './stateless-route.mjs';
import { getMcpCapabilities } from './introspection.mjs';
import { buildInspectorUrl, resolveZeusHost } from '../env/index.mjs';

/**
 * Mount the canonical GET /mcp/health route.
 *
 * @param {import('express').Express} app
 * @param {{
 *   mcpServer: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
 *   name: string,
 *   version: string,
 *   extraHealth?: (req: import('express').Request) => Record<string, unknown>
 * }} options
 */
export function mountHealthRoute(app, { mcpServer, name, version, extraHealth }) {
  app.get('/mcp/health', (req, res) => {
    const body = {
      status: 'ok',
      server: name,
      name,
      version,
      capabilities: getMcpCapabilities(mcpServer),
      ...(extraHealth ? extraHealth(req) : {})
    };
    res.status(200).json(body);
  });
}

/**
 * Build a ready-to-start Express app for a stateless MCP HTTP server.
 *
 * @param {{
 *   mcpServer: import('@modelcontextprotocol/sdk/server/mcp.js').McpServer,
 *   name: string,
 *   version: string,
 *   port: number,
 *   extraHealth?: (req: import('express').Request) => Record<string, unknown>,
 *   extraRoutes?: (app: import('express').Express) => void,
 *   mcpPath?: string,
 *   logLabel?: string
 * }} options
 * @returns {{
 *   name: string,
 *   port: number,
 *   app: import('express').Express,
 *   start: () => Promise<{ name: string, port: number, url: string, close: () => Promise<void> }>
 * }}
 */
export function createMcpApp({
  mcpServer,
  name,
  version,
  port,
  extraHealth,
  extraRoutes,
  mcpPath = '/mcp',
  logLabel
}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  mountFavicon(app);

  mountHealthRoute(app, { mcpServer, name, version, extraHealth });

  const mcpUrl = `http://${resolveZeusHost()}:${port}${mcpPath}`;
  app.get('/docs', (_req, res) => {
    const inspectorUrl = buildInspectorUrl(mcpUrl);
    const safeName = String(name).replace(/[<>&]/g, '');
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeName} — MCP Inspector</title>
  <link rel="icon" href="${FAVICON_HREF}" type="image/x-icon" sizes="any" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; }
    a.btn { display: inline-block; margin-top: 0.75rem; padding: 0.5rem 1rem; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; }
    p.hint { color: #52525b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>${safeName}</h1>
  <p>Streamable HTTP endpoint: <code>${mcpUrl}</code></p>
  <p><a class="btn" href="${inspectorUrl}">Open in MCP Inspector</a></p>
  <p class="hint">Start the Inspector first: <code>npm run spec:inspector</code> (or VS Code <strong>Spec ▸ mcp-inspector</strong>).</p>
</body>
</html>`);
  });

  if (extraRoutes) {
    extraRoutes(app);
  }

  mountMCPRoute(app, { mcpServer, path: mcpPath, logLabel: logLabel || name });

  const start = createMcpHttpStart(app, { name, port, mcpServer, path: mcpPath });

  return { name, port, app, start };
}
