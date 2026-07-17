import { z } from 'zod';
import { defineRoutes } from '@zeus/http-contract';

const McpHealth = z.object({
  status: z.string(),
  mode: z.string().optional(),
  ready: z.boolean().optional()
});

const MethodNotAllowed = z.object({
  error: z.string()
});

const JsonRpcOpaque = z.looseObject({}).describe('JSON-RPC 2.0 MCP request/response');

/**
 * Streamable HTTP MCP transport routes (shared by MCP server packages).
 */
export const MCP_HTTP_ROUTES = defineRoutes('presets-sdk-mcp', [
  {
    id: 'mcp.post',
    method: 'POST',
    path: '/mcp',
    summary: 'MCP JSON-RPC over Streamable HTTP',
    tags: ['mcp'],
    request: { body: JsonRpcOpaque },
    responses: { 200: JsonRpcOpaque },
    envelope: 'raw-bridge'
  },
  {
    id: 'mcp.get',
    method: 'GET',
    path: '/mcp',
    summary: 'Method not allowed — use POST',
    tags: ['mcp'],
    responses: { 405: MethodNotAllowed },
    envelope: 'plain'
  },
  {
    id: 'mcp.delete',
    method: 'DELETE',
    path: '/mcp',
    summary: 'Method not allowed — use POST',
    tags: ['mcp'],
    responses: { 405: MethodNotAllowed },
    envelope: 'plain'
  },
  {
    id: 'mcp.health',
    method: 'GET',
    path: '/mcp/health',
    summary: 'MCP server health for discovery',
    tags: ['mcp'],
    responses: { 200: McpHealth },
    envelope: 'plain'
  }
]);

export const McpHttpSchemas = { McpHealth, MethodNotAllowed, JsonRpcOpaque };
