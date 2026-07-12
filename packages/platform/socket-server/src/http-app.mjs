import express from 'express';
import cors from 'cors';
import { NAMESPACE } from './config.mjs';
import { mountAdminUi } from './admin-ui.mjs';

/**
 * @param {{ bridge: string, serverUrl: string }} options
 */
export function createHttpApp({ bridge, serverUrl }) {
  const app = express();
  app.use(
    cors({
      origin: (_origin, callback) => callback(null, true),
      credentials: true
    })
  );

  const adminUiAvailable = mountAdminUi(app, { serverUrl });

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, bridge, namespace: `/${NAMESPACE}` });
  });

  return { app, adminUiAvailable };
}
