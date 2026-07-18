/**
 * Start Oasis /webrtc adaptation (SSB signaling HTTP bridge).
 * Browser open is opt-in: ZEUS_OPEN_BROWSER=1 only.
 */

import { createOasisWebrtcApp } from './http-api.mjs';

const openBrowser = String(process.env.ZEUS_OPEN_BROWSER || '') === '1';
const app = createOasisWebrtcApp();
const { server, host, port, url } = await app.listen();

console.log(`[oasis-webrtc] listening on ${url}/webrtc (host=${host} port=${port})`);
console.log('[oasis-webrtc] signaling: POST /api/webrtc/signal + GET /api/webrtc/inbox');

if (openBrowser) {
  const { exec } = await import('node:child_process');
  const page = `${url}/webrtc`;
  const cmd =
    process.platform === 'win32'
      ? `start "" "${page}"`
      : process.platform === 'darwin'
        ? `open "${page}"`
        : `xdg-open "${page}"`;
  exec(cmd);
} else {
  console.log('[oasis-webrtc] ZEUS_OPEN_BROWSER not 1 — not opening browser (headless default)');
}

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
