/**
 * Assert Express app mounts every route from a RouteEntry manifest.
 * Walks app.router.stack (Express 5 / router package).
 */

/**
 * Normalize Express layer path for comparison.
 * @param {string} mountPath
 * @param {string} routePath
 */
function fullPath(mountPath, routePath) {
  const base = mountPath === '/' ? '' : mountPath.replace(/\/$/, '');
  const sub = routePath === '/' ? '' : routePath;
  const joined = `${base}${sub}` || '/';
  return joined.replace(/\/+/g, '/');
}

/**
 * Infer mount prefix from a router Layer (path not stored until match in router pkg).
 * @param {object} layer
 */
function layerMountPrefix(layer) {
  const matcher = layer.matchers?.[0];
  if (!matcher || !layer.handle?.stack) return '';

  for (const probe of ['/api/__probe__', '/api', '/']) {
    const match = matcher(probe);
    if (match?.path) {
      return match.path.replace(/\/$/, '') || match.path;
    }
  }
  return '';
}

/**
 * Collect { method, path } from Express router stack.
 * @param {import('express').Application} app
 * @returns {Set<string>}
 */
export function collectMountedRoutes(app) {
  const found = new Set();

  function walk(stack, prefix = '') {
    if (!stack) return;
    for (const layer of stack) {
      if (layer.route) {
        const routePath = fullPath(prefix, layer.route.path);
        for (const method of Object.keys(layer.route.methods)) {
          if (layer.route.methods[method]) {
            found.add(`${method.toUpperCase()} ${routePath}`);
          }
        }
      } else if (layer.handle?.stack) {
        const mount = layerMountPrefix(layer);
        const childPrefix = mount ? fullPath(prefix, mount) : prefix;
        walk(layer.handle.stack, childPrefix);
      }
    }
  }

  walk(app.router?.stack || app._router?.stack);
  return found;
}

/**
 * @param {import('express').Application} app
 * @param {import('./route.mjs').RouteEntry[]} routes
 * @param {{ ignore?: string[] }} [opts] — route ids to skip (HTML pages, etc.)
 */
export function assertRoutesMounted(app, routes, opts = {}) {
  const ignore = new Set(opts.ignore || []);
  const mounted = collectMountedRoutes(app);
  const missing = [];

  for (const route of routes) {
    if (ignore.has(route.id)) continue;
    const key = `${route.method.toUpperCase()} ${route.path}`;
    if (!mounted.has(key)) {
      missing.push(key);
    }
  }

  if (missing.length) {
    const sample = [...mounted].sort().slice(0, 30).join('\n  ');
    throw new Error(
      `routes not mounted:\n  ${missing.join('\n  ')}\n\nmounted sample:\n  ${sample}`
    );
  }
}
