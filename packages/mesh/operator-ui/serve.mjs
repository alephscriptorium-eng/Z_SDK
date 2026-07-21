/**
 * @zeus/operator-ui serve.
 *
 * Serves the built Angular host app (dist/public) and injects the live game
 * room config as `window.__ZEUS__`, so ZeusOperatorBridgeService joins the
 * authority room (contrato único).
 *
 * Default game slice: `ciudad` (room `CIUDAD_DEMO`). Override with ZEUS_GAME /
 * ZEUS_ARG_ROOM (e.g. `delta` / `ARG_DELTA`).
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

const DEFAULT_CIUDAD_ROOM = 'CIUDAD_DEMO';

function defaultZeusConfig() {
  const base = resolveRoomClientConfig({});
  const game = process.env.ZEUS_GAME ?? 'ciudad';
  const roomFallback = game === 'ciudad' ? DEFAULT_CIUDAD_ROOM : base.room;
  return {
    ...base,
    room: process.env.ZEUS_ARG_ROOM ?? roomFallback,
    user: process.env.ZEUS_SCRIPTORIUM_USER ?? 'operator-ui',
    game
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

  app.get('/health', (_req, res) =>
    res.json({
      ok: true,
      service: 'operator-ui',
      port: resolvedPort,
      role: 'operator',
      room: ZEUS.room,
      game: ZEUS.game ?? 'ciudad'
    })
  );

  // Inject the room config into index.html as window.__ZEUS__ before the app boots.
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
  console.log(
    `Serving at http://localhost:${handle.port} · room=${ZEUS.room} · game=${ZEUS.game}`
  );
}
