/**
 * @zeus/linea-kit/viaje — origin→destination path manager over GraphSource.
 *
 * Glossary: «viaje» = graph path (this module). Historical linea-system prompts
 * that meant «cache-fill campaign» are a known homonym; rename to «campaña» when
 * those prompts are next touched — not in this export surface.
 *
 * Concept: graph path navigation (candidates, choice, prune, path cache).
 * Wiki fetch uses kit `fetchSnapshot` + approve gate (no browser scraper).
 */

export {
  VIAJE_ETAPAS,
  VIAJE_TRANSICIONES,
  isViajeEtapa,
  canTransition
} from './etapas.mjs';

export { assertGraphSource } from './graph-source.mjs';

export { planPath, enrichPasosWithCandidates } from './plan.mjs';

export {
  buildRecorrido,
  materializeRecorrido,
  normalizeTreeJson,
  advanceEtapa
} from './cache.mjs';

export { segmentarViaje } from './segmentar-viaje.mjs';

export { runViaje } from './run.mjs';

export {
  createLineaGraphSource,
  nodoIdsFromTrunk
} from './adapters/linea.mjs';

export { createWikiGraphSource } from './adapters/wiki.mjs';

export {
  createGamemapGraphSource,
  viajeToWalkIntents,
  acceptWalksPozo
} from './adapters/gamemap.mjs';
