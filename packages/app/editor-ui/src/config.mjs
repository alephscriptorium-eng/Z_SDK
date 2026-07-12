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
  features: { presetLibrary: true, mcpExplorer: true, themeSystem: true }
});
