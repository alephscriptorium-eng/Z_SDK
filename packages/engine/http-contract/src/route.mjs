/**
 * RouteEntry manifest helpers — descriptive contract, routers stay in apps/libs.
 */

/**
 * @typedef {'GET'|'POST'|'PUT'|'DELETE'|'PATCH'} HttpMethod
 * @typedef {'plain'|'success-editor'|'success-sdk'|'raw-bridge'} EnvelopeKind
 * @typedef {'canonical'|'frozen'|'sdk-compat'|'deprecated'} RouteStatus
 *
 * @typedef {object} RouteEntry
 * @property {string} id — stable slug for contract-tests (e.g. 'aleph.view-links')
 * @property {HttpMethod} method
 * @property {string} path — Express path (may include :params)
 * @property {string} summary
 * @property {string[]} [tags]
 * @property {object} [request] — { params?, query?, body? } zod schemas
 * @property {Record<string, import('zod').ZodTypeAny>} responses — status key → schema
 * @property {EnvelopeKind} [envelope]
 * @property {string} [xMcpResource] — MCP URI or template for bridge routes
 * @property {boolean} [deprecated]
 * @property {RouteStatus} [xStatus]
 * @property {string} [xDegradedMode] — documents intentional degraded semantics
 */

/**
 * @param {string} appId
 * @param {RouteEntry[]} entries
 * @returns {RouteEntry[]}
 */
export function defineRoutes(appId, entries) {
  for (const entry of entries) {
    if (!entry.id) {
      throw new Error(`[${appId}] route missing id: ${entry.method} ${entry.path}`);
    }
    if (!entry.method || !entry.path || !entry.summary) {
      throw new Error(`[${appId}] route ${entry.id} missing method/path/summary`);
    }
    if (!entry.responses || Object.keys(entry.responses).length === 0) {
      throw new Error(`[${appId}] route ${entry.id} missing responses`);
    }
  }
  return entries;
}

/**
 * @param {RouteEntry[]} routes
 * @returns {Map<string, RouteEntry>}
 */
export function routesById(routes) {
  const map = new Map();
  for (const route of routes) {
    if (map.has(route.id)) {
      throw new Error(`duplicate route id: ${route.id}`);
    }
    map.set(route.id, route);
  }
  return map;
}

/**
 * Detect duplicate method+path collisions before OpenAPI build.
 * @param {RouteEntry[]} routes
 */
export function assertNoRouteCollisions(routes) {
  const seen = new Map();
  for (const route of routes) {
    const key = `${route.method.toUpperCase()} ${route.path}`;
    if (seen.has(key)) {
      throw new Error(
        `duplicate route ${key}: ids ${seen.get(key)} and ${route.id}`
      );
    }
    seen.set(key, route.id);
  }
}
