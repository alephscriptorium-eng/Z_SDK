/**
 * E8 — OpenAPI → MCP projector (SR-A: GET → resource-template).
 */

import fs from 'node:fs';
import yaml from 'yaml';

/**
 * @param {string|object} spec — OpenAPI YAML string or parsed object
 * @param {{ baseUrl?: string }} [options]
 */
export function projectOpenApi(spec, options = {}) {
  const doc = typeof spec === 'string' ? yaml.parse(spec) : spec;
  const baseUrl = options.baseUrl ?? '';
  const tools = [];
  const resources = [];
  const templates = [];

  for (const [path, methods] of Object.entries(doc.paths ?? {})) {
    for (const [verb, op] of Object.entries(methods)) {
      if (!op || typeof op !== 'object') continue;
      const operationId = op.operationId ?? `${verb}_${path.replace(/[{}/]/g, '_')}`;
      const hasPathParams = path.includes('{');

      if (verb === 'get' && !hasPathParams && !Object.keys(op.parameters ?? {}).length) {
        resources.push({
          uri: `openapi://${operationId}`,
          name: operationId,
          description: op.summary ?? op.description ?? '',
          mimeType: 'application/json'
        });
      } else if (verb === 'get') {
        templates.push({
          uriTemplate: `openapi://${path}`,
          name: operationId,
          description: op.summary ?? op.description ?? ''
        });
      } else if (['post', 'put', 'patch', 'delete'].includes(verb)) {
        tools.push({
          name: operationId,
          description: op.summary ?? op.description ?? `${verb.toUpperCase()} ${path}`,
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'object' },
              query: { type: 'object' },
              body: { type: 'object' }
            }
          },
          _meta: { method: verb.toUpperCase(), path, baseUrl }
        });
      }
    }
  }

  return { tools, resources, prompts: [], templates };
}

/**
 * Build horse.offer() payload from OpenAPI.
 * @param {string|object} spec
 * @param {object} [options]
 */
export function openapi(spec, options) {
  return projectOpenApi(spec, options);
}

/**
 * Dispatch a projected tool call to HTTP.
 * @param {object} tool — from projectOpenApi.tools
 * @param {object} args
 */
export async function dispatchToolCall(tool, args = {}) {
  const { method, path, baseUrl } = tool._meta ?? {};
  let url = `${baseUrl}${path}`;
  for (const [k, v] of Object.entries(args.path ?? {})) {
    url = url.replace(`{${k}}`, encodeURIComponent(String(v)));
  }
  const qs = new URLSearchParams(args.query ?? {}).toString();
  if (qs) url += `?${qs}`;

  const init = { method: method ?? 'POST', headers: { Accept: 'application/json' } };
  if (args.body && method !== 'GET') {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(args.body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
}

/**
 * @param {string} filePath
 */
export function projectOpenApiFile(filePath, options) {
  return projectOpenApi(fs.readFileSync(filePath, 'utf8'), options);
}
