/**
 * Fixtures ActaDeBarrio v1 (sin tokens de método).
 */

import { emitirActa } from '../src/emitir.mjs';
import { huellaLedger } from '../src/huella.mjs';

/**
 * @param {Partial<import('../src/tipos.mjs').ActaDeBarrio>} [overrides]
 */
export function actaLimpia(overrides = {}) {
  const barrioId = overrides.barrioId ?? 'blockly-editor';
  const huella =
    overrides.huellaLedger ??
    huellaLedger({ kind: 'wake', barrioId, seq: 1 });
  return emitirActa({
    barrioId,
    estado: overrides.estado ?? 'latente',
    resumen:
      overrides.resumen ??
      'Barrio blockly-editor listo para relevo. Pendiente: ping tool.',
    pendientes: overrides.pendientes ?? ['barrio.ping'],
    ultimaClase: overrides.ultimaClase ?? 'residente',
    tickEmision: overrides.tickEmision ?? 7,
    huellaLedger: huella
  });
}
