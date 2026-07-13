#!/usr/bin/env node

/**
 * @zeus/firehose-browser server.
 * Express + firehose volume browse API + micropost preview.
 */

import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { assetsDir as uiKitAssetsDir, createThemeRoutes } from '@zeus/ui-kit';
import { resolveVolume } from '@zeus/presets-sdk';
import { mountSpecRoutes, mountSwaggerUi } from '@zeus/presets-sdk/docs';

import {
  getConfig,
  packageDir
} from './config.mjs';
import { ThemeHandler } from './theme-handler.mjs';
import {
  listCorpora,
  browseCorpus,
  readCorpusFile,
  listPosts,
  getFirehoseStats,
  loadTriageManifest
} from './firehose-bridge.mjs';
import { firehoseView } from './views/firehose_view.mjs';
import { settingsView } from './views/settings_view.mjs';
import { createBrowseRoutes } from './browse-routes.mjs';
import { buildFirehoseSpec } from '../spec/build.mjs';
import { createArgTrackSubscriber, mountTrackFocusRoute } from './arg-track-subscriber.mjs';
import { DEFAULT_ARG_ROOM } from '@zeus/arg-domain';

/** @type {{ corpus: string|null, path: string|null, mode: string|null, name: string|null, summary: string|null }} */
let currentFocus = {
  corpus: null,
  path: null,
  mode: null,
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
export async function createFirehoseServer(options = {}) {
  const config = getConfig();
  const port = options.port ?? config.server?.port ?? 3016;
  const host = options.host ?? config.server?.host ?? 'localhost';
  const themeHandler = new ThemeHandler();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use('/assets', express.static(uiKitAssetsDir));
  app.use('/assets', express.static(path.join(packageDir, 'assets')));
  const themeApi = createThemeRoutes(themeHandler, getConfig, {
    extendConfig: (cfg) => {
      const volume = resolveVolume('firehose');
      const trackActor = options.trackActor ?? process.env.ZEUS_ARG_TRACK_ACTOR ?? null;
      const trackRoom = options.trackRoom ?? process.env.ZEUS_ARG_ROOM ?? DEFAULT_ARG_ROOM;
      return {
        discovery: cfg.discovery,
        defaultCorpus: cfg.defaultCorpus,
        branding: cfg.branding,
        volume: {
          id: volume.id,
          label: volume.label,
          absPath: volume.absPath,
          readonly: volume.readonly
        },
        track: trackActor
          ? { enabled: true, actor: trackActor, room: trackRoom, focusUrl: '/api/track/focus' }
          : { enabled: false }
      };
    }
  });
  app.use('/api', themeApi);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'firehose-browser', timestamp: new Date().toISOString() });
  });

  mountSpecRoutes(app, { specs: { 'openapi.json': buildFirehoseSpec } });
  mountSwaggerUi(app, { title: 'Firehose View UI API' });

  const trackActor = options.trackActor ?? process.env.ZEUS_ARG_TRACK_ACTOR ?? null;
  const trackRoom = options.trackRoom ?? process.env.ZEUS_ARG_ROOM ?? DEFAULT_ARG_ROOM;
  let trackSubscriber = null;
  if (trackActor) {
    trackSubscriber = createArgTrackSubscriber({
      actor: trackActor,
      browserHint: 'firehose-browser',
      room: trackRoom
    });
    await trackSubscriber.start().catch((err) => {
      console.warn('[firehose-browser] arg:track subscriber no arrancó:', err.message);
    });
  }
  mountTrackFocusRoute(app, trackSubscriber);

  app.use(
    '/api',
    createBrowseRoutes({
      port,
      listCorpora,
      browseCorpus,
      readCorpusFile,
      listPosts,
      loadTriageManifest,
      getFirehoseStats,
      setFocus,
      buildFocusSnapshot
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
      const defaultCorpus = req.query.corpus || cfg.defaultCorpus || 'candidate';
      const html = firehoseView({
        defaultCorpus: String(defaultCorpus),
        themes,
        currentTheme: cfg.theme?.current
      });
      res.setHeader('Content-Type', 'text/html');
      res.send(html.outerHTML);
    } catch (err) {
      console.error('Error rendering firehose view:', err);
      res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  app.use((err, _req, res, _next) => {
    console.error('Firehose UI error:', err);
    res.status(500).json({ error: err.message });
  });

  const server = await new Promise((resolve) => {
    const s = app.listen(port, host, () => resolve(s));
  });

  async function close() {
    trackSubscriber?.stop();
    await new Promise((resolve) => server.close(resolve));
  }

  return { app, server, close, port, host, setFocus, getFocus: buildFocusSnapshot, trackSubscriber };
}

import { pathToFileURL } from 'node:url';
import { openBrowser } from '@zeus/presets-sdk/env';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const handle = await createFirehoseServer();
  const url = `http://${handle.host}:${handle.port}`;
  console.log(`Firehose browser running on ${url}`);
  const vol = resolveVolume('firehose');
  console.log(`Volume: ${vol.absPath}`);
  openBrowser(url);

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
