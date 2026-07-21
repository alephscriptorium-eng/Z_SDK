/**
 * @zeus/parte-kit — mensaje común de plaza (ParteDeCiudad v1).
 * Rol lectura: calculadora determinista; sin LLM; sin domain reducer.
 */

export {
  PARTE_VERSION,
  ESTADOS_BARRIO,
  DELTAS_BARRIO,
  LEDGER_PARTE,
  LEDGER_PARTE_RECHAZADO,
  isParteDeCiudadShaped,
  estadoVacio
} from './tipos.mjs';

export { redactarParte } from './redactar.mjs';
export { renderProsa } from './render.mjs';
export {
  validarParte,
  blobParte,
  patronCegueraDesdeEnv
} from './validar.mjs';
export {
  mensajeParte,
  mensajeParteRechazado,
  intentarPublicarParte
} from './publicar.mjs';
export {
  estadoDesdeCenso,
  deltasDesdeMockWork,
  deltasDesdeStatePatch
} from './from-mock.mjs';
export { PLANTILLAS, PLANTILLAS_PENDIENTE, applyPlantilla } from './plantillas.mjs';
export {
  CLASES_CAMPANA,
  claseTitular,
  campanasDesdeParte,
  campanasPlantillasOk
} from './campanas.mjs';
