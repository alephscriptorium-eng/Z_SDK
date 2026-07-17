/**
 * @zeus/linea-kit/tools — dramaturg segmentation tools (node-only). WP-U81.
 */

export { crearLinea, materializarTronco, defaultScaffoldNodos } from './crear-linea.mjs';
export { segmentar, segmentarHistorial } from './segmentar.mjs';
export { conectarSatelite } from './conectar-satelite.mjs';
export { fetchSnapshot } from './fetch.mjs';
export { segmentarForce, computeCoverage } from './segmentar-force.mjs';
export { crearCotas } from './crear-cotas.mjs';
export {
  applyMilestoneRules,
  MILESTONE_RULES,
  DEFAULT_BYTE_DELTA_THRESHOLD,
  DEFAULT_MILESTONE_KEYWORDS
} from './milestone-rules.mjs';
