/** Types for `@zeus/acta-kit` (U246 / ZT02). */

export {
  ACTA_VERSION,
  ESTADOS_BARRIO,
  CLASES_JUGADOR,
  RESUMEN_MAX,
  LEDGER_ACTA,
  LEDGER_ACTA_RECHAZADA,
  isActaDeBarrioShaped
} from './tipos.d.ts';
export type { EstadoBarrio, ClaseJugador, ActaDeBarrio } from './tipos.d.ts';

export { emitirActa } from './emitir.d.ts';
export type { EmitirActaInput } from './emitir.d.ts';

export { validarActa, blobActa, patronCegueraDesdeEnv } from './validar.d.ts';
export type { ValidarActaResult } from './validar.d.ts';

export {
  mensajeActa,
  mensajeActaRechazada,
  intentarPublicarActa
} from './publicar.d.ts';
export type {
  PublicarMeta,
  MensajeLedgerActa,
  IntentarPublicarOpts,
  IntentarPublicarResult
} from './publicar.d.ts';

export { adoptarActaDesdePlaza, actaDesdeEntry } from './adoptar.d.ts';
export type { AdoptarActaResult } from './adoptar.d.ts';

export { huellaLedger } from './huella.d.ts';
