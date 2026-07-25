/**
 * Adaptador de vista: consume el widget de reparto EXISTENTE de
 * `@zeus/view-kit` (`renderCastTableWidget` / cast-table) — dependencia real,
 * sin fork ni copia. Import opcional (subpath `./vista`): el core del kit
 * (`.`) no arrastra view-kit ni su cadena 3D.
 */

import { renderCastTableWidget, createDefaultWidgetRegistry, CAST_TABLE_WIDGET_IDS } from '@zeus/view-kit';
import { filasCastDesdeReparto } from './filas.mjs';

/**
 * Monta el reparto de dominio en el cast-table de view-kit.
 * @param {object} opts
 * @param {import('./tipos.mjs').RepartoV1} opts.reparto
 * @param {Element} [opts.mount]
 * @param {Document} [opts.doc]
 * @param {string} [opts.id='cast-table']
 * @param {string} [opts.title='reparto']
 * @param {ReturnType<typeof createDefaultWidgetRegistry>} [opts.registry]
 * @returns {{ el: Element, id: string, destroy(): void }}
 */
export function montarReparto({ reparto, mount, doc, id = 'cast-table', title = 'reparto', registry } = {}) {
  const reg = registry || createDefaultWidgetRegistry();
  return reg.render(id, {
    doc,
    mount,
    id,
    data: { title, rows: filasCastDesdeReparto(reparto) }
  });
}

export { filasCastDesdeReparto, renderCastTableWidget, createDefaultWidgetRegistry, CAST_TABLE_WIDGET_IDS };
