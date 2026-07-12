#!/usr/bin/env node

/**
 * @zeus/player-3d-ui server.
 *
 * Express, server-rendered, no bundler. Serves:
 *   /assets            → ui-kit shell assets + own assets/
 *   /vendor/three      → node_modules/three (build/ + examples/jsm as three/addons/)
 *   /vendor/socket.io  → socket.io-client browser ESM dist
 *   /kit               → @zeus/ui-3d-kit browser-safe src/ (raw)
 *   /models            → @zeus/ui-3d-kit assets/models (GLBs)
 *   /health            → { status: ok }
 *   /                  → 3D viewer shell (import map + canvas + injected config)
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import { assetsDir as uiKitAssetsDir, createThemeRoutes } from '@zeus/ui-kit';
import { browserAssetsDir as roomClientAssetsDir } from '@zeus/room-client-browser';
import { createThemeHandler } from '@zeus/app-shell/create-theme-handler';
import { srcDir, modelsDir, getThreeDir } from '@zeus/ui-3d-kit/node';
import { srcDir as gameEngineSrcDir } from '@zeus/game-engine/node';
import { srcDir as sessionProtocolSrcDir } from '@zeus/session-protocol';

import {
  getConfig,
  packageDir,
  getAppConfig,
  setTheme,
  getDefaultTheme
} from './config.mjs';
import { resolveViewerConfig } from './viewer-config.mjs';
import { viewerView } from './views/main_views.mjs';

const require = createRequire(import.meta.url);

/** Resolve socket.io-client browser ESM dist dir. */
function socketIoDistDir() {
  return path.dirname(require.resolve('socket.io-client/package.json')) + path.sep + 'dist';
}

/**
 * Resolve the three.js package root to serve statically (build/ + examples/jsm).
 * The kit's getThreeDir() now derives the root from the resolved `three` main
 * entry (three@0.170 hides ./package.json from its exports), so no local
 * fallback is needed — it either returns a validated dir or throws, and the
 * caller's try/catch disables /vendor/three when three is missing.
 */
function resolveThreeStaticDir() {
  return getThreeDir();
}

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 */
export async function createPlayer3dServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3018;
  const host = options.host ?? config.server?.host ?? 'localhost';

  const ThemeHandler = createThemeHandler({ getAppConfig, setTheme, getDefaultTheme });
  const themeHandler = new ThemeHandler();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  // Static: ui-kit shell assets first, then this app's own assets (override).
  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets/room-client', express.static(roomClientAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));

  // Vendored browser modules (resolved via import map on the page).
  let threeMounted = false;
  try {
    app.use('/vendor/three', express.static(resolveThreeStaticDir()));
    threeMounted = true;
  } catch (err) {
    console.warn(`[player-3d-ui] three not resolvable, /vendor/three disabled: ${err.message}`);
  }
  app.use('/vendor/socket.io', express.static(socketIoDistDir()));

  // Kit source (browser-safe) + placeholder GLB models.
  app.use('/kit', express.static(srcDir));
  app.use('/game-engine', express.static(gameEngineSrcDir));
  app.use('/models', express.static(modelsDir));
  app.use('/protocol', express.static(sessionProtocolSrcDir));

  // Theme API (selector parity with other Zeus UIs).
  app.use('/api', createThemeRoutes(themeHandler, getConfig));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'player-3d-ui',
      three: threeMounted,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/', (req, res) => {
    try {
      const cfg = getConfig();
      const themes = themeHandler.getAvailableThemes();
      const sessionId = req.query.session ? String(req.query.session) : cfg.viewer?.sessionId;
      const viewerConfig = resolveViewerConfig({ sessionId });
      const html = viewerView({
        themes,
        currentTheme: cfg.theme?.current,
        viewerConfig
      });
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error('Error rendering 3D viewer:', err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('player-3d-ui error:', err);
    res.status(500).json({ error: err.message });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(port, host, () => resolve(s));
  });
  const boundPort = server.address()?.port ?? port;

  async function close() {
    await new Promise((resolve) => server.close(resolve));
  }

  return { app, server, close, port: boundPort, host };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const handle = await createPlayer3dServer();
  console.log(`player-3d-ui running on http://${handle.host}:${handle.port}`);

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
