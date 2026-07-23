/**
 * Eje IV sensor B — grafo cercano lote WP-U157 (mitad 2, consumidor independiente).
 */
import { assetsDir, DEFAULT_THEME, template } from '@zeus/ui-kit';
import { THEME_ROUTES } from '@zeus/ui-kit/theme-contract';
import {
  createAppConfig,
  createShellViews,
  defineView
} from '@zeus/app-shell';
import { createThemeHandler } from '@zeus/app-shell/create-theme-handler';
import {
  DEFAULT_POLL_MS,
  fail,
  standardPlayerResourceUris,
  createPlayerRoomBridge
} from '@zeus/player-mcp-kit';
import {
  createBrowserRoomClient,
  resolveGameRoom,
  DEFAULT_GAME_ROOM
} from '@zeus/room-client-browser';
import { DEV_ROOM_CLIENT_CONFIG } from '@zeus/room-client-browser/dev-config';
import {
  createScriptoriumServer,
  NAMESPACE,
  resolveConfig
} from '@zeus/socket-server';

export function sensorB(): {
  theme: string;
  assets: string;
  poll: number;
  room: string;
  ns: string;
  uris: ReturnType<typeof standardPlayerResourceUris>;
} {
  const theme: string = DEFAULT_THEME;
  const html = template('u157', 'ok', {});
  void html;
  const routes = THEME_ROUTES({ prefix: '/api' });
  void routes;
  void createAppConfig;
  void createShellViews;
  void createThemeHandler;
  const view = defineView({ id: 'smoke', title: 'Smoke', entry: '/smoke.mjs' });
  void view;
  const err = fail('noop');
  void err.ok;
  const uris = standardPlayerResourceUris('smoke');
  void createPlayerRoomBridge;
  const room = resolveGameRoom({ ZEUS_SCRIPTORIUM_ROOM: DEFAULT_GAME_ROOM } as NodeJS.ProcessEnv);
  void createBrowserRoomClient;
  void DEV_ROOM_CLIENT_CONFIG;
  const cfg = resolveConfig({ bridge: 'local' });
  void cfg.port;
  void createScriptoriumServer;
  return {
    theme,
    assets: assetsDir,
    poll: DEFAULT_POLL_MS,
    room,
    ns: NAMESPACE,
    uris
  };
}
