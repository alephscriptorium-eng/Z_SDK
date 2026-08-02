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
 * Puerta: injects startpack-ciudad-v0.1.0 default + POST /api/puerta/enter
 * (embajador-kit + E02 seat verify — Node).
 *
 * Build first: `npm run build:all` (lib + dev-app). Then: `node serve.mjs`.
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  resolveRoomClientConfig,
  DEFAULT_ZEUS_UI_MESH,
  readEnvPortAlias,
  uiPortEnvChain
} from '@zeus/room-client-browser';

/**
 * Puerto de escucha desde el entorno, validado (WP-U266).
 *
 * Hasta U266 esto era `Number(process.env.OPERATOR_UI_PORT ?? …)` duplicado en
 * dos sitios. Reparto de meritos, medido por ablacion y no supuesto:
 *  - `ZEUS_PORT_OPERATOR_UI` **ya la cubria** `resolveRoomClientConfig()`, que
 *    llama a `resolveZeusUiPorts()` (room-client-browser/src/index.mjs:29) al
 *    construir `defaultZeusConfig()`. Con el `Number(...)` viejo, ese caso
 *    aborta igual: salta OTRO guardian.
 *  - `OPERATOR_UI_PORT`, el alias legado, **no lo conoce nadie mas**. Ese era
 *    el hueco de verdad: con el codigo viejo, `OPERATOR_UI_PORT=0` arrancaba y
 *    anunciaba `Serving at http://localhost:55770` — un efimero presentado como
 *    suyo, exit 124 por timeout del arnes porque el proceso seguia vivo.
 *
 * Se centraliza en una sola funcion para que los dos sitios no puedan volver a
 * divergir, y `OPERATOR_UI_PORT` mantiene la prioridad que ya tenia.
 */
function puertoOperatorUiDeEntorno() {
  // El orden vive en la fuente única (`UI_PORT_ENV_CHAIN`), para que el
  // catálogo y `stop:services` anuncien el mismo puerto que aquí se ata.
  return readEnvPortAlias(uiPortEnvChain('operator'), DEFAULT_ZEUS_UI_MESH.operator.port);
}

const here = path.dirname(fileURLToPath(import.meta.url));
// Angular 20 application build emits under dist/public/browser/.
const distDir = path.join(here, 'dist', 'public', 'browser');

const DEFAULT_CIUDAD_ROOM = 'CIUDAD_DEMO';

const puertaMod = await import(
  pathToFileURL(path.join(here, 'fixtures/puerta-entry.mjs')).href
);
const { DEFAULT_STARTPACK, entrarPorPuerta, puertaZeusSlice } = puertaMod;

function defaultZeusConfig() {
  const base = resolveRoomClientConfig({});
  const game = process.env.ZEUS_GAME ?? 'ciudad';
  const roomFallback = game === 'ciudad' ? DEFAULT_CIUDAD_ROOM : base.room;
  return {
    ...base,
    room: process.env.ZEUS_ARG_ROOM ?? roomFallback,
    user: process.env.ZEUS_SCRIPTORIUM_USER ?? 'operator-ui',
    game,
    puerta: puertaZeusSlice({
      startpack: { ...DEFAULT_STARTPACK },
      role: null,
      ssbId: null,
      seat: { ok: false },
    }),
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
  // `port` explicito (incluido `0` = puerto efimero) NO se valida: es codigo
  // pidiendo un puerto, no configuracion mal formada. Ver `config.mjs` de
  // socket-server para la misma distincion.
  const resolvedPort = port ?? puertoOperatorUiDeEntorno();
  const ZEUS = zeus ?? defaultZeusConfig();
  if (!ZEUS.puerta) {
    ZEUS.puerta = puertaZeusSlice({
      startpack: { ...DEFAULT_STARTPACK },
      role: null,
      ssbId: null,
      seat: { ok: false },
    });
  }

  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) =>
    res.json({
      ok: true,
      service: 'operator-ui',
      port: resolvedPort,
      role: 'operator',
      room: ZEUS.room,
      game: ZEUS.game ?? 'ciudad',
      puerta: {
        defaultStartpackRef: DEFAULT_STARTPACK.ref,
        enabled: true,
      },
    })
  );

  /**
   * Puerta de entrada: peercard (+ envelope embajador) → verify seat E02 +
   * startpack default startpack-ciudad-v0.1.0.
   */
  app.post('/api/puerta/enter', (req, res) => {
    const entry = entrarPorPuerta(req.body);
    if (!entry.ok) {
      res.status(400).json({
        ok: false,
        errors: entry.errors,
        startpack: entry.startpack,
        defaultStartpackRef: DEFAULT_STARTPACK.ref,
      });
      return;
    }
    ZEUS.puerta = puertaZeusSlice(entry);
    res.json({
      ok: true,
      startpack: entry.startpack,
      defaultStartpack: entry.defaultStartpack,
      role: entry.role,
      ssbId: entry.ssbId,
      seatOk: true,
      puerta: ZEUS.puerta,
    });
  });

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
  const PORT = puertoOperatorUiDeEntorno();
  const ZEUS = defaultZeusConfig();
  const handle = await createOperatorUiServer({ port: PORT, zeus: ZEUS });
  console.log(
    `Serving at http://localhost:${handle.port} · room=${ZEUS.room} · game=${ZEUS.game}`
  );
}
