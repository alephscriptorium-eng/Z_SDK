import { createAppConfig } from '@zeus/app-shell';
import { DEFAULT_ZEUS_UI_MESH } from '@zeus/presets-sdk/env';

export const {
  packageDir,
  getAppConfig,
  getConfig,
  updateConfig,
  setTheme,
  updateSection,
  getSectionDefaults,
  resolveDataDir,
  getDefaultTheme,
  getLocalNavEntries
} = createAppConfig({
  appId: 'editor',
  defaultPort: DEFAULT_ZEUS_UI_MESH.editor.port,
  importMetaUrl: import.meta.url,
  features: {
    worldEditor: true,
    cloakExplorer: true,
    themeSystem: true,
    presetLibrary: false,
    mcpExplorer: true
  },
  extraDefaults: {
    branding: {
      title: 'Zeus World Editor',
      tag: 'Scriptorium · Mundo A'
    },
    localNav: [
      { href: '/', emoji: '🗺️', text: 'World', pageKey: 'home' },
      { href: '/cloaks', emoji: '🧥', text: 'Cloaks', pageKey: 'mcp' },
      { href: '/docs', emoji: '📖', text: 'API', pageKey: 'api' },
      { href: '/settings', emoji: '⚙️', text: 'Settings', pageKey: 'settings' }
    ]
  }
});
