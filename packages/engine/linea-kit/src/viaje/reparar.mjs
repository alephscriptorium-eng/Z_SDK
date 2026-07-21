/**
 * Minimal Z10 wiring: toy repair voyage for a broken barrio.
 * Consumes runViaje + createLineaGraphSource; does not reopen viaje core.
 */

import { createLineaGraphSource } from './adapters/linea.mjs';
import { runViaje } from './run.mjs';

/**
 * Viaje de juguete R0→R2 que, al completarse, señala reparación lista.
 * El caller (pack ciudad) aplica `completarReparacion` al recibir ok.
 *
 * @param {{
 *   barrioId: string,
 *   viajeId?: string,
 *   cacheDir?: string
 * }} opts
 * @returns {Promise<{
 *   ok: boolean,
 *   barrioId: string,
 *   reparacion: boolean,
 *   path?: string[],
 *   recorrido?: object,
 *   error?: string,
 *   rule?: string
 * }>}
 */
export async function runViajeReparacionJuguete(opts) {
  const barrioId = opts?.barrioId;
  if (typeof barrioId !== 'string' || !barrioId.trim()) {
    return {
      ok: false,
      barrioId: '',
      reparacion: false,
      error: 'barrioId_requerido',
      rule: 'viaje.reparar.args'
    };
  }
  const id = opts.viajeId ?? `reparar-${barrioId.trim()}`;
  const source = createLineaGraphSource({
    nodoIds: ['R0', 'R1', 'R2'],
    labels: { R0: 'rota', R1: 'taller', R2: 'acta' }
  });
  const result = await runViaje({
    id,
    origin: 'R0',
    destination: 'R2',
    source,
    cacheDir: opts.cacheDir,
    curation_status: 'candidate',
    segment: false
  });
  if (!result.ok) {
    return {
      ok: false,
      barrioId: barrioId.trim(),
      reparacion: false,
      error: result.error,
      rule: result.rule,
      recorrido: result.recorrido
    };
  }
  return {
    ok: true,
    barrioId: barrioId.trim(),
    reparacion: true,
    path: result.path,
    recorrido: result.recorrido
  };
}
