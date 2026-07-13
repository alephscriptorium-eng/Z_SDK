/**
 * @zeus/operator-ui serve (block-13 L-serve).
 *
 * Serves the built Angular host app (dist/public) behind its own route and
 * injects the live zeus session config as `window.__ZEUS__`, so the app's
 * ZeusSessionBridgeService connects to the running socket-server.
 *
 * Build first: `npm run build:all` (lib + dev-app). Then: `node serve.mjs`.
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  resolveRoomClientConfig,
  DEFAULT_ZEUS_UI_MESH
} from '@zeus/room-client-browser';

const here = path.dirname(fileURLToPath(import.meta.url));
// Angular 20 application build emits under dist/public/browser/.
const distDir = path.join(here, 'dist', 'public', 'browser');

function defaultZeusConfig() {
  const base = resolveRoomClientConfig({
    sessionId: process.env.ZEUS_SESSION_ID ?? 'default'
  });
  return {
    ...base,
    room: process.env.ZEUS_SCRIPTORIUM_ROOM ?? base.room,
    user: process.env.ZEUS_SCRIPTORIUM_USER ?? 'operator-ui'
  };
}

/**
 * @param {object} [options]
 * @param {number} [options.port]
 * @param {string} [options.host]
 * @param {object} [options.zeus] — window.__ZEUS__ payload injected into index.html
 * @returns {Promise<{ port: number, close: () => Promise<void> }>}
 */
export async function createOperatorUiServer({ port, host = 'localhost', zeus } = {}) {
  const resolvedPort =
    port ??
    Number(
      process.env.OPERATOR_UI_PORT ??
        process.env.ZEUS_PORT_OPERATOR_UI ??
        DEFAULT_ZEUS_UI_MESH.operator.port
    );
  const ZEUS = zeus ?? defaultZeusConfig();

  const app = express();

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'operator-ui', port: resolvedPort }));

  // Inject the session config into index.html as window.__ZEUS__ before the app boots.
  app.get(['/', '/index.html'], (_req, res) => {
    const indexPath = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      res.status(503).send('operator-ui not built — run `npm run build:all` first.');
      return;
    }
    const html = fs.readFileSync(indexPath, 'utf8').replace(
      '</head>',
      `<script>window.__ZEUS__=${JSON.stringify(ZEUS)};</script></head>`,
    );
    res.type('html').send(html);
  });

  app.use(express.static(distDir));
  // SPA fallback (Express 5: no '*' route pattern — use a terminal middleware).
  app.use((_req, res) => res.sendFile(path.join(distDir, 'index.html')));

  return new Promise((resolve, reject) => {
    const server = app.listen(resolvedPort, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : resolvedPort;
      resolve({
        port: actualPort,
        close: () =>
          new Promise((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
    server.on('error', reject);
  });
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const PORT = Number(
    process.env.OPERATOR_UI_PORT ??
      process.env.ZEUS_PORT_OPERATOR_UI ??
      DEFAULT_ZEUS_UI_MESH.operator.port
  );
  const ZEUS = defaultZeusConfig();
  const handle = await createOperatorUiServer({ port: PORT, zeus: ZEUS });
  console.log(`Serving at http://localhost:${PORT}`);
}
