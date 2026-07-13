/**
 * Shared shell for every 3d-monitor page: app-shell template + the page
 * import map (three, socket.io, ui-3d-kit and game-engine served vendored).
 */

import { createShellViews } from '@zeus/app-shell';
import { defaultShellBrand } from '@zeus/ui-kit';
import {
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  getLocalNavEntries
} from '../config.mjs';

export const { template } = createShellViews({
  uiId: 'debug3d',
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  buildLocalNavEntries: getLocalNavEntries,
  defaultCurrentPage: 'portal',
  getBrand: (config) => {
    const branding = config.branding || {};
    return defaultShellBrand(branding.title || '3D Monitor');
  }
});

export const IMPORT_MAP = {
  imports: {
    three: '/vendor/three/build/three.module.js',
    'three/addons/': '/vendor/three/examples/jsm/',
    'socket.io-client': '/vendor/socket.io/socket.io.esm.min.js',
    '@zeus/ui-3d-kit': '/kit/index.mjs',
    '@zeus/ui-3d-kit/': '/kit/',
    '@zeus/game-engine': '/game-engine/index.mjs',
    '@zeus/game-engine/': '/game-engine/'
  }
};
