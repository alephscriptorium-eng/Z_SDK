import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import express from 'express';

const require = createRequire(import.meta.url);

const ADMIN_UI_MOUNTS = ['/ui', '/admin'];

/** @param {string} serverUrl */
export function buildAdminUiBootstrap(serverUrl) {
  return `<script>(function(){try{localStorage.setItem("server_url",${JSON.stringify(serverUrl || '')}||location.origin);localStorage.setItem("namespace","/admin");localStorage.setItem("path","/socket.io");localStorage.removeItem("session_id");}catch(e){}})();</script>`;
}

export function resolveAdminUiDistRoot() {
  return path.join(
    path.dirname(require.resolve('@socket.io/admin-ui/package.json')),
    'ui',
    'dist'
  );
}

/**
 * Serve @socket.io/admin-ui with a pre-filled connection modal.
 * @param {import('express').Express} app
 * @param {{ serverUrl?: string }} [options]
 */
export function mountAdminUi(app, { serverUrl } = {}) {
  try {
    const adminUiRoot = resolveAdminUiDistRoot();
    const bootstrap = buildAdminUiBootstrap(serverUrl);
    let cachedHtml = null;

    const serveIndex = (_req, res) => {
      if (!cachedHtml) {
        const raw = fs.readFileSync(path.join(adminUiRoot, 'index.html'), 'utf8');
        cachedHtml = raw.replace('<head>', `<head>${bootstrap}`);
      }
      res.type('html').send(cachedHtml);
    };

    for (const base of ADMIN_UI_MOUNTS) {
      app.get(base, serveIndex);
      app.get(`${base}/`, serveIndex);
      app.get(`${base}/index.html`, serveIndex);
      app.use(base, express.static(adminUiRoot, { index: false }));
    }

    return true;
  } catch {
    return false;
  }
}
