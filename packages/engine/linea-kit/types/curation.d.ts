/**
 * Declarations for `@zeus/linea-kit/curation` (src/curation.mjs).
 * Unified curation chain (DATOS.md §2 / D-15). Browser-safe.
 */

/**
 * The unified chain. Promised twice over: the runtime freezes exactly these
 * eleven tokens, and `schemas/curation-status.json` declares the same enum.
 */
export type CurationStatus =
  | 'raw'
  | 'candidate'
  | 'pending'
  | 'draft'
  | 'triaged'
  | 'labeled'
  | 'curated'
  | 'canon'
  | 'rumor'
  | 'proposal'
  | 'discarded';

/** Object keys that may carry a curation status. */
export type CurationStatusKey =
  | 'curation_status'
  | 'editorialStatus'
  | 'delta_status'
  | 'status'
  | 'labeled';

export declare const CURATION_STATUSES: readonly CurationStatus[];

export declare const CURATION_STATUS_KEYS: readonly CurationStatusKey[];

/**
 * Pure path predicate: in a LINEAS volume every `*.md` is a curated sidecar,
 * at every depth and under every name.
 */
export declare function isCuratedSidecarPath(relPath: string): boolean;

/**
 * Normalize a candidate status. `true` maps to `'labeled'`; anything the
 * alias table does not know maps to `null`.
 */
export declare function normalizeCurationStatus(value: unknown): CurationStatus | null;

/** Exact membership test over the frozen chain. */
export declare function isCurationStatus(value: unknown): value is CurationStatus;

/**
 * Terminal curated / canon states (`curated`, `canon`, `labeled`).
 * Not a type predicate: `true` normalizes to `'labeled'` and would make one.
 */
export declare function isCanonStatus(value: unknown): boolean;

/**
 * Read a curation status off a record using the known field aliases.
 * The record is `unknown`: no schema promises which alias a caller carries.
 */
export declare function readCurationStatus(record: unknown): CurationStatus | null;

/** Map a firehose corpus folder id onto the unified enum. */
export declare function curationStatusFromCorpus(corpusId: string): CurationStatus | null;
