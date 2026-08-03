#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { buildPackageCatalog } from './catalog.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(packageDir, 'public');
const packagesRoot = path.resolve(packageDir, '../..');

export async function createPackageMapServer(options = {}) {
  const port = options.port ?? Number(process.env.ZEUS_PORT_PACKAGE_MAP || 3021);
  const host = options.host ?? process.env.ZEUS_HOST ?? 'localhost';
  const app = express();
  const catalog = await buildPackageCatalog(packagesRoot);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'package-map',
      packages: catalog.packages.length,
      waves: catalog.waves.length
    });
  });
  app.get('/catalog.json', (_req, res) => res.json(catalog));
  app.get('/api/catalog', (_req, res) => res.json(catalog));
  app.use(express.static(publicDir));

  const httpServer = await new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    server.on('error', reject);
  });

  const address = httpServer.address();
  const listenPort = typeof address === 'object' && address ? address.port : port;
  return { app, httpServer, catalog, host, port: listenPort };
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  createPackageMapServer()
    .then(({ host, port }) => {
      console.log(`Package map listening on http://${host}:${port}`);
    })
    .catch((error) => {
      console.error('Package map failed to start:', error);
      process.exitCode = 1;
    });
}