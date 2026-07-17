/**
 * @zeus/3d-monitor view kit — server side.
 *
 * A "view" is a layout that combines reusable elements (3D stage, HUD, log
 * panel, room wiring) with its own business logic (a browser entry module).
 * The kit normalizes view descriptors, keeps them in a registry (the portal
 * lists it) and renders the shared shell layout for every view, so adding a
 * new view is: define a descriptor + write its browser entry.
 */

import { div, section, canvas, script, aside, h2, ul, li, span, p } from 'hyperaxe';

/**
 * Normalize a view descriptor.
 *
 * @param {object} def
 * @param {string} def.id            slug used in /views/:id
 * @param {string} def.title         page + HUD title
 * @param {string} [def.emoji]
 * @param {string} [def.description] one-liner shown on the portal card
 * @param {string} def.entry         browser module URL (business logic)
 * @param {string[]} [def.elements]  reusable elements the layout combines (portal card)
 * @param {{fields?: Array<{id:string,label:string,value?:string}>, note?: string, logId?: string}} [def.hud]
 * @param {boolean} [def.logPanel]   render a DOM log column next to the stage
 * @param {string[]} [def.styles]    extra stylesheet hrefs
 * @param {string} [def.defaultRoom] fallback room this view observes when
 *   neither `?room=` nor ZEUS_SCRIPTORIUM_ROOM pin one — mirrors the demos'
 *   own room resolution (e.g. PUBLIC_ROOM for demo:game)
 */
export function defineView(def) {
  if (!def || typeof def.id !== 'string' || !def.id) throw new Error('defineView: id is required');
  if (typeof def.entry !== 'string' || !def.entry) throw new Error(`defineView(${def.id}): entry is required`);
  return {
    emoji: '🛰️',
    description: '',
    elements: [],
    hud: null,
    logPanel: false,
    styles: [],
    defaultRoom: null,
    title: def.id,
    ...def
  };
}

/**
 * @param {object[]} defs already-normalized view descriptors (defineView output)
 */
export function createViewRegistry(defs = []) {
  const views = new Map();
  for (const def of defs) {
    if (views.has(def.id)) throw new Error(`view registry: duplicate view id "${def.id}"`);
    views.set(def.id, def);
  }
  return {
    list: () => [...views.values()],
    get: (id) => views.get(id) ?? null,
    has: (id) => views.has(id)
  };
}

function renderHud(view) {
  const hud = view.hud;
  if (!hud) return null;
  const items = (hud.fields ?? []).map((field) =>
    li(
      span({ class: 'hud-key' }, `${field.label} `),
      span({ id: field.id, class: 'hud-val' }, field.value ?? '—')
    )
  );
  const children = [
    h2({ class: 'hud-title' }, `${view.emoji} ${view.title}`),
    ul({ class: 'hud-list' }, ...items)
  ];
  if (hud.note) children.push(p({ class: 'hud-note' }, hud.note));
  if (hud.logId) children.push(div({ id: hud.logId, class: 'hud-log' }, '—'));
  return aside({ id: 'viewer-hud', class: 'viewer-hud' }, ...children);
}

/**
 * Render the shared view layout: 3D stage (canvas + HUD), optional DOM log
 * panel, import map, injected viewer-config and the view's browser entry.
 *
 * @param {object} view       defineView output
 * @param {object} ctx
 * @param {Function} ctx.template     app-shell template(title, content, opts)
 * @param {object} ctx.importMap      page import map
 * @param {object} ctx.viewerConfig   room config injected as #viewer-config
 * @param {string[]} [ctx.themes]
 * @param {string} [ctx.currentTheme]
 */
export function renderViewLayout(view, ctx) {
  const stageChildren = [canvas({ id: 'viewer-canvas' })];
  const hud = renderHud(view);
  if (hud) stageChildren.push(hud);

  const stage = div({ id: 'viewer-stage', class: 'viewer-stage' }, ...stageChildren);
  const body = view.logPanel
    ? div({ class: 'viewer-split' }, stage, aside({ id: 'view-log', class: 'view-log' }))
    : stage;

  const content = section({ class: 'viewer-page' },
    body,
    script({ type: 'importmap' }, JSON.stringify(ctx.importMap)),
    script(
      { type: 'application/json', id: 'viewer-config' },
      JSON.stringify({ ...ctx.viewerConfig, view: view.id })
    ),
    script({ type: 'module', src: view.entry })
  );

  return ctx.template(view.title, content, {
    themes: ctx.themes || [],
    currentTheme: ctx.currentTheme,
    currentPage: `view:${view.id}`,
    styles: ['/assets/css/viewer.css', ...view.styles]
  });
}
