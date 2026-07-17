#!/usr/bin/env node

/**
 * @zeus/3d-monitor server.
 *
 * Portal of 3D views over the scriptorium runtime (Express, server-rendered,
 * no bundler). Views live in src/views/registry.mjs on top of the SSR view
 * kit (src/view-kit); each view's business logic is a browser entry under
 * /assets/js/views/. Serves:
 *   /assets            → ui-kit shell assets + own assets/
 *   /vendor/three      → node_modules/three
 *   /vendor/socket.io  → socket.io-client browser ESM dist
 *   /kit               → @zeus/ui-3d-kit browser-safe src/ (raw)
 *   /view-kit          → @zeus/view-kit browser-safe src/ (raw)
 *   /models            → @zeus/ui-3d-kit assets/models (GLBs)
 *   /health            → { status: ok }
 *   /                  → portal (view gallery)
 *   /views/:id         → a registered view
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
import { srcDir as viewKitSrcDir } from '@zeus/view-kit/node';
import { srcDir as gameEngineSrcDir } from '@zeus/game-engine/node';

import {
  getConfig,
  packageDir,
  getAppConfig,
  setTheme,
  getDefaultTheme
} from './config.mjs';
import { resolveViewerConfig } from './viewer-config.mjs';
import { viewRegistry, renderView } from './views/registry.mjs';
import { portalView } from './views/portal.mjs';

const require = createRequire(import.meta.url);

function socketIoDistDir() {
  return path.dirname(require.resolve('socket.io-client/package.json')) + path.sep + 'dist';
}

/**
 * Resolve the three.js package root to serve statically (build/ + examples/jsm).
 * getThreeDir() either returns a validated dir or throws; the caller's
 * try/catch disables /vendor/three when three is missing.
 */
function resolveThreeStaticDir() {
  return getThreeDir();
}

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 */
export async function createMonitor3dServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3019;
  const host = options.host ?? config.server?.host ?? 'localhost';

  const ThemeHandler = createThemeHandler({ getAppConfig, setTheme, getDefaultTheme });
  const themeHandler = new ThemeHandler();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets/room-client', express.static(roomClientAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));

  let threeMounted = false;
  try {
    app.use('/vendor/three', express.static(resolveThreeStaticDir()));
    threeMounted = true;
  } catch (err) {
    console.warn(`[3d-monitor] three not resolvable, /vendor/three disabled: ${err.message}`);
  }
  app.use('/vendor/socket.io', express.static(socketIoDistDir()));

  app.use('/kit', express.static(srcDir));
  app.use('/view-kit', express.static(viewKitSrcDir));
  app.use('/game-engine', express.static(gameEngineSrcDir));
  app.use('/models', express.static(modelsDir));

  app.use('/api', createThemeRoutes(themeHandler, getConfig));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: '3d-monitor',
      three: threeMounted,
      views: viewRegistry.list().map((view) => view.id),
      timestamp: new Date().toISOString()
    });
  });

  function pageContext(req, view = null) {
    const cfg = getConfig();
    const sessionId = req.query.session ? String(req.query.session) : cfg.viewer?.sessionId;
    const room = req.query.room ? String(req.query.room) : undefined;
    return {
      viewerConfig: resolveViewerConfig({ sessionId, room, fallbackRoom: view?.defaultRoom ?? undefined }),
      themes: themeHandler.getAvailableThemes(),
      currentTheme: cfg.theme?.current
    };
  }

  app.get('/', (req, res) => {
    try {
      const html = portalView({ registry: viewRegistry, ...pageContext(req) });
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error('Error rendering 3d-monitor portal:', err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.get('/views/:id', (req, res) => {
    try {
      const view = viewRegistry.get(req.params.id);
      if (!view) {
        res.status(404).send(`<h1>404</h1><p>Unknown view: ${req.params.id}</p>`);
        return;
      }
      const html = renderView(req.params.id, pageContext(req, view));
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error(`Error rendering 3d-monitor view "${req.params.id}":`, err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('3d-monitor error:', err);
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
  const handle = await createMonitor3dServer();
  console.log(`3d-monitor running on http://${handle.host}:${handle.port}`);

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
