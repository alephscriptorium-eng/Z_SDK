/**
 * MCP tool handlers — catalog-gated lifecycle only.
 */

import { z } from 'zod';
import { generateVscodeMcpConfig, isValidVscodeMcpConfig } from './vscode-config.mjs';
import { resolveCapability, listCapabilities } from './capability-map.mjs';
import { refreshEditorMcpCatalog } from './editor-refresh.mjs';

/** Local helper — avoids hard dep on presets-sdk/mcp for JSON tool results. */
function jsonContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{ manager: import('./process-manager.mjs').ProcessManager, refreshEditor?: boolean }} ctx
 */
export function buildMcp(server, ctx) {
  const { manager, refreshEditor = true } = ctx;

  async function maybeRefresh() {
    if (!refreshEditor) return { skipped: true, reason: 'disabled' };
    return refreshEditorMcpCatalog();
  }

  server.registerTool(
    'launch_mcp_server',
    {
      title: 'Launch MCP server',
      description:
        'Spawn a catalogued Zeus MCP server (and its spawnGroup). Rejects unknown ids — no arbitrary spawn.',
      inputSchema: {
        server_id: z.string().describe('Catalog id, e.g. linea-espana')
      }
    },
    async ({ server_id }) => {
      try {
        const result = await manager.launch(server_id);
        const editor = result.ok ? await maybeRefresh() : null;
        return jsonContent({ ...result, editor });
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );

  server.registerTool(
    'stop_mcp_server',
    {
      title: 'Stop MCP server',
      description: 'Stop the spawnGroup for a catalogued server id.',
      inputSchema: {
        server_id: z.string().describe('Catalog id')
      }
    },
    async ({ server_id }) => {
      try {
        const result = await manager.stop(server_id);
        const editor = await maybeRefresh();
        return jsonContent({ ...result, editor });
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );

  server.registerTool(
    'restart_mcp_server',
    {
      title: 'Restart MCP server',
      description: 'Stop then launch a catalogued server.',
      inputSchema: {
        server_id: z.string()
      }
    },
    async ({ server_id }) => {
      try {
        const result = await manager.restart(server_id);
        const editor = result.ok ? await maybeRefresh() : null;
        return jsonContent({ ...result, editor });
      } catch (err) {
        return jsonContent({ ok: false, error: String(err?.message || err) });
      }
    }
  );

  server.registerTool(
    'launch_all',
    {
      title: 'Launch all (or subset)',
      description:
        'Launch each spawnGroup once for workspace-backed catalog entries. Optional filter by ids.',
      inputSchema: {
        server_ids: z
          .array(z.string())
          .optional()
          .describe('Optional subset of catalog ids')
      }
    },
    async ({ server_ids }) => {
      const result = await manager.launchAll({ ids: server_ids });
      const editor = result.ok ? await maybeRefresh() : null;
      return jsonContent({ ...result, editor });
    }
  );

  server.registerTool(
    'health',
    {
      title: 'Fleet health',
      description: 'Report every catalog entry: port, managed?, probe status.',
      inputSchema: {}
    },
    async () => jsonContent(await manager.health())
  );

  server.registerTool(
    'generate_vscode_config',
    {
      title: 'Generate VS Code mcp.json',
      description: 'Produce a valid mcp.json for the Zeus fleet catalog (http URLs).',
      inputSchema: {}
    },
    async () => {
      const config = generateVscodeMcpConfig(manager.listCatalog());
      return jsonContent({
        ok: isValidVscodeMcpConfig(config),
        config
      });
    }
  );

  server.registerTool(
    'resolve_capability',
    {
      title: 'Resolve RNFP capability → catalog',
      description:
        'Map a federation capability tag to the catalog server that serves it (Z04). Does not launch.',
      inputSchema: {
        capability: z.string().describe('e.g. linea.satelite')
      }
    },
    async ({ capability }) =>
      jsonContent(resolveCapability(capability, { catalog: manager.listCatalog() }))
  );

  server.registerTool(
    'list_capabilities',
    {
      title: 'List capabilities',
      description: 'Capabilities from catalog entries and the default capability map.',
      inputSchema: {}
    },
    async () => jsonContent(listCapabilities(manager.listCatalog()))
  );
}
