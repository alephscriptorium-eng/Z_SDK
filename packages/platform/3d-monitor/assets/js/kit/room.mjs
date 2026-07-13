/**
 * View kit · room wiring — read the injected #viewer-config and connect a
 * browser room client with HUD connection-status reporting.
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
 * @param {string} [opts.statusFieldId] HUD field for connection status
 * @returns room client (already connecting)
 */
export function connectRoom(cfg, opts = {}) {
  const statusId = opts.statusFieldId || 'hud-conn';
  const room = createBrowserRoomClient(cfg);
  room.connect()
    .then(() => setText(statusId, 'connected'))
    .catch((err) => {
      console.warn('[3d-monitor] room connect failed:', err);
      setText(statusId, 'offline');
    });
  return room;
}
