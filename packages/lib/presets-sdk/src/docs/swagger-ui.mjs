import path from 'node:path';
import { createRequire } from 'node:module';
import express from 'express';
import { mountFavicon, FAVICON_HREF } from '@zeus/ui-kit';

const require = createRequire(import.meta.url);
const swaggerDistPath = path.dirname(require.resolve('swagger-ui-dist/swagger-ui.css'));

/**
 * Mount Swagger UI at GET {path} (default /docs).
 *
 * @param {import('express').Express} app
 * @param {{ path?: string, specUrl?: string, title?: string }} [options]
 */
export function mountSwaggerUi(app, { path: docsPath = '/docs', specUrl = '/spec/openapi.json', title = 'API' } = {}) {
  const assetPrefix = docsPath.endsWith('/') ? docsPath.slice(0, -1) : docsPath;

  mountFavicon(app);

  app.get(docsPath, (_req, res) => {
    const safeTitle = String(title).replace(/[<>&]/g, '');
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <link rel="icon" href="${FAVICON_HREF}" type="image/x-icon" sizes="any" />
  <link rel="stylesheet" href="${assetPrefix}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${assetPrefix}/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: ${JSON.stringify(specUrl)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  </script>
</body>
</html>`);
  });

  app.use(assetPrefix, express.static(swaggerDistPath, { index: false }));
}
