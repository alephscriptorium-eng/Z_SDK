/**
 * Portal page — the monitor's home is no longer a single view but a gallery
 * of registered views (one card per view, linking to /views/:id).
 */

import { div, section, h1, h2, p, a, ul, li, span } from 'hyperaxe';
import { template } from './shell.mjs';

/**
 * @param {object} ctx
 * @param {object} ctx.registry   view registry (list())
 * @param {object} ctx.viewerConfig resolved room config (shown in the header)
 * @param {string[]} [ctx.themes]
 * @param {string} [ctx.currentTheme]
 */
export function portalView(ctx) {
  const cards = ctx.registry.list().map((view) =>
    a({ class: 'portal-card', href: `/views/${view.id}` },
      h2({ class: 'portal-card-title' }, `${view.emoji} ${view.title}`),
      p({ class: 'portal-card-desc' }, view.description),
      ul({ class: 'portal-card-elements' },
        ...view.elements.map((el) => li({ class: 'portal-card-element' }, el))
      )
    )
  );

  const content = section({ class: 'portal-page' },
    h1({ class: 'portal-title' }, '🛰️ 3D Monitor · portal de vistas'),
    p({ class: 'portal-sub' },
      'Room ',
      span({ class: 'portal-room' }, ctx.viewerConfig.room),
      ` · ${cards.length} vistas registradas`
    ),
    div({ class: 'portal-grid' }, ...cards)
  );

  return template('3D Monitor', content, {
    themes: ctx.themes || [],
    currentTheme: ctx.currentTheme,
    currentPage: 'portal',
    styles: ['/assets/css/viewer.css']
  });
}
