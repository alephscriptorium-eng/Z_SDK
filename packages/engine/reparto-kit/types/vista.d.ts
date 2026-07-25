import type { RepartoV1 } from './tipos.js';

export function montarReparto(opts: {
  reparto: RepartoV1;
  mount?: Element;
  doc?: Document;
  id?: string;
  title?: string;
  registry?: unknown;
}): { el: Element; id: string; destroy(): void };

export { filasCastDesdeReparto } from './filas.js';
export const CAST_TABLE_WIDGET_IDS: readonly string[];
export function renderCastTableWidget(ctx?: unknown): { el: Element; id: string; destroy(): void };
export function createDefaultWidgetRegistry(extra?: Record<string, unknown>): unknown;
