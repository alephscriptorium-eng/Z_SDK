import { createShellViews } from '@zeus/app-shell';
import { defaultShellBrand } from '@zeus/ui-kit';
import { getAppConfig, resolveDataDir, getDefaultTheme, getLocalNavEntries } from '../config.mjs';

export const { template, navLink, pageContainer, contentSection } = createShellViews({
  uiId: 'firehose',
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  buildLocalNavEntries: getLocalNavEntries,
  defaultCurrentPage: 'firehose',
  getBrand: (config) => {
    const branding = config.branding || {};
    return defaultShellBrand(branding.title || 'Firehose Explorer');
  }
});
