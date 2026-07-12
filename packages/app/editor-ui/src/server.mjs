#!/usr/bin/env node

/**
 * @zeus/editor-ui server.
 * Ported from zeus/server/ZeusServer.js (CJS -> ESM). Differences from the
 * original:
 *   - No AI/stats pages, no WebSocket handler.
 *   - mcpHandler/presetHandler replaced by in-process @zeus/presets-sdk
 *     (PresetStore + ServerRegistry + discoverServers).
 *   - The SDK HTTP routes (createPresetRoutes) are mounted as well, so
 *     external clients get the /api/mcp/list|set|presets contract.
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
import { createApiRoutes, enrichPreset, CATEGORIES } from './api-routes.mjs';
import { buildEditorSpec } from '../spec/build.mjs';
import { homeView } from './views/home_view.mjs';
import { presetView } from './views/preset_view.mjs';
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
      const htmlResponse = homeView();
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse.outerHTML);
    } catch (error) {
      console.error('Error rendering home page:', error);
      res.status(500).send(errorPage('Home', error));
    }
  });

  app.get('/presets', async (req, res) => {
    try {
      const servers = await catalog.getAllServers();
      const enrichedPresets = store.getAll().map(preset => enrichPreset(preset, servers));

      const viewData = {
        presets: enrichedPresets,
        categories: CATEGORIES,
        pagination: {
          total: enrichedPresets.length,
          page: 1,
          limit: 20,
          totalPages: 1
        },
        filters: {},
        selectedPreset: null,
        isLoading: false,
        error: null,
        mcpServers: servers
      };

      const htmlResponse = presetView(viewData);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlResponse.outerHTML);
    } catch (error) {
      console.error('Error rendering presets page:', error);
      res.status(500).send(errorPage('Presets', error));
    }
  });

  app.get('/editor', async (req, res) => {
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
      console.error('Error rendering editor page:', error);
      res.status(500).send(errorPage('MCP Editor', error));
    }
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

  return {
    app,
    httpServer,
    registry,
    catalog,
    store,
    config,
    port,
    host,
    url: `http://${host}:${port}`,
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
  console.log(`Preset store: ${resolveDataDir()} (${handle.store.count()} preset(s) loaded)`);
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
