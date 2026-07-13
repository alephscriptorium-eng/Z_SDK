/**
 * View kit · room wiring — lee el #viewer-config inyectado y conecta un
 * cliente de room de navegador reportando estado de conexión al HUD.
 */

import { createBrowserRoomClient } from '/assets/room-client/room-client.browser.mjs';
import { readInjectedRoomConfig } from '/assets/room-client/dev-room-config.mjs';
import { setText } from './hud.mjs';

export function readViewerConfig() {
  return readInjectedRoomConfig('viewer-config');
}

/**
 * @param {object} cfg viewer config (readViewerConfig())
 * @param {object} [opts]
 * @param {string} [opts.statusFieldId] campo HUD de estado de conexión
 * @param {string} [opts.user]          identidad en la room (p.ej. el actorId)
 * @returns cliente de room (ya conectando)
 */
export function connectRoom(cfg, opts = {}) {
  const statusId = opts.statusFieldId || 'hud-conn';
  const room = createBrowserRoomClient(opts.user ? { ...cfg, user: opts.user } : cfg);
  room.connect()
    .then(() => setText(statusId, 'connected'))
    .catch((err) => {
      console.warn('[arg-console] room connect falló:', err);
      setText(statusId, 'offline');
    });
  return room;
}
