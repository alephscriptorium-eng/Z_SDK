/**
 * @zeus/arg-console view kit — lado servidor (copia evolucionada del
 * view-kit del 3d-monitor).
 *
 * Una "vista" es un layout que combina elementos reutilizables (stage 3D,
 * HUD, panel de log, wiring de room) con su lógica propia (un entry de
 * navegador). El kit normaliza descriptores, los guarda en un registro (el
 * portal lo lista) y renderiza el layout compartido: añadir una vista es
 * definir un descriptor + escribir su entry.
 */

import { div, section, canvas, script, aside, h2, ul, li, span, p } from 'hyperaxe';

/**
 * Normaliza un descriptor de vista.
 *
 * @param {object} def
 * @param {string} def.id            slug en /views/:id
 * @param {string} def.title         título de página + HUD
 * @param {string} [def.emoji]
 * @param {string} [def.description] una línea para la tarjeta del portal
 * @param {string} def.entry         URL del módulo de navegador (lógica propia)
 * @param {string[]} [def.elements]  piezas que combina el layout (tarjeta portal)
 * @param {{fields?: Array<{id:string,label:string,value?:string}>, note?: string, logId?: string}} [def.hud]
 * @param {boolean} [def.logPanel]   columna DOM de log junto al stage
 * @param {string[]} [def.styles]    hojas de estilo extra
 */
export function defineView(def) {
  if (!def || typeof def.id !== 'string' || !def.id) throw new Error('defineView: id requerido');
  if (typeof def.entry !== 'string' || !def.entry) throw new Error(`defineView(${def.id}): entry requerido`);
  return {
    emoji: '🌊',
    description: '',
    elements: [],
    hud: null,
    logPanel: false,
    styles: [],
    title: def.id,
    ...def
  };
}

/**
 * @param {object[]} defs descriptores ya normalizados (salida de defineView)
 */
export function createViewRegistry(defs = []) {
  const views = new Map();
  for (const def of defs) {
    if (views.has(def.id)) throw new Error(`view registry: vista duplicada "${def.id}"`);
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
 * Renderiza el layout compartido: stage 3D (canvas + HUD), panel DOM de log
 * opcional, import map, viewer-config inyectado (con room + actor) y el
 * entry de navegador de la vista.
 *
 * @param {object} view       salida de defineView
 * @param {object} ctx
 * @param {Function} ctx.template     template(title, content, opts) del shell
 * @param {object} ctx.importMap      import map de la página
 * @param {object} ctx.viewerConfig   config de room inyectada como #viewer-config
 */
export function renderViewLayout(view, ctx) {
  const stageChildren = [canvas({ id: 'viewer-canvas' })];
  const hud = renderHud(view);
  if (hud) stageChildren.push(hud);
  // WP-24: el log DOM vive DENTRO del stage — el entry de la vista lo adopta
  // en una ventanita (panel.mjs) colapsable/arrastrable sobre el canvas.
  if (view.logPanel) stageChildren.push(aside({ id: 'view-log', class: 'view-log' }));

  const stage = div({ id: 'viewer-stage', class: 'viewer-stage' }, ...stageChildren);

  const content = section({ class: 'viewer-page' },
    stage,
    script({ type: 'importmap' }, JSON.stringify(ctx.importMap)),
    script(
      { type: 'application/json', id: 'viewer-config' },
      JSON.stringify({ ...ctx.viewerConfig, view: view.id })
    ),
    script({ type: 'module', src: view.entry })
  );

  return ctx.template(view.title, content, {
    currentPage: `view:${view.id}`,
    styles: ['/assets/css/viewer.css', ...view.styles]
  });
}
