import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the shared Scriptorium favicon. */
export const faviconPath = path.resolve(__dirname, '..', 'assets', 'favicon.ico');

/** Default favicon URL for HTML link tags. */
export const FAVICON_HREF = '/favicon.ico';

/**
 * Serve GET /favicon.ico (browsers request this even without a link tag).
 *
 * @param {import('express').Express} app
 */
export function mountFavicon(app) {
  app.get('/favicon.ico', (_req, res) => {
    res.sendFile(faviconPath);
  });
}
