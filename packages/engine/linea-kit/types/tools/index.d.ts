/**
 * Declarations for `@zeus/linea-kit/tools` (src/tools/index.mjs).
 * Dramaturg segmentation tools (node-only). WP-U81.
 *
 * Mirrors `src/tools/index.mjs` name for name. `src/tools/fs-util.mjs` is
 * deliberately absent: it is internal and this barrel does not re-export it.
 */

export { crearLinea, materializarTronco, defaultScaffoldNodos } from './crear-linea.js';
export type {
  CrearLineaOk,
  CrearLineaOptions,
  MaterializarTroncoOk,
  MaterializarTroncoOptions,
  NodoInput,
  NodosDocumentInput
} from './crear-linea.js';

export { segmentar, segmentarHistorial } from './segmentar.js';
export type {
  RawRegistro,
  SegmentarHistorialOk,
  SegmentarHistorialOptions,
  SegmentarOk,
  SegmentarOptions
} from './segmentar.js';
/** `SegmentarOk.manifest` and `SegmentarHistorialOk.manifest` are of this type. */
export type { ManifestSatelite, Registro } from '../model.js';

export { conectarSatelite } from './conectar-satelite.js';
export type {
  ConectarSateliteOk,
  ConectarSateliteOptions,
  McpSateliteConfig,
  McpServerStub,
  RemotesDocument
} from './conectar-satelite.js';

export { fetchSnapshot } from './fetch.js';
export type { FetchSnapshotOk, FetchSnapshotOptions } from './fetch.js';

export { segmentarForce, computeCoverage } from './segmentar-force.js';
export type {
  CoverageReport,
  ForceCardDocument,
  ForceManifest,
  LineRange,
  ManifestScene,
  SceneDef,
  SceneLayer,
  SegmentarForceOk,
  SegmentarForceOptions
} from './segmentar-force.js';

export { crearCotas } from './crear-cotas.js';
export type {
  CotaBound,
  CotaDocument,
  CotaManifest,
  CotaPole,
  CrearCotasOk,
  CrearCotasOptions
} from './crear-cotas.js';

export {
  applyMilestoneRules,
  MILESTONE_RULES,
  DEFAULT_BYTE_DELTA_THRESHOLD,
  DEFAULT_MILESTONE_KEYWORDS
} from './milestone-rules.js';
export type {
  MilestoneContext,
  MilestoneOptions,
  MilestoneRule,
  MilestoneVerdict
} from './milestone-rules.js';

export type { KitFailure, ValidationIssue, ValidationResult } from '../common.js';
