/**
 * Adaptador mockdatas / startpack → ParteEstado + deltas.
 * Acepta el shape de censo embarcado (Z01/Z02); no importa packs de juego
 * (frontera engine: cero domain.mjs). El consumidor pasa el JSON.
 */

import { ESTADOS_BARRIO, estadoVacio } from './tipos.mjs';

/**
 * @param {object} censo — `{ barrios: { [id]: { estado } } }` (mockdatas)
 *   o `{ barrios: { [slug]: { displayName?, estado } } }` (startpack)
 * @param {object} [opts]
 * @param {number} [opts.tick]
 * @returns {import('./tipos.mjs').ParteEstado}
 */
export function estadoDesdeCenso(censo, opts = {}) {
  const estado = estadoVacio();
  if (Number.isInteger(opts.tick)) estado.tick = opts.tick;
  const map = censo?.barrios;
  if (!map || typeof map !== 'object') return estado;

  for (const [key, raw] of Object.entries(map)) {
    if (raw == null || typeof raw !== 'object') continue;
    const id =
      typeof raw.displayName === 'string' && raw.displayName
        ? raw.displayName
        : typeof raw.slug === 'string' && raw.slug
          ? raw.slug
          : key;
    const est = ESTADOS_BARRIO.includes(raw.estado) ? raw.estado : 'latente';
    estado.barrios[id] = {
      estado: est,
      gentesActivas: Number.isInteger(raw.gentesActivas) ? raw.gentesActivas : 0
    };
  }
  return estado;
}

/**
 * Convierte un lote de eventos mock de trabajo → ParteDelta[].
 * @param {Array<{ barrioId: string, texto?: string }|string>} events
 * @param {number} [tick]
 * @returns {import('./tipos.mjs').ParteDelta[]}
 */
export function deltasDesdeMockWork(events, tick) {
  /** @type {import('./tipos.mjs').ParteDelta[]} */
  const out = [];
  if (Number.isInteger(tick)) out.push({ type: 'tick', tick });
  for (const e of events || []) {
    if (typeof e === 'string') {
      out.push({ type: 'work', barrioId: e });
      continue;
    }
    if (e && typeof e.barrioId === 'string') {
      out.push({
        type: 'work',
        barrioId: e.barrioId,
        ...(typeof e.texto === 'string' ? { texto: e.texto } : {})
      });
    }
  }
  return out;
}

/**
 * Parche de estado (GAME_STATE_DELTA-like sobre mapa `barrios`) → ParteDelta[].
 * @param {object} delta
 * @returns {import('./tipos.mjs').ParteDelta[]}
 */
export function deltasDesdeStatePatch(delta) {
  /** @type {import('./tipos.mjs').ParteDelta[]} */
  const out = [];
  if (Number.isInteger(delta?.tick)) out.push({ type: 'tick', tick: delta.tick });
  const map = delta?.barrios;
  if (!map || typeof map !== 'object') return out;
  for (const [id, patch] of Object.entries(map)) {
    if (patch == null) {
      out.push({ type: 'barrio', id, estado: 'muerto', gentesActivas: 0 });
      continue;
    }
    /** @type {import('./tipos.mjs').DeltaBarrioPatch} */
    const d = { type: 'barrio', id };
    if (ESTADOS_BARRIO.includes(patch.estado)) d.estado = patch.estado;
    if (Number.isInteger(patch.gentesActivas)) d.gentesActivas = patch.gentesActivas;
    if (Number.isInteger(patch.deltaGentes)) d.deltaGentes = patch.deltaGentes;
    out.push(d);
  }
  return out;
}
