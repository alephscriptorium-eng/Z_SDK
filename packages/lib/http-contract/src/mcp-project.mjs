/**
 * RouteEntry → MCP resource / resource-template projection.
 * Source of truth is the route manifest (not OpenAPI YAML).
 */

import { expressPathToOpenApi } from './openapi.mjs';

/**
 * @typedef {object} ProjectedMcpResource
 * @property {string} name
 * @property {string} uri
 * @property {string} title
 * @property {string} description
 * @property {string} mimeType
 * @property {string} routeId
 * @property {string} method
 * @property {string} path
 * @property {string|null} xMcpResource
 *
 * @typedef {object} ProjectedMcpTemplate
 * @property {string} name
 * @property {string} uriTemplate
 * @property {string} title
 * @property {string} description
 * @property {string} mimeType
 * @property {string} routeId
 * @property {string} method
 * @property {string} path
 * @property {string|null} xMcpResource
 */

/**
 * Derive MCP URI when RouteEntry has no explicit xMcpResource.
 * Engine-neutral scheme: rest://{openapi-path-without-leading-slash}
 * @param {import('./route.mjs').RouteEntry} route
 * @param {string} [uriScheme='rest']
 */
export function deriveRouteMcpUri(route, uriScheme = 'rest') {
  const oaPath = expressPathToOpenApi(route.path).replace(/^\//, '');
  return `${uriScheme}://${oaPath}`;
}

/**
 * @param {import('./route.mjs').RouteEntry} route
 * @param {{ uriScheme?: string }} [options]
 */
export function resolveRouteMcpUri(route, options = {}) {
  if (route.xMcpResource) return route.xMcpResource;
  return deriveRouteMcpUri(route, options.uriScheme ?? 'rest');
}

/**
 * Project GET RouteEntry manifests to MCP resources and resource-templates.
 * Mutations are skipped (MCP tools are out of this projection).
 *
 * @param {import('./route.mjs').RouteEntry[]} routes
 * @param {{ uriScheme?: string }} [options]
 * @returns {{ resources: ProjectedMcpResource[], templates: ProjectedMcpTemplate[] }}
 */
export function projectRoutesToMcp(routes, options = {}) {
  const resources = [];
  const templates = [];

  for (const route of routes) {
    if (String(route.method).toUpperCase() !== 'GET') continue;

    const uri = resolveRouteMcpUri(route, options);
    const isTemplate = uri.includes('{');
    const base = {
      name: route.id,
      title: route.summary,
      description: route.summary,
      mimeType: 'application/json',
      routeId: route.id,
      method: route.method.toUpperCase(),
      path: route.path,
      xMcpResource: route.xMcpResource ?? null
    };

    if (isTemplate) {
      templates.push({ ...base, uriTemplate: uri });
    } else {
      resources.push({ ...base, uri });
    }
  }

  return { resources, templates };
}

/**
 * Substitute Express `:param` placeholders from MCP template variables.
 * @param {string} expressPath
 * @param {Record<string, string>} variables
 */
export function fillExpressPath(expressPath, variables = {}) {
  let filled = expressPath;
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(
      new RegExp(`:${key}\\b`, 'g'),
      encodeURIComponent(String(value))
    );
  }
  return filled;
}

/**
 * Bind projected descriptors to HTTP GET readers against a live base URL.
 * Consumers (mesh apps / e2e) register the result with MCP; engine stays fetch-only.
 *
 * @param {{ resources: ProjectedMcpResource[], templates: ProjectedMcpTemplate[] }} projected
 * @param {{ baseUrl: string, fetchImpl?: typeof fetch }} options
 */
export function bindProjectedHttpReaders(projected, options) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  async function readJson(url) {
    const res = await fetchImpl(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      return { error: data?.error || `HTTP ${res.status}`, status: res.status, data };
    }
    return data;
  }

  const registry = projected.resources.map((entry) => ({
    name: entry.name,
    uri: entry.uri,
    title: entry.title,
    mimeType: entry.mimeType,
    description: entry.description,
    read: () => readJson(`${baseUrl}${entry.path}`)
  }));

  const templateRegistry = projected.templates.map((entry) => ({
    name: entry.name,
    uriTemplate: entry.uriTemplate,
    title: entry.title,
    mimeType: entry.mimeType,
    description: entry.description,
    read: (variables) => {
      const path = fillExpressPath(entry.path, variables);
      return readJson(`${baseUrl}${path}`);
    }
  }));

  return { registry, templateRegistry };
}

/**
 * Markdown table of RouteEntry → MCP projections (for specs / docs).
 * @param {import('./route.mjs').RouteEntry[]} routes
 * @param {{ uriScheme?: string }} [options]
 */
export function renderRouteMcpCatalog(routes, options = {}) {
  const { resources, templates } = projectRoutesToMcp(routes, options);
  const lines = [
    '# RouteEntry → MCP projections',
    '',
    'Generated from GET `RouteEntry` manifests via `projectRoutesToMcp`.',
    '',
    '| Kind | Route id | HTTP | MCP URI / template |',
    '|------|----------|------|--------------------|'
  ];

  const rows = [
    ...resources.map((r) => ({
      kind: 'resource',
      id: r.routeId,
      http: `${r.method} ${r.path}`,
      mcp: r.uri
    })),
    ...templates.map((t) => ({
      kind: 'resource-template',
      id: t.routeId,
      http: `${t.method} ${t.path}`,
      mcp: t.uriTemplate
    }))
  ].sort((a, b) => a.id.localeCompare(b.id));

  for (const row of rows) {
    lines.push(`| ${row.kind} | \`${row.id}\` | \`${row.http}\` | \`${row.mcp}\` |`);
  }

  lines.push('');
  return lines.join('\n');
}
