import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveZeusUiPorts } from '@zeus/presets-sdk/env';
import { resolveScriptoriumSecret } from '@zeus/rooms';
import { DEFAULT_GAME_ROOM } from '../browser/room-client.browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const browserAssetsDir = path.resolve(__dirname, '..', 'browser');

export { createBrowserRoomClient, DEFAULT_GAME_ROOM } from '../browser/room-client.browser.mjs';

/**
 * Resolve game room for browser shells (caller/env injects; default ARG_DELTA).
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveGameRoom(env = process.env) {
  return env.ZEUS_ARG_ROOM || DEFAULT_GAME_ROOM;
}

/**
 * Build browser room-client config injected into HTML shells.
 * @param {object} [opts]
 * @param {string} [opts.sessionId] kept for inject compat; does not derive room
 * @param {string} [opts.room]
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
  const room = opts.room || resolveGameRoom();
  const token = resolveScriptoriumSecret();

  return { scriptoriumUrl, room, sessionId, token };
}

export { DEFAULT_ZEUS_UI_MESH, resolveZeusUiPorts } from '@zeus/presets-sdk/env';
export { DEV_ROOM_CLIENT_CONFIG } from '../browser/dev-room-config.mjs';
