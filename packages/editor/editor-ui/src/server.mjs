#!/usr/bin/env node

/**
 * @zeus/editor-ui server — mundo A: gamemap / release (WP-U70).
 * Cloaks = presets MCP (API conservada; vista CRUD /presets demolida).
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import {
  createPresetRuntime,
  resolveDiscoverySources,
  createPresetRoutes,
} from '@zeus/presets-sdk';
import { mountSpecRoutes, mountSwaggerUi } from '@zeus/presets-sdk/docs';
import { assetsDir as uiKitAssetsDir, createThemeRoutes } from '@zeus/ui-kit';

import { getConfig, resolveDataDir, getSectionDefaults, packageDir } from './config.mjs';
import { ThemeHandler } from './theme-handler.mjs';
import { createApiRoutes } from './api-routes.mjs';
import { createDraftStore } from './world/draft-store.mjs';
import { createWorldRoutes } from './world/routes.mjs';
import { listMaterials } from './world/materials.mjs';
import { buildEditorSpec } from '../spec/build.mjs';
import { worldView } from './views/world_view.mjs';
import { editorView } from './views/editor_view.mjs';
import { settingsView } from './views/settings_view.mjs';

function errorPage(pageName, error) {
  return `
    <html>
      <head>
        <title>${pageName} - Error</title>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
      </head>
      <body>
        <h1>Error Loading ${pageName}</h1>
        <p>Unable to load ${pageName.toLowerCase()} page: ${error.message}</p>
        <a href="/">Return to Home</a>
      </body>
    </html>
  `;
}

/**
 * Programmatic bootstrap for tests and CLI.
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {string} [options.dataDir]
 */
export async function createEditorServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3012;
  const host = options.host ?? config.server?.host ?? 'localhost';
  const dataDir = options.dataDir ?? resolveDataDir(config);
  const themeHandler = new ThemeHandler();
  const draftStore = createDraftStore(dataDir);

  const runtime = createPresetRuntime({
    dataDir,
    registerMode: 'strict',
    sources: () => {
      const cfg = getConfig();
      return resolveDiscoverySources({
        dataDir,
        localDiscovery: cfg.discovery
      });
    }
  });
  const { registry, store, catalog, refreshDiscovery } = runtime;

  await refreshDiscovery().catch((error) => {
    console.error('Discovery failed:', error.message);
  });

  const app = express();

  app.use(cors({
    origin: true,
    credentials: true
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'editor-ui',
      timestamp: new Date().toISOString()
    });
  });

  mountSpecRoutes(app, { specs: { 'openapi.json': buildEditorSpec } });
  mountSwaggerUi(app, { title: 'Editor UI API' });

  app.get('/', async (req, res) => {
    try {
      const draft = draftStore.read();
      const materials = listMaterials();
      const cloaks = store.getAll().map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description
      }));
      const htmlResponse = worldView({ draft, materials, cloaks });
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse.outerHTML);
    } catch (error) {
      console.error('Error rendering world editor:', error);
      res.status(500).send(errorPage('World', error));
    }
  });

  // Demolished preset library view → world editor
  app.get('/presets', (_req, res) => {
    res.redirect(301, '/');
  });

  app.get('/cloaks', async (req, res) => {
    try {
      const requestedServerId = req.query.server;

      const servers = await catalog.getAllServers();
      const selectedServer =
        (requestedServerId && servers.find(server => server.id === requestedServerId)) ||
        servers.find(server => server.status === 'connected') ||
        servers[0] || null;
      let serverContent = {};

      if (selectedServer) {
        const [tools, resources, prompts] = await Promise.all([
          catalog.getServerTools(selectedServer.id),
          catalog.getServerResources(selectedServer.id),
          catalog.getServerPrompts(selectedServer.id)
        ]);

        serverContent = {
          tools: tools || [],
          resources: resources || [],
          prompts: prompts || []
        };
      }

      const editorData = {
        servers,
        selectedServer,
        serverContent,
        selectedItems: [],
        isLoading: false,
        error: null
      };

      const htmlResponse = editorView(editorData);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse.outerHTML);
    } catch (error) {
      console.error('Error rendering cloaks page:', error);
      res.status(500).send(errorPage('Cloaks', error));
    }
  });

  // Alias histórico del explorador MCP
  app.get('/editor', (req, res) => {
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, `/cloaks${q}`);
  });

  app.get('/settings', async (req, res) => {
    try {
      const cfg = getConfig();

      const settings = {
        theme: cfg.theme || getSectionDefaults('theme'),
        ui: cfg.ui || getSectionDefaults('ui'),
        features: cfg.features || getSectionDefaults('features'),
        discovery: cfg.discovery || getSectionDefaults('discovery'),
        presets: cfg.presets || getSectionDefaults('presets')
      };

      const htmlResponse = settingsView(settings);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse.outerHTML);
    } catch (error) {
      console.error('Error rendering settings page:', error);
      res.status(500).send(errorPage('Settings', error));
    }
  });

  app.use(createPresetRoutes({ registry, store }));
  app.use('/api', createThemeRoutes(themeHandler, getConfig));
  app.use('/api', createWorldRoutes({ draftStore, store }));
  app.use('/api', createApiRoutes({ store, catalog, themeHandler, refreshDiscovery }));

  app.use((err, req, res, _next) => {
    console.error('Editor UI Server Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: config.debug ? err.message : 'Something went wrong'
    });
  });

  const httpServer = await new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve(server));
    server.on('error', reject);
  });

  const bound = httpServer.address();
  const listenPort = typeof bound === 'object' && bound ? bound.port : port;

  return {
    app,
    httpServer,
    registry,
    catalog,
    store,
    draftStore,
    config,
    port: listenPort,
    host,
    url: `http://${host}:${listenPort}`,
    refreshDiscovery,
    close: async () => {
      await registry.close();
      await new Promise((resolve) => {
        if (!httpServer.listening) {
          resolve();
          return;
        }
        httpServer.close((err) => {
          if (err?.code === 'ERR_SERVER_NOT_RUNNING') {
            resolve();
            return;
          }
          resolve();
        });
      });
    }
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const handle = await createEditorServer();
  console.log(`Editor UI running on ${handle.url}`);
  console.log(`World draft: ${resolveDataDir()} · cloaks(presets)=${handle.store.count()}`);
  console.log(`Environment: ${handle.config.debug ? 'development' : 'production'}`);

  if (handle.config.debug) {
    console.log('Configuration:', JSON.stringify(handle.config, null, 2));
  }

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
