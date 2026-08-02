/**
 * Declarations for `@zeus/linea-kit/viaje` (src/viaje/index.mjs).
 * Origin→destination path manager over a GraphSource.
 *
 * Mirrors `src/viaje/index.mjs` name for name.
 */

export { VIAJE_ETAPAS, VIAJE_TRANSICIONES, isViajeEtapa, canTransition } from './etapas.js';
export type { ViajeEtapa } from './etapas.js';

export { assertGraphSource } from './graph-source.js';
export type {
  GraphEdge,
  GraphNode,
  GraphSource,
  GraphSourceOk,
  GraphSourceRefusal
} from './graph-source.js';

export { planPath, enrichPasosWithCandidates } from './plan.js';
export type { Paso, PlanPathOk, PlanPathOptions, PlanPathRefusal } from './plan.js';

export {
  buildRecorrido,
  materializeRecorrido,
  normalizeTreeJson,
  advanceEtapa
} from './cache.js';
export type {
  BuildRecorridoOk,
  MaterializeRecorridoOk,
  MaterializeRecorridoOptions,
  NormalizeTreeOptions,
  ViajeDraft,
  ViajeRecorrido,
  ViajeSnapshot,
  ViajeSourceKind
} from './cache.js';

export { segmentarViaje } from './segmentar-viaje.js';
export type { SegmentarViajeOptions } from './segmentar-viaje.js';

export { runViaje } from './run.js';
export type {
  MaterializeNodeResult,
  RunViajeOk,
  RunViajeOptions,
  RunViajeRefusal
} from './run.js';

export { createLineaGraphSource, nodoIdsFromTrunk } from './adapters/linea.js';
export type { LineaGraphSourceOptions } from './adapters/linea.js';

export { createWikiGraphSource } from './adapters/wiki.js';
export type {
  WikiGraphSource,
  WikiGraphSourceOptions,
  WikiNodePayload
} from './adapters/wiki.js';

export {
  createGamemapGraphSource,
  viajeToWalkIntents,
  acceptWalks
} from './adapters/gamemap.js';
export type {
  AcceptWalksOk,
  AcceptWalksRefusal,
  GamemapGraphSourceOptions,
  WalkIntent,
  WalkIntentsOk,
  WalkIntentsOptions,
  WalkIntentsRefusal
} from './adapters/gamemap.js';

export { runViajeReparacionJuguete } from './reparar.js';
export type { ReparacionOptions, ReparacionResult } from './reparar.js';

export type { KitFailure } from '../common.js';
