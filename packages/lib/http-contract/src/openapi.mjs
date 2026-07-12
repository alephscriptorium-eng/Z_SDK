import { stringify as yamlStringify } from 'yaml';
import { z } from 'zod';
import { assertNoRouteCollisions } from './route.mjs';
import { errorSchemaForEnvelope } from './envelope.mjs';

const COMPONENT_PREFIX = '#/components/schemas/';

/**
 * Rewrite zod #/$defs/ refs to OpenAPI component refs in-place.
 * @param {unknown} node
 */
function rewriteDefRefs(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) rewriteDefRefs(item);
    return;
  }
  if (typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/')) {
    node.$ref = `${COMPONENT_PREFIX}${node.$ref.slice('#/$defs/'.length)}`;
  }
  for (const value of Object.values(node)) {
    rewriteDefRefs(value);
  }
}

/**
 * Express `:param` → OpenAPI `{param}`.
 * @param {string} path
 */
export function expressPathToOpenApi(path) {
  return path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, '{$1}');
}

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {Map<import('zod').ZodTypeAny, string>} registry
 */
function zodToRef(schema, registry) {
  if (!schema) return { type: 'object' };
  if (registry.has(schema)) {
    return { $ref: `${COMPONENT_PREFIX}${registry.get(schema)}` };
  }
  const json = z.toJSONSchema(schema, { reused: 'ref' });
  if (json.$defs) {
    for (const [name] of Object.entries(json.$defs)) {
      if (!registry.has(schema)) {
        registry.set(schema, name);
      }
    }
    delete json.$defs;
  }
  if (json.$ref && json.$ref.startsWith('#/$defs/')) {
    const name = json.$ref.replace('#/$defs/', '');
    return { $ref: `${COMPONENT_PREFIX}${name}` };
  }
  return json;
}

/**
 * Collect zod schemas into OpenAPI components.
 * @param {import('./route.mjs').RouteEntry[]} routes
 */
function collectComponents(routes) {
  const components = {};
  const registry = new Map();
  let counter = 0;

  function register(schema, hint) {
    if (!schema || registry.has(schema)) return registry.get(schema);
    const name = hint || `Schema${++counter}`;
    registry.set(schema, name);
    const json = z.toJSONSchema(schema, { reused: 'ref' });
    if (json.$defs) {
      for (const [defName, def] of Object.entries(json.$defs)) {
        components[defName] = def;
      }
      delete json.$defs;
      rewriteDefRefs(json);
    }
    components[name] = json;
    return name;
  }

  for (const route of routes) {
    const req = route.request || {};
    if (req.params) register(req.params, `${route.id}_params`);
    if (req.query) register(req.query, `${route.id}_query`);
    if (req.body) register(req.body, `${route.id}_body`);
    for (const [status, schema] of Object.entries(route.responses || {})) {
      register(schema, `${route.id}_${status}`);
    }
    const errSchema = errorSchemaForEnvelope(route.envelope);
    register(errSchema, `${route.id}_error`);
  }

  return { components, registry };
}

/**
 * @param {import('./route.mjs').RouteEntry[]} routes
 * @param {object} meta — { title, version, description, servers? }
 * @returns {string} YAML
 */
export function buildOpenApiDoc(routes, meta) {
  assertNoRouteCollisions(routes);
  const { components, registry } = collectComponents(routes);

  const paths = {};
  for (const route of routes) {
    const oaPath = expressPathToOpenApi(route.path);
    if (!paths[oaPath]) paths[oaPath] = {};
    const method = route.method.toLowerCase();
    const operation = {
      operationId: route.id,
      summary: route.summary,
      ...(route.tags?.length ? { tags: route.tags } : {}),
      ...(route.deprecated ? { deprecated: true } : {}),
      responses: {}
    };

    if (route.xMcpResource) {
      operation['x-mcp-resource'] = route.xMcpResource;
    }
    if (route.xStatus) {
      operation['x-status'] = route.xStatus;
    }
    if (route.xDegradedMode) {
      operation['x-degraded-mode'] = route.xDegradedMode;
    }

    const req = route.request || {};
    if (req.params || req.query || req.body) {
      operation.parameters = [];
      if (req.params) {
        const json = z.toJSONSchema(req.params);
        if (json.properties) {
          for (const [name, prop] of Object.entries(json.properties)) {
            operation.parameters.push({
              name,
              in: 'path',
              required: json.required?.includes(name) ?? true,
              schema: prop
            });
          }
        }
      }
      if (req.query) {
        const json = z.toJSONSchema(req.query);
        if (json.properties) {
          for (const [name, prop] of Object.entries(json.properties)) {
            operation.parameters.push({
              name,
              in: 'query',
              required: json.required?.includes(name) ?? false,
              schema: prop
            });
          }
        }
      }
      if (req.body) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: zodToRef(req.body, registry)
            }
          }
        };
      }
    }

    for (const [status, schema] of Object.entries(route.responses)) {
      operation.responses[status] = {
        description: route.summary,
        content: {
          'application/json': {
            schema: zodToRef(schema, registry)
          }
        }
      };
    }

    const errSchema = errorSchemaForEnvelope(route.envelope);
    if (!operation.responses['400']) {
      operation.responses['400'] = {
        description: 'Client error',
        content: { 'application/json': { schema: zodToRef(errSchema, registry) } }
      };
    }
    if (!operation.responses['500']) {
      operation.responses['500'] = {
        description: 'Server error',
        content: { 'application/json': { schema: zodToRef(errSchema, registry) } }
      };
    }

    paths[oaPath][method] = operation;
  }

  const doc = {
    openapi: '3.1.0',
    info: {
      title: meta.title,
      version: meta.version || '0.1.0',
      description: meta.description || ''
    },
    ...(meta.servers ? { servers: meta.servers } : {}),
    paths,
    ...(Object.keys(components).length
      ? { components: { schemas: components } }
      : {})
  };

  return yamlStringify(doc, { lineWidth: 0 });
}

/**
 * Markdown index table — method | path | summary only.
 * @param {import('./route.mjs').RouteEntry[]} routes
 */
export function renderRouteIndex(routes) {
  const lines = [
    '| Method | Path | Summary |',
    '|--------|------|---------|'
  ];
  const sorted = [...routes].sort((a, b) => {
    const pc = a.path.localeCompare(b.path);
    return pc !== 0 ? pc : a.method.localeCompare(b.method);
  });
  for (const route of sorted) {
    lines.push(`| ${route.method} | \`${route.path}\` | ${route.summary} |`);
  }
  return lines.join('\n');
}

/**
 * MCP resource catalog markdown from RESOURCE_PAYLOADS map.
 * @param {Map<string, import('zod').ZodTypeAny>} payloads
 */
export function renderMcpResourceCatalog(payloads) {
  const lines = [
    '# MCP Resource Payload Schemas',
    '',
    'Generated from `RESOURCE_PAYLOADS` in `@zeus/http-contract/mcp-resources`.',
    '',
    '| URI / Template | Schema |',
    '|----------------|--------|'
  ];
  const keys = [...payloads.keys()].sort();
  for (const key of keys) {
    const schema = payloads.get(key);
    const name = schema?.description || schema?._def?.typeName || 'ZodSchema';
    lines.push(`| \`${key}\` | ${name} |`);
  }
  lines.push('');
  lines.push('> Full JSON Schemas: run `npm run spec:generate -w @zeus/http-contract`.');
  return lines.join('\n');
}
