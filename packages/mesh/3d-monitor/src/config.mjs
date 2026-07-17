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
      { href: '/', emoji: '🌀', text: 'Portal', pageKey: 'portal' },
      { href: '/views/default', emoji: '🛰️', text: 'Default', pageKey: 'view:default' },
      { href: '/views/ecosystem', emoji: '🕸️', text: 'Ecosystem', pageKey: 'view:ecosystem' },
      { href: '/views/flux', emoji: '🌌', text: 'Flux', pageKey: 'view:flux' },
      { href: '/views/gamemap', emoji: '🗺️', text: 'Gamemap', pageKey: 'view:gamemap' },
      { href: '/views/bots-log', emoji: '🏓', text: 'Bots Log', pageKey: 'view:bots-log' },
      { href: '/health', emoji: '💓', text: 'Health', pageKey: 'health' }
    ]
  }
});
