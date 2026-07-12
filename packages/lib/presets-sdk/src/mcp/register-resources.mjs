/**
 * Register native MCP resources with optional payload schema validation.
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validateResourcePayload } from '@zeus/http-contract/mcp-resources';

function resourceContents(uri, mimeType, payload) {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType,
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}

function maybeValidate(entry, payload) {
  if (process.env.ZEUS_VALIDATE_RESOURCES !== '1') return payload;
  const schema = entry.payloadSchema;
  if (!schema) return payload;
  const uriKey = entry.uri || entry.uriTemplate;
  const result = validateResourcePayload(uriKey, payload);
  if (result.ok === false && !result.skipped) {
    throw new Error(`Resource payload validation failed for ${uriKey}: ${JSON.stringify(result.error?.flatten?.() || result)}`);
  }
  return payload;
}

/**
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {{
 *   registry: Array<{ name: string, uri: string, title: string, mimeType: string, description: string, read: () => unknown, payloadSchema?: import('zod').ZodTypeAny }>,
 *   templateRegistry: Array<{ name: string, uriTemplate: string, title: string, mimeType: string, description: string, read: (variables: Record<string, string>) => unknown | Promise<unknown>, payloadSchema?: import('zod').ZodTypeAny }>
 * }} options
 */
export function registerNativeResources(server, { registry, templateRegistry }) {
  for (const entry of registry) {
    server.registerResource(
      entry.name,
      entry.uri,
      { title: entry.title, description: entry.description, mimeType: entry.mimeType },
      async (uri) => {
        const payload = maybeValidate(entry, entry.read());
        return resourceContents(uri, entry.mimeType, payload);
      }
    );
  }

  for (const entry of templateRegistry) {
    server.registerResource(
      entry.name,
      new ResourceTemplate(entry.uriTemplate, { list: undefined }),
      { title: entry.title, description: entry.description, mimeType: entry.mimeType },
      async (uri, variables) => {
        const raw = await entry.read(variables);
        if (raw?.error) {
          throw new Error(JSON.stringify(raw));
        }
        const payload = maybeValidate(entry, raw);
        return resourceContents(uri, entry.mimeType, payload);
      }
    );
  }
}
