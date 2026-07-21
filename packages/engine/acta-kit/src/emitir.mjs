/**
 * emitirActa — firma pura: tick y huella entran como input.
 */

import {
  ACTA_VERSION,
  ESTADOS_BARRIO,
  CLASES_JUGADOR,
  RESUMEN_MAX,
  isActaDeBarrioShaped
} from './tipos.mjs';

/**
 * @param {{
 *   barrioId: string,
 *   estado: import('./tipos.mjs').EstadoBarrio,
 *   resumen: string,
 *   pendientes?: string[],
 *   ultimaClase: import('./tipos.mjs').ClaseJugador,
 *   tickEmision: number,
 *   huellaLedger: string
 * }} input
 * @returns {import('./tipos.mjs').ActaDeBarrio}
 */
export function emitirActa(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('emitirActa: input_requerido');
  }
  if (typeof input.barrioId !== 'string' || !input.barrioId.trim()) {
    throw new Error('emitirActa: barrioId_requerido');
  }
  if (!ESTADOS_BARRIO.includes(input.estado)) {
    throw new Error('emitirActa: estado_invalido');
  }
  if (typeof input.resumen !== 'string') {
    throw new Error('emitirActa: resumen_requerido');
  }
  if (input.resumen.length > RESUMEN_MAX) {
    throw new Error('emitirActa: resumen_excede_400');
  }
  if (!CLASES_JUGADOR.includes(input.ultimaClase)) {
    throw new Error('emitirActa: ultimaClase_invalida');
  }
  if (!Number.isInteger(input.tickEmision)) {
    throw new Error('emitirActa: tickEmision_requerido');
  }
  if (typeof input.huellaLedger !== 'string' || !input.huellaLedger) {
    throw new Error('emitirActa: huellaLedger_requerida');
  }
  const pendientes = Array.isArray(input.pendientes)
    ? input.pendientes.map((p) => String(p))
    : [];

  const acta = {
    version: ACTA_VERSION,
    barrioId: input.barrioId.trim(),
    estado: input.estado,
    resumen: input.resumen,
    pendientes,
    ultimaClase: input.ultimaClase,
    tickEmision: input.tickEmision,
    huellaLedger: input.huellaLedger
  };
  if (!isActaDeBarrioShaped(acta)) {
    throw new Error('emitirActa: shape_invalido');
  }
  return acta;
}
