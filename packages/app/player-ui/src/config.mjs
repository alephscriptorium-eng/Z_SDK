import { createAppConfig } from '@zeus/app-shell';
import { resolveZeusUiPorts, DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';

const scr = resolveZeusUiPorts().scriptorium || DEFAULT_ZEUS_UI_MESH.scriptorium;
const scriptoriumHref = `http://${scr.host}:${scr.port}${scr.path || '/runtime'}`;

export const {
  packageDir,
  getAppConfig,
  getConfig,
  setTheme,
  resolveDataDir,
  getDefaultTheme,
  getLocalNavEntries
} = createAppConfig({
  appId: 'player',
  defaultPort: DEFAULT_ZEUS_UI_MESH.player.port,
  importMetaUrl: import.meta.url,
  extraDefaults: {
    localNav: [
      { href: '/', emoji: '🎛️', text: 'Tablero', pageKey: 'deck' },
      { href: scriptoriumHref, emoji: '📜', text: 'Runtime', pageKey: 'scriptorium' },
      { href: '/docs', emoji: '📖', text: 'API', pageKey: 'api' },
      { href: '/settings', emoji: '⚙️', text: 'Settings', pageKey: 'settings' }
    ]
  }
});
