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
  appId: 'debug3d',
  defaultPort: DEFAULT_ZEUS_UI_MESH.debug3d.port,
  importMetaUrl: import.meta.url,
  extraDefaults: {
    localNav: [
      { href: '/', emoji: '🛰️', text: 'Debug 3D', pageKey: 'viewer' },
      { href: '/health', emoji: '💓', text: 'Health', pageKey: 'health' }
    ]
  }
});
