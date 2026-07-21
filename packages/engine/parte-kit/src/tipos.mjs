/**
 * ParteDeCiudad v1 — contrato congelado (SEMILLA-ARG §A1).
 * No inventar campos fuera de este shape.
 *
 * `DeltaBarrio` / campo `delta` = dirección de cambio de censo (protocolo /
 * state-patch), no el nombre del juego «delta» (D-8 · HOTFIX-ARG-1 clase
 * kits de lectura).
 *
 * @typedef {'vivo'|'latente'|'muerto'|'roto'} EstadoBarrio
 * @typedef {'subio'|'bajo'|'igual'} DeltaBarrio
 *
 * @typedef {object} BarrioEnParte
 * @property {string} id
 * @property {EstadoBarrio} estado
 * @property {DeltaBarrio} delta
 * @property {number} gentesActivas
 *
 * @typedef {object} PendienteBarrio
 * @property {string} barrioId
 * @property {string} texto
 *
 * @typedef {object} ParteDeCiudad
 * @property {'parte/1'} version
 * @property {number} tick
 * @property {{ vivos: number, latentes: number, muertos: number, rotos: number }} censo
 * @property {BarrioEnParte[]} barrios
 * @property {string[]} titulares
 * @property {PendienteBarrio[]} pendientes
 *
 * Estado interno del redactor (derivado; no es el parte publicado).
 *
 * @typedef {object} BarrioEstado
 * @property {EstadoBarrio} estado
 * @property {number} gentesActivas
 *
 * @typedef {object} ParteEstado
 * @property {number} tick
 * @property {Record<string, BarrioEstado>} barrios
 *
 * Deltas de entrada (protocolo state + eventos mock de trabajo).
 *
 * @typedef {object} DeltaTick
 * @property {'tick'} type
 * @property {number} tick
 *
 * @typedef {object} DeltaBarrioPatch
 * @property {'barrio'} type
 * @property {string} id
 * @property {EstadoBarrio} [estado]
 * @property {number} [gentesActivas]
 * @property {number} [deltaGentes]
 *
 * @typedef {object} DeltaWork
 * @property {'work'} type
 * @property {string} barrioId
 * @property {string} [texto]
 *
 * @typedef {DeltaTick|DeltaBarrioPatch|DeltaWork} ParteDelta
 */

export const PARTE_VERSION = 'parte/1';

export const ESTADOS_BARRIO = Object.freeze([
  'vivo',
  'latente',
  'muerto',
  'roto'
]);

export const DELTAS_BARRIO = Object.freeze(['subio', 'bajo', 'igual']);

/** entryKind ledger en canal existente (cero canal nuevo). */
export const LEDGER_PARTE = 'parte';
export const LEDGER_PARTE_RECHAZADO = 'parte_rechazado';

/**
 * @param {unknown} value
 * @returns {value is ParteDeCiudad}
 */
export function isParteDeCiudadShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const p = /** @type {Record<string, unknown>} */ (value);
  if (p.version !== PARTE_VERSION) return false;
  if (!Number.isInteger(p.tick)) return false;
  if (p.censo == null || typeof p.censo !== 'object') return false;
  const c = /** @type {Record<string, unknown>} */ (p.censo);
  for (const k of ['vivos', 'latentes', 'muertos', 'rotos']) {
    if (!Number.isInteger(c[k]) || /** @type {number} */ (c[k]) < 0) return false;
  }
  if (!Array.isArray(p.barrios) || !Array.isArray(p.titulares) || !Array.isArray(p.pendientes)) {
    return false;
  }
  if (p.titulares.length > 5) return false;
  for (const t of p.titulares) {
    if (typeof t !== 'string') return false;
  }
  for (const b of p.barrios) {
    if (b == null || typeof b !== 'object') return false;
    const bb = /** @type {Record<string, unknown>} */ (b);
    if (typeof bb.id !== 'string' || !bb.id) return false;
    if (!ESTADOS_BARRIO.includes(/** @type {string} */ (bb.estado))) return false;
    if (!DELTAS_BARRIO.includes(/** @type {string} */ (bb.delta))) return false;
    if (!Number.isInteger(bb.gentesActivas) || /** @type {number} */ (bb.gentesActivas) < 0) {
      return false;
    }
  }
  for (const pend of p.pendientes) {
    if (pend == null || typeof pend !== 'object') return false;
    const pp = /** @type {Record<string, unknown>} */ (pend);
    if (typeof pp.barrioId !== 'string' || typeof pp.texto !== 'string') return false;
  }
  return true;
}

/**
 * @returns {ParteEstado}
 */
export function estadoVacio() {
  return { tick: 0, barrios: {} };
}
