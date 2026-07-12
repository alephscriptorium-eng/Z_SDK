import { createAppConfig } from '@zeus/app-shell';
import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';

export const {
  packageDir,
  getAppConfig,
  getConfig,
  setTheme,
  resolveDataDir,
  getDefaultTheme,
  getLocalNavEntries
} = createAppConfig({
  appId: 'firehose',
  defaultPort: DEFAULT_ZEUS_UI_MESH.firehose.port,
  importMetaUrl: import.meta.url,
  extraDefaults: {
    localNav: [
      { href: '/', emoji: '🔥', text: 'Firehose', pageKey: 'firehose' },
      { href: '/docs', emoji: '📖', text: 'API', pageKey: 'api' },
      { href: '/settings', emoji: '⚙️', text: 'Settings', pageKey: 'settings' }
    ]
  }
});
