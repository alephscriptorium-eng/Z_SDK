#!/usr/bin/env node

/**
 * @zeus/cache-browser server.
 * Express + browse API + double-viewer cache explorer.
 */

import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { assetsDir as uiKitAssetsDir, createThemeRoutes } from '@zeus/ui-kit';
import { mountSpecRoutes, mountSwaggerUi } from '@zeus/presets-sdk/docs';

import {
  getConfig,
  resolveBasePath,
  resolveDataDir,
  getViewersConfig,
  packageDir
} from './config.mjs';
import { ThemeHandler } from './theme-handler.mjs';
import { createMcpBridge } from './mcp-bridge.mjs';
import {
  listLineas,
  browseDirectory,
  readLineFile,
  getCacheStats,
  buildAnchorsGrid,
  resolveWikitextPath
} from './browse-bridge.mjs';
import { cacheView } from './views/cache_view.mjs';
import { settingsView } from './views/settings_view.mjs';
import { createBrowseRoutes } from './browse-routes.mjs';
import { buildViewSpec } from '../spec/build.mjs';
import { createArgTrackSubscriber, mountTrackFocusRoute } from './arg-track-subscriber.mjs';
import { DEFAULT_ARG_ROOM } from '@zeus/arg-domain';

/** @type {{ linea: string|null, path: string|null, viewer: string|null, name: string|null, summary: string|null }} */
let currentFocus = {
  linea: null,
  path: null,
  viewer: null,
  name: null,
  summary: null
};

function setFocus(payload) {
  currentFocus = { ...currentFocus, ...payload };
}

function buildFocusSnapshot() {
  return {
    schemaVersion: 1,
    at: new Date().toISOString(),
    focus: { ...currentFocus }
  };
}

/**
 * @param {object} [options]
 */
export async function createViewServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3015;
  const host = options.host ?? config.server?.host ?? 'localhost';
  const basePath = options.basePath ?? resolveBasePath(config);
  const dataDir = options.dataDir ?? resolveDataDir(config);
  const themeHandler = new ThemeHandler();
  const mcp = createMcpBridge({
    dataDir,
    discovery: options.discoveryUrls
      ? { ...config.discovery, urls: options.discoveryUrls }
      : config.discovery
  });

  mcp.refresh().catch(() => {});

  const trackActor = options.trackActor ?? process.env.ZEUS_ARG_TRACK_ACTOR ?? null;
  const trackRoom = options.trackRoom ?? process.env.ZEUS_ARG_ROOM ?? DEFAULT_ARG_ROOM;

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));
  const themeApi = createThemeRoutes(themeHandler, getConfig, {
    extendConfig: (cfg) => ({
      discovery: cfg.discovery,
      defaultLinea: cfg.defaultLinea,
      viewers: getViewersConfig(cfg),
      branding: cfg.branding,
      player: cfg.player,
      editor: cfg.editor,
      track: trackActor
        ? { enabled: true, actor: trackActor, room: trackRoom, focusUrl: '/api/track/focus' }
        : { enabled: false }
    })
  });
  app.use('/api', themeApi);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cache-browser', timestamp: new Date().toISOString() });
  });

  mountSpecRoutes(app, { specs: { 'openapi.json': buildViewSpec } });
  mountSwaggerUi(app, { title: 'View UI API' });

  let trackSubscriber = null;
  if (trackActor) {
    trackSubscriber = createArgTrackSubscriber({
      actor: trackActor,
      browserHint: 'cache-browser',
      room: trackRoom
    });
    await trackSubscriber.start().catch((err) => {
      console.warn('[cache-browser] arg:track subscriber no arrancó:', err.message);
    });
  }
  mountTrackFocusRoute(app, trackSubscriber);

  app.use(
    '/api',
    createBrowseRoutes({
      basePath,
      port,
      getConfig,
      getViewersConfig,
      mcp,
      setFocus,
      buildFocusSnapshot,
      listLineas,
      browseDirectory,
      readLineFile,
      getCacheStats,
      buildAnchorsGrid,
      resolveWikitextPath
    })
  );

  app.get('/settings', async (_req, res) => {
    try {
      const html = settingsView();
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error('Error rendering settings:', err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.get('/', async (req, res) => {
    try {
      const cfg = getConfig();
      const themes = themeHandler.getAvailableThemes();
      const defaultLinea = req.query.linea || cfg.defaultLinea || 'espana';
      const html = cacheView({
        defaultLinea: String(defaultLinea),
        themes,
        currentTheme: cfg.theme?.current
      });
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error('Error rendering cache view:', err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('View UI error:', err);
    res.status(500).json({ error: err.message });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(port, host, () => resolve(s));
  });

  async function close() {
    trackSubscriber?.stop();
    await mcp.close();
    await new Promise((resolve) => server.close(resolve));
  }

  return { app, server, close, port, host, basePath, mcp, setFocus, getFocus: buildFocusSnapshot, trackSubscriber };
}

import { pathToFileURL } from 'node:url';
import { openBrowser } from '@zeus/presets-sdk/env';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const handle = await createViewServer();
  const url = `http://${handle.host}:${handle.port}`;
  console.log(`Cache browser running on ${url}`);
  console.log(`Lineas base: ${handle.basePath}`);
  openBrowser(url);

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
