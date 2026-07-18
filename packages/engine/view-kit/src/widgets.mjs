/**
 * View kit · registro de widgets de story-board (WP-U113).
 *
 * Tabla id → render. Los juegos inyectan datos; el kit no nombra juegos
 * (D-8). Un segundo juego puede registrar el mismo id con otros datos o
 * ignorar el registry por completo.
 *
 * DOM puro con `doc` inyectable para tests de node.
 */

/**
 * @typedef {{
 *   doc?: Document,
 *   mount?: Element,
 *   data?: object,
 *   id?: string
 * }} WidgetRenderContext
 *
 * @typedef {(ctx: WidgetRenderContext) => {
 *   el: Element,
 *   id: string,
 *   destroy(): void
 * }} WidgetRenderer
 */

/**
 * @param {Record<string, WidgetRenderer>} [entries]
 */
export function createWidgetRegistry(entries = {}) {
  const table = { ...entries };

  return {
    /** @param {string} id */
    has(id) {
      return typeof table[id] === 'function';
    },
    /** @param {string} id */
    get(id) {
      return typeof table[id] === 'function' ? table[id] : null;
    },
    /**
     * @param {string} id
     * @param {WidgetRenderer} render
     */
    register(id, render) {
      if (typeof id !== 'string' || !id) {
        throw new Error('widget id required');
      }
      if (typeof render !== 'function') {
        throw new Error(`widget renderer required for ${id}`);
      }
      table[id] = render;
      return this;
    },
    ids() {
      return Object.keys(table);
    },
    /**
     * @param {string} id
     * @param {WidgetRenderContext} ctx
     */
    render(id, ctx = {}) {
      const fn = table[id];
      if (!fn) return renderUnknownWidget(id, ctx);
      return fn({ ...ctx, id: ctx.id || id });
    }
  };
}

/**
 * Widget genérico: tabla de elenco / cast (filas inyectadas).
 * Schema de datos:
 *   { title?: string, emptyLabel?: string,
 *     rows: Array<{ participant, role, axis?, oldid?, href?, cached? }> }
 *
 * @type {WidgetRenderer}
 */
export function renderCastTableWidget(ctx = {}) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  if (!doc?.createElement) {
    throw new Error('renderCastTableWidget: Document required');
  }

  const data = ctx.data && typeof ctx.data === 'object' ? ctx.data : {};
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const widgetId = ctx.id || 'cast-table';
  const title = data.title || widgetId;

  const el = doc.createElement('section');
  el.id = `widget-${widgetId}`;
  el.className = 'vk-widget vk-widget-cast-table';
  el.setAttribute('data-widget-id', widgetId);

  const heading = doc.createElement('h3');
  heading.className = 'vk-widget-title';
  heading.textContent = title;
  el.appendChild(heading);

  if (rows.length === 0) {
    const empty = doc.createElement('p');
    empty.className = 'vk-widget-empty';
    empty.textContent = data.emptyLabel || 'elenco vacío';
    el.appendChild(empty);
  } else {
    const table = doc.createElement('table');
    table.className = 'vk-cast-table';
    const thead = doc.createElement('thead');
    const hr = doc.createElement('tr');
    for (const label of ['participante', 'rol', 'eje', 'oldid']) {
      const th = doc.createElement('th');
      th.textContent = label;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = doc.createElement('tbody');
    for (const row of rows) {
      const tr = doc.createElement('tr');
      appendCell(doc, tr, row.participant ?? '—');
      appendCell(doc, tr, row.role ?? '—');
      appendCell(doc, tr, row.axis ?? '—');
      const oldidTd = doc.createElement('td');
      oldidTd.className = 'vk-cast-oldid';
      const oldid = row.oldid != null ? String(row.oldid) : '';
      if (oldid && row.href) {
        const a = doc.createElement('a');
        a.href = String(row.href);
        a.textContent = oldid;
        a.rel = 'noopener noreferrer';
        oldidTd.appendChild(a);
      } else {
        oldidTd.textContent = oldid || '—';
      }
      const badge = doc.createElement('span');
      badge.className = row.cached
        ? 'vk-cache-badge cached'
        : 'vk-cache-badge miss';
      badge.textContent = row.cached ? 'cacheado' : 'no cacheado';
      oldidTd.appendChild(badge);
      tr.appendChild(oldidTd);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    el.appendChild(table);
  }

  const mount = ctx.mount;
  if (mount?.appendChild) mount.appendChild(el);

  return {
    el,
    id: widgetId,
    destroy() {
      if (typeof el.remove === 'function') el.remove();
      else if (el.parentNode) {
        el.parentNode.children = el.parentNode.children.filter((c) => c !== el);
        el.parentNode = null;
      }
    }
  };
}

/**
 * Ids del cast-table en la fábrica por defecto.
 * Canónico: `cast-table`. Alias de dialecto: `panel-elenco`
 * → mismo render (tabla de ids; un solo renderer).
 */
export const CAST_TABLE_WIDGET_IDS = Object.freeze([
  'cast-table',
  'panel-elenco'
]);

/**
 * Registro por defecto: canónico `cast-table` + alias `panel-elenco`
 * → mismo `renderCastTableWidget`.
 * @param {Record<string, WidgetRenderer>} [extra]
 */
export function createDefaultWidgetRegistry(extra = {}) {
  /** @type {Record<string, WidgetRenderer>} */
  const entries = {};
  for (const id of CAST_TABLE_WIDGET_IDS) {
    entries[id] = renderCastTableWidget;
  }
  return createWidgetRegistry({
    ...entries,
    ...extra
  });
}

/**
 * Monta los widgets declarados (p. ej. act.widgets del story-board).
 *
 * @param {object} opts
 * @param {ReturnType<typeof createWidgetRegistry>} opts.registry
 * @param {string[]} opts.widgets
 * @param {Record<string, object>} [opts.dataById]
 * @param {Element} opts.mount
 * @param {Document} [opts.doc]
 * @returns {{ instances: object[], destroy(): void }}
 */
export function mountStoryWidgets(opts) {
  const { registry, widgets, mount, doc } = opts;
  const dataById = opts.dataById || {};
  if (!registry || typeof registry.render !== 'function') {
    throw new Error('mountStoryWidgets: registry required');
  }
  if (!mount) throw new Error('mountStoryWidgets: mount required');
  const list = Array.isArray(widgets) ? widgets : [];
  const instances = [];

  for (const id of list) {
    instances.push(
      registry.render(id, {
        doc,
        mount,
        data: dataById[id] || {},
        id
      })
    );
  }

  return {
    instances,
    destroy() {
      for (const inst of instances) inst.destroy?.();
      instances.length = 0;
    }
  };
}

/** @type {WidgetRenderer} */
function renderUnknownWidget(id, ctx = {}) {
  const doc = ctx.doc || (typeof document !== 'undefined' ? document : null);
  if (!doc?.createElement) {
    throw new Error('renderUnknownWidget: Document required');
  }
  const el = doc.createElement('aside');
  el.className = 'vk-widget vk-widget-unknown';
  el.setAttribute('data-widget-id', id);
  el.textContent = `widget sin runtime: ${id}`;
  if (ctx.mount?.appendChild) ctx.mount.appendChild(el);
  return {
    el,
    id,
    destroy() {
      if (typeof el.remove === 'function') el.remove();
      else if (el.parentNode) {
        el.parentNode.children = el.parentNode.children.filter((c) => c !== el);
        el.parentNode = null;
      }
    }
  };
}

function appendCell(doc, tr, text) {
  const td = doc.createElement('td');
  td.textContent = text == null || text === '' ? '—' : String(text);
  tr.appendChild(td);
}
