/**
 * ActaDeBarrio v1 — contrato congelado (SEMILLA-ARG §A3).
 * No inventar campos fuera de este shape.
 *
 * @typedef {'vivo'|'latente'|'muerto'|'roto'} EstadoBarrio
 * @typedef {'residente'|'visitante'|'flujo'} ClaseJugador
 *
 * @typedef {object} ActaDeBarrio
 * @property {'acta/1'} version
 * @property {string} barrioId
 * @property {EstadoBarrio} estado
 * @property {string} resumen
 * @property {string[]} pendientes
 * @property {ClaseJugador} ultimaClase
 * @property {number} tickEmision
 * @property {string} huellaLedger
 */

export const ACTA_VERSION = 'acta/1';

export const ESTADOS_BARRIO = Object.freeze([
  'vivo',
  'latente',
  'muerto',
  'roto'
]);

export const CLASES_JUGADOR = Object.freeze([
  'residente',
  'visitante',
  'flujo'
]);

/** Máx chars de `resumen` (contrato §A3). */
export const RESUMEN_MAX = 400;

/** entryKind ledger en canal plaza existente (cero canal nuevo). */
export const LEDGER_ACTA = 'acta';
export const LEDGER_ACTA_RECHAZADA = 'acta_rechazada';

/**
 * @param {unknown} value
 * @returns {value is ActaDeBarrio}
 */
export function isActaDeBarrioShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const a = /** @type {Record<string, unknown>} */ (value);
  if (a.version !== ACTA_VERSION) return false;
  if (typeof a.barrioId !== 'string' || !a.barrioId) return false;
  if (!ESTADOS_BARRIO.includes(/** @type {string} */ (a.estado))) return false;
  if (typeof a.resumen !== 'string') return false;
  if (a.resumen.length > RESUMEN_MAX) return false;
  if (!Array.isArray(a.pendientes)) return false;
  for (const p of a.pendientes) {
    if (typeof p !== 'string') return false;
  }
  if (!CLASES_JUGADOR.includes(/** @type {string} */ (a.ultimaClase))) return false;
  if (!Number.isInteger(a.tickEmision)) return false;
  if (typeof a.huellaLedger !== 'string' || !a.huellaLedger) return false;
  return true;
}
