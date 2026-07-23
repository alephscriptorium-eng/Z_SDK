/** Types for `@zeus/room-client-browser` (WP-U157). */

export const browserAssetsDir: string;

export {
  createBrowserRoomClient,
  DEFAULT_GAME_ROOM
} from './browser.js';

export function resolveGameRoom(env?: NodeJS.ProcessEnv): string;

export function resolveRoomClientConfig(opts?: {
  sessionId?: string;
  room?: string;
}): {
  scriptoriumUrl: string;
  room: string;
  sessionId: string;
  token: string;
};

export {
  DEFAULT_ZEUS_UI_MESH,
  resolveZeusUiPorts
} from '@zeus/presets-sdk/env';

export { DEV_ROOM_CLIENT_CONFIG } from './dev-config.js';
