/**
 * @zeus/webrtc-viewer serve — hermano de operator-ui/serve.mjs.
 *
 * Sirve el host Angular (dist/public/browser) si está built; si no, el shell
 * browser ESM (peer-list / media-controls / chat) sobre el mismo motor.
 * Valida bulk cache con @zeus/linea-kit/validate (U80).
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  resolveRoomClientConfig,
  DEFAULT_ZEUS_UI_MESH,
  browserAssetsDir as roomClientAssetsDir
} from '@zeus/room-client-browser';
import { resolveIceServers, resolveZeusUiPorts, openBrowser } from '@zeus/presets-sdk/env';
import { validate } from '@zeus/linea-kit/validate';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, 'dist', 'public', 'browser');
const srcDir = path.join(here, 'src');
const require = createRequire(import.meta.url);

function resolveSocketIoClientDir() {
  try {
    return path.dirname(require.resolve('socket.io-client/package.json'));
  } catch {
    return null;
  }
}

function defaultZeusConfig() {
  const base = resolveRoomClientConfig({});
  const iceServers = resolveIceServers(process.env, { warn: () => {} });
  return {
    ...base,
    room: process.env.ZEUS_ARG_ROOM ?? base.room,
    webrtcRoom: process.env.ZEUS_WEBRTC_ROOM ?? `webrtc:${base.room}`,
    user: process.env.ZEUS_SCRIPTORIUM_USER ?? 'webrtc-viewer',
    game: process.env.ZEUS_GAME ?? 'delta',
    iceServers
  };
}

function resolveViewerPort(port) {
  if (port != null) return Number(port);
  const uis = resolveZeusUiPorts();
  return Number(
    process.env.WEBRTC_VIEWER_PORT ??
      process.env.ZEUS_PORT_WEBRTC_VIEWER ??
      uis.webrtcViewer?.port ??
      DEFAULT_ZEUS_UI_MESH.webrtcViewer?.port ??
      3023
  );
}

function buildImportMap() {
  return {
    imports: {
      '@zeus/webrtc-viewer/': '/pkg/',
      '@zeus/webrtc-signaling/peer-session': '/vendor/webrtc-signaling/peer-session.mjs',
      '@zeus/room-client-browser': '/vendor/room-client-browser/room-client.browser.mjs',
      'socket.io-client': '/vendor/socket.io-client/socket.io.esm.min.js'
    }
  };
}

function shellHtml(zeus) {
  const importMap = JSON.stringify(buildImportMap());
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zeus WebRTC Viewer</title>
  <script>window.__ZEUS__=${JSON.stringify(zeus)};</script>
  <script type="importmap">${importMap}</script>
  <link rel="stylesheet" href="/pkg/browser/viewer.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/pkg/browser/viewer-app.mjs"></script>
</body>
</html>`;
}

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {object} [options.zeus]
 */
export async function createWebRtcViewerServer({ port, host = 'localhost', zeus } = {}) {
  const resolvedPort = resolveViewerPort(port);
  const ZEUS = zeus ?? defaultZeusConfig();
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) =>
    res.json({
      ok: true,
      service: 'webrtc-viewer',
      port: resolvedPort,
      room: ZEUS.webrtcRoom || ZEUS.room,
      gameRoom: ZEUS.room,
      angularDist: fs.existsSync(path.join(distDir, 'index.html'))
    })
  );

  app.post('/api/validate-cache', (req, res) => {
    const schemaId = req.body?.schemaId || 'cache-sidecar-meta';
    const object = req.body?.object;
    const result = validate(schemaId, object);
    res.json(result);
  });

  // Package sources for ESM shell (import map).
  app.use('/pkg', express.static(srcDir));

  const signalingPeer = path.resolve(
    here,
    '../../engine/webrtc-signaling/src/peer-session.mjs'
  );
  app.get('/vendor/webrtc-signaling/peer-session.mjs', (_req, res) => {
    res.type('application/javascript').send(fs.readFileSync(signalingPeer, 'utf8'));
  });

  app.use(
    '/vendor/room-client-browser',
    express.static(roomClientAssetsDir)
  );

  const sio = resolveSocketIoClientDir();
  if (sio) {
    app.use('/vendor/socket.io-client', express.static(path.join(sio, 'dist')));
  }

  const hasAngular = fs.existsSync(path.join(distDir, 'index.html'));

  app.get(['/', '/index.html'], (_req, res) => {
    if (hasAngular) {
      const indexPath = path.join(distDir, 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8').replace(
        '</head>',
        `<script>window.__ZEUS__=${JSON.stringify(ZEUS)};</script></head>`
      );
      res.type('html').send(html);
      return;
    }
    res.type('html').send(shellHtml(ZEUS));
  });

  if (hasAngular) {
    app.use(express.static(distDir));
  }

  app.use((_req, res) => {
    if (hasAngular) {
      res.sendFile(path.join(distDir, 'index.html'));
      return;
    }
    res.status(404).type('text').send('not found');
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(resolvedPort, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : resolvedPort;
      resolve({
        port: actualPort,
        close: () =>
          new Promise((resClose, rej) => {
            server.close((err) => (err ? rej(err) : resClose()));
          })
      });
    });
    server.on('error', reject);
  });
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const ZEUS = defaultZeusConfig();
  const handle = await createWebRtcViewerServer({ zeus: ZEUS });
  console.log(
    `webrtc-viewer at http://localhost:${handle.port} · webrtcRoom=${ZEUS.webrtcRoom} · gameRoom=${ZEUS.room}`
  );
  if (String(process.env.ZEUS_OPEN_BROWSER || '') === '1') {
    await openBrowser(`http://localhost:${handle.port}`);
  }
}
