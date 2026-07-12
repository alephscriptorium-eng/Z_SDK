import { buildOpenApiDoc } from '@zeus/http-contract';
import { MCP_HTTP_ROUTES } from '../src/mcp/http-contract.mjs';

/**
 * @returns {string} OpenAPI YAML for MCP HTTP transport
 */
export function buildMcpHttpSpec() {
  return buildOpenApiDoc(MCP_HTTP_ROUTES, {
    title: 'Zeus MCP HTTP Transport',
    version: '0.1.0',
    description: 'Streamable HTTP MCP endpoints shared by @zeus MCP server packages.'
  });
}
