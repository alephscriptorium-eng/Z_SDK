/**
 * WP-U245 · CA2 — the SECOND consumer, deliberately on a different axis from
 * `consumer-nodenext`.
 *
 * A root-only consumer would add nothing: `@zeus/linea-kit` re-exports only
 * the browser-safe third of its surface from `.`, so importing the root alone
 * would leave seven subpaths unmeasured while re-measuring nothing new. The
 * axis chosen instead is the RESOLUTION MODE plus four strictness flags that
 * `consumer-nodenext` does not enable:
 *
 *   - `moduleResolution: bundler` + `module: Preserve`
 *       the `types` condition has to be picked up by the bundler condition
 *       set, not just by NodeNext;
 *   - `verbatimModuleSyntax`
 *       every value import below must really be a VALUE export of the
 *       declarations — a name accidentally declared as a type would fail here
 *       and pass under `consumer-nodenext`;
 *   - `exactOptionalPropertyTypes`
 *       `foo?: T` and `foo?: T | undefined` stop being interchangeable;
 *   - `noUncheckedIndexedAccess` + `noPropertyAccessFromIndexSignature`
 *       every index signature this package declares must be honest about
 *       returning `undefined`, and must be read with bracket access.
 *
 * It also enters through the ROOT barrel wherever the root re-exports the
 * symbol, and only falls back to a subpath for what the root does not carry.
 */

// Root barrel: everything `src/index.mjs` re-exports.
import {
  CURATION_STATUSES,
  CURATION_STATUS_KEYS,
  normalizeCurationStatus,
  isCurationStatus,
  isCanonStatus,
  readCurationStatus,
  curationStatusFromCorpus,
  isCuratedSidecarPath,
  parseWpTimestamp,
  slimRegistro,
  buildSectionIndex,
  resolveNodo,
  resolveParte,
  resolveOldid,
  resolveRegistrosForNodo,
  resolveRegistrosForYear,
  validateNodoSectionMappings,
  normalizeForceRegistry,
  initialActiveForces,
  forceAnchorTrackRef,
  cotasSnapshot,
  explainActivate,
  explainDeactivate,
  applyActivate,
  applyDeactivate
} from '@zeus/linea-kit';
import type {
  CurationStatus,
  ForceRegistryView,
  LineaInstance,
  NodoEntry,
  Registro,
  RegistroItem,
  SatelliteIndex
} from '@zeus/linea-kit';

// The nine remaining subpaths — type-only where the root already has the value.
import type { CurationStatusKey } from '@zeus/linea-kit/curation';
import type { ResolvedNodo, ResolveError } from '@zeus/linea-kit/resolve';
import type { ForceCard, CotasSnapshot } from '@zeus/linea-kit/force-activation';
import { validate, SCHEMA_FILES } from '@zeus/linea-kit/validate';
import type { SchemaId } from '@zeus/linea-kit/validate';
import { classifyPairsWith } from '@zeus/linea-kit/loader';
import type { ForceCorpus, PendingRef } from '@zeus/linea-kit/loader';
import { computeCoverage, applyMilestoneRules } from '@zeus/linea-kit/tools';
import type { CoverageReport, MilestoneVerdict, SceneDef } from '@zeus/linea-kit/tools';
import { toyHistorialRegistros } from '@zeus/linea-kit/starterkits';
import type { CreateForceJugueteOptions } from '@zeus/linea-kit/starterkits';
import { isViajeEtapa, canTransition, acceptWalks, viajeToWalkIntents } from '@zeus/linea-kit/viaje';
import type {
  ShapeCheckedWalk,
  ViajeEtapa,
  ViajeRecorrido,
  WalkIntent
} from '@zeus/linea-kit/viaje';
import registroSchema from '@zeus/linea-kit/schemas/registro.json' with { type: 'json' };
import nodoMetaSchema from '@zeus/linea-kit/schemas/nodo-meta.json' with { type: 'json' };

// ---------------------------------------------------------------------------
// noUncheckedIndexedAccess: the declarations must admit the `undefined`.
// ---------------------------------------------------------------------------
export const maybeFirst: CurationStatus | undefined = CURATION_STATUSES[0];
export const maybeKey: CurationStatusKey | undefined = CURATION_STATUS_KEYS[0];

const nodos: Record<string, NodoEntry> = { N01: { id: 'N01', año_ini: 1900 } };
export const maybeNodo: NodoEntry | undefined = nodos['N01'];

// noPropertyAccessFromIndexSignature: an open document is read with brackets.
const registro: Registro = { id: 'r1', oldid: 7 };
export const openField: unknown = registro['some_extension_field'];
export const declaredField: number = registro.oldid;

// ---------------------------------------------------------------------------
// verbatimModuleSyntax: each of these must be a real value export.
// ---------------------------------------------------------------------------
export const curationValues = {
  normalize: normalizeCurationStatus,
  isStatus: isCurationStatus,
  isCanon: isCanonStatus,
  read: readCurationStatus,
  fromCorpus: curationStatusFromCorpus,
  isSidecar: isCuratedSidecarPath,
  parse: parseWpTimestamp,
  slim: slimRegistro,
  index: buildSectionIndex,
  nodo: resolveNodo,
  parte: resolveParte,
  oldid: resolveOldid,
  forNodo: resolveRegistrosForNodo,
  forYear: resolveRegistrosForYear,
  audit: validateNodoSectionMappings,
  normalizeForces: normalizeForceRegistry,
  initialForces: initialActiveForces,
  trackRef: forceAnchorTrackRef,
  cotas: cotasSnapshot,
  explainOn: explainActivate,
  explainOff: explainDeactivate,
  applyOn: applyActivate,
  applyOff: applyDeactivate,
  validate,
  classify: classifyPairsWith,
  coverage: computeCoverage,
  milestones: applyMilestoneRules,
  toy: toyHistorialRegistros,
  isEtapa: isViajeEtapa,
  canGo: canTransition,
  accept: acceptWalks,
  walks: viajeToWalkIntents
};

// ---------------------------------------------------------------------------
// exactOptionalPropertyTypes: optional members are never handed `undefined`.
// ---------------------------------------------------------------------------
declare const instance: LineaInstance;
declare const satellite: SatelliteIndex;

const nodoResult = resolveNodo(instance, 1920);
export const resolved: ResolvedNodo | null =
  nodoResult.error !== undefined ? null : nodoResult.nodo;
export const failure: ResolveError | null =
  nodoResult.error !== undefined ? nodoResult : null;

const listing = resolveRegistrosForNodo(instance, 'N01', { limit: 3 });
export const anchoredRow: RegistroItem | undefined =
  listing.error !== undefined ? undefined : listing.registros.find((row) => row.is_anchor);
export const listingYear = resolveRegistrosForYear(instance, 1920);
export const oldidRow = resolveOldid(satellite, 1950);
export const parteRow = resolveParte(instance, 'I');
export const auditRow = validateNodoSectionMappings(instance);
export const sectionBuckets = buildSectionIndex(satellite.registroIndex);
export const slimmed = slimRegistro(registro);
export const parsedMs: number | null = parseWpTimestamp('28 sep 2007');

// ---------------------------------------------------------------------------
// Discriminated unions must narrow on the declared discriminant.
// ---------------------------------------------------------------------------
declare const view: ForceRegistryView;
const verdict = explainActivate(view, ['b1'], 'f2');
export const activatedCard: ForceCard | null = verdict.ok ? verdict.force : null;
export const refusalToken: string | null = verdict.ok ? null : verdict.error;
export const snapshot: CotasSnapshot = cotasSnapshot(view, { collapsed: true });
export const bootSet: string[] = initialActiveForces(view);
export const normalizedView: ForceRegistryView = normalizeForceRegistry({
  activation: { session_budget: { max_active_forces: 1 } }
});
export const onOff = [
  explainDeactivate(view, ['b1'], 'b1'),
  applyActivate(view, [], 'f1'),
  applyDeactivate(view, ['f1'], 'f1')
];
export const anchorRef = forceAnchorTrackRef('f1', 'sesion-01/01-a');

// ---------------------------------------------------------------------------
// The remaining subpaths, exercised through their own types.
// ---------------------------------------------------------------------------
const schemaId: SchemaId = 'registro';
export const schemaFile: string = SCHEMA_FILES[schemaId];
export const validationErrors: number = validate(schemaId, registro).errors?.length ?? 0;

declare const corpus: ForceCorpus;
export const corpusAnchor: string | undefined = corpus.anchor_scene;
export const pending: PendingRef[] = classifyPairsWith(['linea:demo'], {
  mountedLineaIds: ['other']
}).pending_refs;

const scenes: SceneDef[] = [{ id: 's1', slug: '01-a', lines: [1, 3], think: 2 }];
export const report: CoverageReport = computeCoverage(scenes, 3);
// `applyMilestoneRules` takes `Record<string, unknown>`, not `unknown`: the
// rule table dereferences the record, so `null` / `undefined` would throw.
export const verdictRules: MilestoneVerdict = applyMilestoneRules(registro, {
  byteDeltaThreshold: 100,
  // A `Set`, never an array — the `editor` rule calls `.size` and `.has()`.
  editorAllowlist: new Set(['alice'])
});

export const toyCount: number = toyHistorialRegistros().length;
const forceOptions: CreateForceJugueteOptions = { forcesRoot: '/tmp/FORCES', withCotas: false };
export const forcesRoot: string = forceOptions.forcesRoot;

const etapa: ViajeEtapa = 'traversing';
export const etapaOk: boolean = isViajeEtapa(etapa) && canTransition(etapa, 'completed');
declare const recorrido: ViajeRecorrido;
// A recorrido reread from cache may carry bare pasos: the schema requires
// only `from` / `to`, so `via` and `chosen_from` are optional.
export const firstVia: string | null | undefined = recorrido.pasos[0]?.via;
export const firstChosen: string[] | undefined = recorrido.pasos[0]?.chosen_from;
const walkResult = viajeToWalkIntents(recorrido, { anchors: ['R0', 'R2'] });
export const firstWalk: WalkIntent | undefined = walkResult.ok ? walkResult.walks[0] : undefined;
// `acceptWalks` returns the input array untouched, so the result is typed by
// the INPUT. Given the `WalkIntent[]` that `viajeToWalkIntents` built — which
// really did set `hop` — the caller keeps its own stronger type.
export const acceptedWalks: WalkIntent[] = walkResult.ok
  ? (() => {
      const accepted = acceptWalks(walkResult.walks);
      return accepted.ok ? accepted.accepted : [];
    })()
  : [];

// Given anything the acceptor did not verify, it is honest about it: `from`
// and `to` come back `unknown`, and `hop` is not on the type at all, because
// the runtime never looked at either.
declare const untrustedWalks: unknown;
const acceptedUntrusted = acceptWalks(untrustedWalks);
export const untrustedFrom: unknown = acceptedUntrusted.ok
  ? acceptedUntrusted.accepted[0]?.from
  : acceptedUntrusted.error;
export const untrustedShape: ShapeCheckedWalk | undefined = acceptedUntrusted.ok
  ? acceptedUntrusted.accepted[0]
  : undefined;
export const recorridoOpenField: unknown = recorrido['extension_field'];

// The wildcard subpath, on the bundler condition set.
export const registroSchemaId: string = registroSchema.$id;
export const nodoMetaTitle: string = nodoMetaSchema.title;
export const nodoMetaRequired: unknown = nodoMetaSchema['required'];

// ---------------------------------------------------------------------------
// Blocker 4 · `meta.partes` entries promise NOTHING, not even `id`.
// The schema declares them as open objects with no declared property, so the
// compiler has to force a narrowing before every string operation.
// ---------------------------------------------------------------------------
export const parteIds: string[] = (instance.manifest.meta.partes ?? [])
  .map((parte) => parte.id)
  .filter((id): id is string => typeof id === 'string')
  .map((id) => id.toUpperCase());
