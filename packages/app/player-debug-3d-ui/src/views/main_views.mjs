import { createShellViews } from '@zeus/app-shell';
import { defaultShellBrand } from '@zeus/ui-kit';
import { div, section, canvas, script, aside, h2, ul, li, span, p } from 'hyperaxe';
import {
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  getLocalNavEntries
} from '../config.mjs';

const { template } = createShellViews({
  uiId: 'debug3d',
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  buildLocalNavEntries: getLocalNavEntries,
  defaultCurrentPage: 'viewer',
  getBrand: (config) => {
    const branding = config.branding || {};
    return defaultShellBrand(branding.title || 'Debug 3D');
  }
});

const IMPORT_MAP = {
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

/**
 * @param {object} [options]
 * @param {string[]} [options.themes]
 * @param {string} [options.currentTheme]
 * @param {{scriptoriumUrl:string, room:string, sessionId:string, token:string}} options.viewerConfig
 */
export function debugView(options = {}) {
  const { viewerConfig } = options;

  const hud = aside({ id: 'viewer-hud', class: 'viewer-hud' },
    h2({ class: 'hud-title' }, '🛰️ Debug 3D · room traffic'),
    ul({ class: 'hud-list' },
      li(span({ class: 'hud-key' }, 'conn '), span({ id: 'hud-conn', class: 'hud-val' }, '…')),
      li(span({ class: 'hud-key' }, 'room '), span({ id: 'hud-room', class: 'hud-val' }, viewerConfig.room)),
      li(span({ class: 'hud-key' }, 'phase '), span({ id: 'hud-phase', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'seq '), span({ id: 'hud-seq', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'heartbeat '), span({ id: 'hud-heartbeat', class: 'hud-val' }, '0')),
      li(span({ class: 'hud-key' }, 'clients '), span({ id: 'hud-clients', class: 'hud-val' }, '0')),
      li(span({ class: 'hud-key' }, 'events '), span({ id: 'hud-events', class: 'hud-val' }, '0'))
    ),
    p({ class: 'hud-note' }, 'Última selección:'),
    div({ id: 'hud-selection-log', class: 'hud-log' }, '—')
  );

  const content = section({ class: 'viewer-page' },
    div({ id: 'viewer-stage', class: 'viewer-stage' },
      canvas({ id: 'viewer-canvas' }),
      hud
    ),
    script({ type: 'importmap' }, JSON.stringify(IMPORT_MAP)),
    script(
      { type: 'application/json', id: 'viewer-config' },
      JSON.stringify(viewerConfig)
    ),
    script({ type: 'module', src: '/assets/js/viewer-main.mjs' })
  );

  return template('Debug 3D', content, {
    themes: options.themes || [],
    currentTheme: options.currentTheme,
    currentPage: 'viewer',
    styles: ['/assets/css/viewer.css']
  });
}
