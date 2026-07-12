import { routesById } from '@zeus/http-contract';

/**
 * Fetch a route and validate the JSON body against its contract schema.
 * @param {string} base — e.g. http://localhost:3013
 * @param {import('@zeus/http-contract').RouteEntry[]} routes
 * @param {string} routeId
 * @param {{ method?: string, path?: string, body?: unknown, strict?: boolean }} [opts]
 */
export async function fetchAndValidate(base, routes, routeId, opts = {}) {
  const map = routesById(routes);
  const route = map.get(routeId);
  if (!route) {
    throw new Error(`unknown route id: ${routeId}`);
  }

  const method = opts.method || route.method;
  let urlPath = opts.path || route.path;

  if (route.request?.params && !opts.path) {
    const params = route.request.params.safeParse({});
    if (params.success) {
      for (const [key, val] of Object.entries(params.data)) {
        urlPath = urlPath.replace(`:${key}`, encodeURIComponent(String(val)));
      }
    }
  }

  const url = `${base.replace(/\/$/, '')}${urlPath}`;
  const init = { method };
  if (opts.body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);
  const statusKey = String(res.status);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  const schema =
    route.responses[statusKey] ||
    route.responses['200'] ||
    route.responses[200];

  if (!schema) {
    return { res, body, validated: false, reason: 'no schema for status' };
  }

  if (typeof body === 'string' && schema.description === 'application/zip') {
    return { res, body, validated: true };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success && (opts.strict || process.env.ZEUS_HTTP_VALIDATE === 'enforce')) {
    const flat = JSON.stringify(parsed.error.flatten());
    throw new Error(
      `contract validation failed for ${routeId} (${res.status}): ${flat}\nbody: ${text.slice(0, 500)}`
    );
  }

  return {
    res,
    body,
    validated: parsed.success,
    ...(parsed.success ? {} : { validationError: parsed.error.flatten() })
  };
}
