import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { stringify as yamlStringify } from 'yaml';
import { mountSpecRoutes, mountSwaggerUi } from '../src/docs/index.mjs';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('mountSpecRoutes prepends relative server url for OpenAPI', async (t) => {
  const app = express();
  mountSpecRoutes(app, {
    specs: {
      'openapi.json': () => yamlStringify({
        openapi: '3.1.0',
        info: { title: 'Test', version: '1.0.0' },
        servers: [{ url: 'http://localhost:3012', description: 'default' }],
        paths: {}
      })
    }
  });

  const server = await listen(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/spec/openapi.json`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.servers[0].url, '/');
  assert.equal(body.servers[1].url, 'http://localhost:3012');
});

test('mountSwaggerUi serves /docs', async (t) => {
  const app = express();
  mountSwaggerUi(app, { title: 'Test API' });

  const server = await listen(app);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const port = server.address().port;
  const res = await fetch(`http://127.0.0.1:${port}/docs`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /swagger-ui/i);
  assert.match(html, /Test API/);
});
