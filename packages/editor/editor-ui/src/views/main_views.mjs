import { createShellViews } from '@zeus/app-shell';
import { defaultShellBrand } from '@zeus/ui-kit';
import { getAppConfig, resolveDataDir, getDefaultTheme, getLocalNavEntries } from '../config.mjs';

export const { template, navLink, pageContainer, contentSection } = createShellViews({
  uiId: 'editor',
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  buildLocalNavEntries: getLocalNavEntries,
  defaultCurrentPage: 'home',
  getBrand: (config) => {
    const branding = config.branding || {};
    return defaultShellBrand(branding.title || 'Zeus World Editor');
  }
});
