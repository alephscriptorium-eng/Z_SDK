import { parse as yamlParse } from 'yaml';

/**
 * Mount lazy-cached spec routes at GET /spec/:name.
 *
 * @param {import('express').Express} app
 * @param {{ specs: Record<string, () => string> }} options — builders return YAML strings
 */
export function mountSpecRoutes(app, { specs }) {
  const cache = new Map();

  app.get('/spec/:name', (req, res) => {
    const { name } = req.params;
    const build = specs[name];
    if (!build) {
      res.status(404).json({ error: 'Spec not found', name });
      return;
    }

    try {
      if (!cache.has(name)) {
        cache.set(name, yamlParse(build()));
      }
      let doc = cache.get(name);

      if (name.endsWith('.json') && doc?.openapi) {
        const originalServers = Array.isArray(doc.servers) ? doc.servers : [];
        doc = {
          ...doc,
          servers: [{ url: '/' }, ...originalServers]
        };
      }

      res.json(doc);
    } catch (err) {
      res.status(500).json({ error: 'Spec build failed', message: err.message });
    }
  });
}
