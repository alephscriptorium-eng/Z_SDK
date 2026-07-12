import { createAppConfig } from '@zeus/app-shell';
import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';

export const {
  packageDir,
  getAppConfig,
  getConfig,
  setTheme,
  resolveDataDir,
  resolveBasePath,
  getViewersConfig,
  getDefaultTheme,
  getLocalNavEntries
} = createAppConfig({
  appId: 'view',
  defaultPort: DEFAULT_ZEUS_UI_MESH.view.port,
  importMetaUrl: import.meta.url,
  extraDefaults: {
    localNav: [
      { href: '/', emoji: '📂', text: 'Cache', pageKey: 'cache' },
      { href: '/docs', emoji: '📖', text: 'API', pageKey: 'api' },
      { href: '/settings', emoji: '⚙️', text: 'Settings', pageKey: 'settings' }
    ]
  }
});
