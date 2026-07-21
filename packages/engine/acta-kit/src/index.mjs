/**
 * @zeus/acta-kit — ActaDeBarrio v1 via plaza ledger.
 * Pure emit; adopt from plaza; no LLM; no new channel.
 */

export {
  ACTA_VERSION,
  ESTADOS_BARRIO,
  CLASES_JUGADOR,
  RESUMEN_MAX,
  LEDGER_ACTA,
  LEDGER_ACTA_RECHAZADA,
  isActaDeBarrioShaped
} from './tipos.mjs';

export { emitirActa } from './emitir.mjs';
export { validarActa, blobActa, patronCegueraDesdeEnv } from './validar.mjs';
export {
  mensajeActa,
  mensajeActaRechazada,
  intentarPublicarActa
} from './publicar.mjs';
export { adoptarActaDesdePlaza, actaDesdeEntry } from './adoptar.mjs';
export { huellaLedger } from './huella.mjs';
