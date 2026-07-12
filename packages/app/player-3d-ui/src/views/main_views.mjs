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
  uiId: 'player3d',
  getAppConfig,
  resolveDataDir,
  getDefaultTheme,
  buildLocalNavEntries: getLocalNavEntries,
  defaultCurrentPage: 'viewer',
  getBrand: (config) => {
    const branding = config.branding || {};
    return defaultShellBrand(branding.title || 'Visor 3D');
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
    '@zeus/game-engine/': '/game-engine/',
    '@zeus/session-protocol/projection': '/protocol/projection/index.mjs'
  }
};

/**
 * @param {object} [options]
 * @param {string[]} [options.themes]
 * @param {string} [options.currentTheme]
 * @param {{scriptoriumUrl:string, room:string, sessionId:string, token:string}} options.viewerConfig
 */
export function viewerView(options = {}) {
  const { viewerConfig } = options;

  const hud = aside({ id: 'viewer-hud', class: 'viewer-hud' },
    h2({ class: 'hud-title' }, '🧊 Visor 3D · room'),
    ul({ class: 'hud-list' },
      li(span({ class: 'hud-key' }, 'conn '), span({ id: 'hud-conn', class: 'hud-val' }, '…')),
      li(span({ class: 'hud-key' }, 'room '), span({ id: 'hud-room', class: 'hud-val' }, viewerConfig.room)),
      li(span({ class: 'hud-key' }, 'playhead '), span({ id: 'hud-playhead', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'deckA '), span({ id: 'hud-deckA', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'deckB '), span({ id: 'hud-deckB', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'deckB.sel '), span({ id: 'hud-deckB-sel', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'seq '), span({ id: 'hud-seq', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'event '), span({ id: 'hud-event', class: 'hud-val' }, '—')),
      li(span({ class: 'hud-key' }, 'sel '), span({ id: 'hud-sel', class: 'hud-val' }, '—'))
    ),
    p({ class: 'hud-note' }, 'Escena vaivén-dos-nodos · marionetas reactivas (ping/pong/selección)')
  );

  const content = section({ class: 'viewer-page' },
    div({ id: 'viewer-stage', class: 'viewer-stage' },
      canvas({ id: 'viewer-canvas' }),
      hud
    ),
    // import map must precede the module script (same DOM order).
    script({ type: 'importmap' }, JSON.stringify(IMPORT_MAP)),
    script(
      { type: 'application/json', id: 'viewer-config' },
      JSON.stringify(viewerConfig)
    ),
    script({ type: 'module', src: '/assets/js/viewer-main.mjs' })
  );

  return template('Visor 3D', content, {
    themes: options.themes || [],
    currentTheme: options.currentTheme,
    currentPage: 'viewer',
    styles: ['/assets/css/viewer.css']
  });
}
