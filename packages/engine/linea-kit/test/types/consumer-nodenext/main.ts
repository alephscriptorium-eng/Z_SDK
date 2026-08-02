/**
 * WP-U245 · CA1 — one real TypeScript consumer that imports THE TEN subpaths
 * of `@zeus/linea-kit` and uses a value from each, under
 * `module`/`moduleResolution: NodeNext`, `strict`, `noImplicitAny`.
 *
 * If a subpath's `types` condition were missing or dangling, the import below
 * would be an error under NodeNext — that is the measurement.
 */

// 1/10 · root
import {
  CURATION_STATUSES,
  normalizeCurationStatus,
  resolveNodo,
  forceAnchorTrackRef
} from '@zeus/linea-kit';
// 2/10 · ./curation
import {
  isCurationStatus,
  isCanonStatus,
  isCuratedSidecarPath,
  curationStatusFromCorpus,
  readCurationStatus,
  CURATION_STATUS_KEYS
} from '@zeus/linea-kit/curation';
import type { CurationStatus } from '@zeus/linea-kit/curation';
// 3/10 · ./resolve
import {
  parseWpTimestamp,
  slimRegistro,
  buildSectionIndex,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings
} from '@zeus/linea-kit/resolve';
import type {
  Coverage,
  LineaInstance,
  NodoEntry,
  Registro,
  SatelliteIndex,
  SlimRegistro
} from '@zeus/linea-kit/resolve';
// 4/10 · ./force-activation
import {
  normalizeForceRegistry,
  initialActiveForces,
  cotasSnapshot,
  explainActivate,
  explainDeactivate,
  applyActivate,
  applyDeactivate
} from '@zeus/linea-kit/force-activation';
import type { ForceRegistryView } from '@zeus/linea-kit/force-activation';
// 5/10 · ./validate
import {
  SCHEMAS_DIR,
  SCHEMA_FILES,
  loadSchemaObjects,
  validate,
  validateFile,
  readJsonFile,
  readYamlFile,
  resolveVolumesRoot,
  validateVolumesTree
} from '@zeus/linea-kit/validate';
import type { SchemaId, ValidationResult } from '@zeus/linea-kit/validate';
// 6/10 · ./loader
import {
  loadLineaData,
  rescanSatelliteCache,
  readWikitext,
  readRegistro,
  loadForcesData,
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene,
  classifyPairsWith
} from '@zeus/linea-kit/loader';
import type { ForcesData, LineaData } from '@zeus/linea-kit/loader';
// 7/10 · ./tools
import {
  crearLinea,
  materializarTronco,
  defaultScaffoldNodos,
  segmentar,
  segmentarHistorial,
  conectarSatelite,
  fetchSnapshot,
  segmentarForce,
  computeCoverage,
  crearCotas,
  applyMilestoneRules,
  MILESTONE_RULES,
  DEFAULT_BYTE_DELTA_THRESHOLD,
  DEFAULT_MILESTONE_KEYWORDS
} from '@zeus/linea-kit/tools';
import type { NodoInput, RawRegistro, SceneDef } from '@zeus/linea-kit/tools';
// 8/10 · ./starterkits
import {
  createLineaJuguete,
  toyHistorialRegistros,
  createForceJuguete
} from '@zeus/linea-kit/starterkits';
// 9/10 · ./viaje
import {
  VIAJE_ETAPAS,
  VIAJE_TRANSICIONES,
  isViajeEtapa,
  canTransition,
  assertGraphSource,
  planPath,
  enrichPasosWithCandidates,
  buildRecorrido,
  materializeRecorrido,
  normalizeTreeJson,
  advanceEtapa,
  segmentarViaje,
  runViaje,
  createLineaGraphSource,
  nodoIdsFromTrunk,
  createWikiGraphSource,
  createGamemapGraphSource,
  viajeToWalkIntents,
  acceptWalks,
  runViajeReparacionJuguete
} from '@zeus/linea-kit/viaje';
import type { GraphSource, ViajeEtapa, WalkIntent } from '@zeus/linea-kit/viaje';
// 10/10 · ./schemas/* (wildcard subpath, one declaration per shipped document)
// `with { type: 'json' }` is MANDATORY: the runtime target is the literal
// `.json` file and Node raises ERR_IMPORT_ATTRIBUTE_MISSING without it.
// TypeScript does not enforce it here — resolving through the declaration
// switches TS1543 off — so the attribute is part of the documented contract
// and test/json-import-attribute.test.mjs pins it at runtime.
import volumesSchema from '@zeus/linea-kit/schemas/volumes.json' with { type: 'json' };
import curationStatusSchema from '@zeus/linea-kit/schemas/curation-status.json' with { type: 'json' };
import viajeRecorridoSchema from '@zeus/linea-kit/schemas/viaje-recorrido.json' with { type: 'json' };
import forceRegistrySchema from '@zeus/linea-kit/schemas/force-registry.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// 1 · root barrel
// ---------------------------------------------------------------------------
export const firstStatus: CurationStatus | undefined = CURATION_STATUSES[0];
export const normalized: CurationStatus | null = normalizeCurationStatus('CANON');

const nodos: Record<string, NodoEntry> = {
  N01: { id: 'N01', año_ini: 1900, año_fin: 1950, etiqueta: 'uno' }
};
const coverage: Coverage = { min: 1900, max: 2000 };
const nodoResult = resolveNodo({ nodos, coverage }, 1920);
export const nodoLabel: string =
  nodoResult.error !== undefined
    ? nodoResult.error
    : (nodoResult.nodo.etiqueta ?? nodoResult.nodo.id);

export const trackUri: string | null = forceAnchorTrackRef('f1', 'sesion-01/01-a')?.uri ?? null;

// ---------------------------------------------------------------------------
// 2 · ./curation
// ---------------------------------------------------------------------------
declare const someValue: unknown;
export const narrowedStatus: CurationStatus | 'unknown' = isCurationStatus(someValue)
  ? someValue
  : 'unknown';
export const canon: boolean = isCanonStatus('curated');
export const sidecar: boolean = isCuratedSidecarPath('demo/registros/r1/registro.md');
export const fromCorpus: CurationStatus | null = curationStatusFromCorpus('triaged');
export const fromRecord: CurationStatus | null = readCurationStatus({ delta_status: 'draft' });
export const statusKeys: number = CURATION_STATUS_KEYS.length;

// ---------------------------------------------------------------------------
// 3 · ./resolve
// ---------------------------------------------------------------------------
export const parsed: number | null = parseWpTimestamp('20:30 24 jun 2026');
const registro: Registro = { id: 'r1', oldid: 42, section: 'Intro', timestamp: '1 ene 1900' };
const slim: SlimRegistro = slimRegistro(registro);
export const bySection: Record<string, SlimRegistro[]> = buildSectionIndex([slim]);

declare const satellite: SatelliteIndex;
declare const instance: LineaInstance;

const parte = resolveParte(instance, 'I');
export const parteId: string = parte.error !== undefined ? '' : parte.id;

const oldid = resolveOldid(satellite, 1950);
export const oldidValue: number = oldid.error !== undefined ? -1 : oldid.oldid;

const listing = resolveRegistrosForNodo(instance, 'N01', { limit: 5, milestonesOnly: true });
export const listedCount: number = listing.error !== undefined ? 0 : listing.total;

const byYear = resolveRegistrosForYear(instance, 1920);
export const yearCount: number = byYear.error !== undefined ? 0 : byYear.registros.length;

const audit = validateNodoSectionMappings(instance);
export const auditKinds: string[] =
  audit.error !== undefined ? [] : audit.issues.map((issue) => issue.kind);

// ---------------------------------------------------------------------------
// 4 · ./force-activation
// ---------------------------------------------------------------------------
const view: ForceRegistryView = normalizeForceRegistry({
  boot: 'b1',
  activation: { session_budget: { max_active_forces: 3 } },
  forces: [{ id: 'b1' }]
});
export const active: string[] = initialActiveForces(view);
export const pole: 'colapso' | 'victoria' | 'entre' = cotasSnapshot(view, { t: 0.5 }).pole;

const wouldActivate = explainActivate(view, active, 'f2');
export const activateVerdict: string = wouldActivate.ok ? wouldActivate.force.id : wouldActivate.error;
const wouldDeactivate = explainDeactivate(view, active, 'b1');
export const deactivateVerdict: string = wouldDeactivate.ok
  ? wouldDeactivate.force.id
  : wouldDeactivate.error;
const applied = applyActivate(view, active, 'f2');
export const appliedActive: string[] = applied.ok ? applied.active : [];
const undone = applyDeactivate(view, active, 'f2');
export const undoneActive: string[] = undone.ok ? undone.active : [];

// ---------------------------------------------------------------------------
// 5 · ./validate
// ---------------------------------------------------------------------------
export const schemasDir: string = SCHEMAS_DIR;
const volumesFile: string = SCHEMA_FILES.volumes;
export const schemaFileName: string = volumesFile;
export const schemaCount: number = loadSchemaObjects().size;
const validation: ValidationResult = validate('registro', registro);
export const validationOk: boolean = validation.ok;
export const firstIssue: string | undefined = validation.errors?.[0]?.message;
export const filePathBack: string = validateFile('volumes', '/tmp/volumes.json').path;
export const rawJson: unknown = readJsonFile('/tmp/volumes.json');
export const rawYaml: unknown = readYamlFile('/tmp/registry.yaml');
export const volumesRoot: string = resolveVolumesRoot({ volumesRoot: '/tmp/VOLUMES' });
export const treeSkipped: string[] = validateVolumesTree({ sampleRegistros: 1 }).skipped;
const knownId: SchemaId = 'manifest-tronco';
export const knownSchemaId: SchemaId = knownId;

// ---------------------------------------------------------------------------
// 6 · ./loader
// ---------------------------------------------------------------------------
export async function loaderSurface(): Promise<string[]> {
  const data: LineaData = await loadLineaData('/tmp/LINEAS');
  const stats = await rescanSatelliteCache(satellite);
  const wikitext = await readWikitext(satellite, 190);
  const sidecars = await readRegistro(satellite, 'r1');
  const forces: ForcesData = await loadForcesData('/tmp/FORCES');
  const registryView = buildForcesRegistryView(forces);
  const one = resolveForce(forces, 'f1');
  const scene = await resolveForceScene(forces, 'f1', 'sesion-01', '01-a');
  const pairs = classifyPairsWith(['linea:demo', 'cota:sima'], { localIds: new Set(['sima']) });
  return [
    data.basePath,
    String(stats.coverage_pct),
    wikitext.cached === true ? wikitext.wikitext : (wikitext.error ?? ''),
    sidecars.error ?? sidecars.registro_id,
    String(registryView.force_count),
    one.error ?? one.id,
    scene.error ?? scene.scene_key,
    ...pairs.pending_refs.map((r) => r.reason)
  ];
}

// ---------------------------------------------------------------------------
// 7 · ./tools
// ---------------------------------------------------------------------------
const scaffold: NodoInput[] = defaultScaffoldNodos();
const created = crearLinea({ id: 'demo', lineasRoot: '/tmp/LINEAS', nodos: scaffold });
export const createdDir: string = created.ok ? created.lineDir : created.rule;
const trunk = materializarTronco('/tmp/LINEAS/demo', {
  nodosDoc: { corpus: 'LINEAS/demo', partes: [{ id: 'I', nodos: ['N01'] }] }
});
export const trunkNodos: number = trunk.ok ? trunk.nodoCount : -1;

const raw: RawRegistro[] = [{ oldid: 1, summary: 'seed', byte_delta: 900 }];
const inMemory = segmentarHistorial(raw, { corpus: 'demo' });
export const inMemoryMilestones: number = inMemory.ok ? inMemory.milestoneCount : -1;
const onDisk = segmentar({ satDir: '/tmp/sat', registros: raw, corpus: 'demo' });
export const onDiskCount: number = onDisk.ok ? onDisk.registroCount : -1;

const connected = conectarSatelite({ lineDir: '/tmp/LINEAS/demo', lineaId: 'demo' });
export const remoteTitle: string = connected.ok ? connected.remotes.remotes.wiki.title : '';

const fetched = fetchSnapshot({ satDir: '/tmp/sat', oldid: 1, wikitext: 'x', approve: true });
export const fetchedPath: string = fetched.ok ? fetched.wikitextPath : fetched.rule;

const scenes: SceneDef[] = [{ id: 's1', slug: '01-a', lines: [1, 2], prompt: [1, 1], output: 2 }];
export const coverageOk: boolean = computeCoverage(scenes, 2).ok;
const forceOut = segmentarForce({ outDir: '/tmp/f', forceId: 'f1', scenes, rawText: 'a\nb' });
export const forceScenes: number = forceOut.ok ? forceOut.scene_count : -1;
const cota = crearCotas({ outDir: '/tmp/c', id: 'sima' });
export const cotaPole: string = cota.ok ? cota.pole : cota.rule;

export const milestoneReasons: string[] = applyMilestoneRules(registro, {
  byteDeltaThreshold: DEFAULT_BYTE_DELTA_THRESHOLD,
  keywords: [...DEFAULT_MILESTONE_KEYWORDS]
}).milestone_reasons;
export const ruleIds: string[] = MILESTONE_RULES.map((r) => r.id);

// ---------------------------------------------------------------------------
// 8 · ./starterkits
// ---------------------------------------------------------------------------
const toyLine = createLineaJuguete({ lineasRoot: '/tmp/LINEAS', fetchSample: false });
export const toyLineDir: string = toyLine.ok ? toyLine.lineDir : toyLine.rule;
export const toyRegistros: number = toyHistorialRegistros().length;
const toyForce = createForceJuguete({ forcesRoot: '/tmp/FORCES' });
export const toyForceDir: string = toyForce.ok ? toyForce.forceDir : toyForce.rule;

// ---------------------------------------------------------------------------
// 9 · ./viaje
// ---------------------------------------------------------------------------
export const etapaCount: number = VIAJE_ETAPAS.length;
export const fromIdle: readonly ViajeEtapa[] = VIAJE_TRANSICIONES.idle;
export const isEtapa: boolean = isViajeEtapa('planning');
export const canGo: boolean = canTransition('idle', 'planning');

const source: GraphSource = createLineaGraphSource({ nodoIds: ['R0', 'R1', 'R2'] });
export const sourceOk: boolean = assertGraphSource(source).ok;
export const trunkIds: string[] = nodoIdsFromTrunk({ nodos: [{ id: 'R0' }] });
// The loose overload: ids whose type nothing promises come back `unknown[]`.
export const looseIds: unknown[] = nodoIdsFromTrunk({ nodos: [{ id: 42 }] });

const wiki = createWikiGraphSource({ links: { A: ['B'] }, satDir: '/tmp/sat', approve: true });
export const wikiKind: 'wiki' = wiki.kind;
const gamemap: GraphSource = createGamemapGraphSource({ streets: { p1: ['p2'] } });
export const gamemapKind: string = gamemap.kind;

const draft = buildRecorrido({ id: 'v1', origin: 'R0', destination: 'R2', source_kind: 'linea' });
export const draftEtapa: string = draft.ok ? draft.recorrido.etapa : draft.rule;
const advanced = advanceEtapa(draft.ok ? draft.recorrido : { id: 'v1', origin: 'a', destination: 'b' }, 'planning');
export const advancedOk: boolean = advanced.ok;
const normalizedTree = normalizeTreeJson({ path: ['A', 'B'], nodes: { A: { links: ['B'] } } });
export const normalizedOk: boolean = normalizedTree.ok;
const segmented = segmentarViaje(draft.ok ? draft.recorrido : { id: 'v', origin: 'a', destination: 'b' });
export const segmentedOk: boolean = segmented.ok;

export async function viajeSurface(): Promise<string[]> {
  const planned = await planPath(source, 'R0', 'R2', { maxDepth: 8, prune: ['R1'] });
  if (!planned.ok) return [planned.error];
  const enriched = await enrichPasosWithCandidates(source, planned.pasos);
  const run = await runViaje({ id: 'v1', origin: 'R0', destination: 'R2', source, segment: true });
  const written = materializeRecorrido({
    cacheDir: '/tmp/cache',
    recorrido: run.ok ? run.recorrido : { id: 'v1', origin: 'R0', destination: 'R2' }
  });
  const repaired = await runViajeReparacionJuguete({ barrioId: 'b1' });
  const walks = viajeToWalkIntents(run.ok ? run.recorrido : { id: 'v', origin: 'a', destination: 'b' });
  const accepted = walks.ok ? acceptWalks(walks.walks) : walks;
  const firstWalk: WalkIntent | undefined = walks.ok ? walks.walks[0] : undefined;
  return [
    ...planned.path,
    ...enriched.map((p) => `${p.from}->${p.to}`),
    run.ok ? run.recorrido.id : run.rule,
    written.ok ? written.path : written.rule,
    repaired.error ?? String(repaired.reparacion),
    accepted.ok ? 'accepted' : accepted.error,
    firstWalk ? firstWalk.kind : 'none'
  ];
}

// ---------------------------------------------------------------------------
// 10 · ./schemas/* — the documents themselves, not the data they validate
// ---------------------------------------------------------------------------
export const volumesId: string = volumesSchema.$id;
export const curationTitle: string = curationStatusSchema.title;
export const viajeType: string = viajeRecorridoSchema.type;
export const forceRegistryDescription: string = forceRegistrySchema.description;
export const unknownKeyword: unknown = volumesSchema.properties;
