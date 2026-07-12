import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveZeusUiPorts } from '@zeus/presets-sdk/env';
import {
  resolveSessionRoom,
  resolveScriptoriumSecret
} from '@zeus/rooms';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const browserAssetsDir = path.resolve(__dirname, '..', 'browser');

export { createBrowserRoomClient } from '../browser/room-client.browser.mjs';

/**
 * Build browser room-client config injected into HTML shells.
 * @param {object} [opts]
 * @param {string} [opts.sessionId]
 * @returns {{ scriptoriumUrl: string, room: string, sessionId: string, token: string }}
 */
export function resolveRoomClientConfig(opts = {}) {
  const uis = resolveZeusUiPorts();
  const scr = uis.scriptorium || { host: 'localhost', port: 3017, path: '/runtime' };
  const host = scr.host || 'localhost';
  const port = scr.port || 3017;
  const scrPath = scr.path || '/runtime';
  const scriptoriumUrl = `http://${host}:${port}${scrPath}`;

  const sessionId = opts.sessionId || process.env.ZEUS_SCRIPTORIUM_SESSION || 'default';
  const room = resolveSessionRoom(sessionId);
  const token = resolveScriptoriumSecret();

  return { scriptoriumUrl, room, sessionId, token };
}

export { DEFAULT_ZEUS_UI_MESH, resolveZeusUiPorts } from '@zeus/presets-sdk/env';
export { DEV_ROOM_CLIENT_CONFIG } from '../browser/dev-room-config.mjs';
