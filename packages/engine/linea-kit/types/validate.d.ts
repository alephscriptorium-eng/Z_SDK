/**
 * Declarations for `@zeus/linea-kit/validate` (src/validate.mjs).
 * JSON Schema validator over the documents shipped under `schemas/`. Node-only.
 */

import type { ValidationResult } from './common.js';

export type { JsonSchemaDocument, ValidationIssue, ValidationResult } from './common.js';

/** The nineteen schema ids accepted by `validate` / `validateFile`. */
export type SchemaId =
  | 'curation-status'
  | 'volumes'
  | 'lineas-registry'
  | 'nodos-document'
  | 'manifest-tronco'
  | 'nodo-meta'
  | 'manifest-satelite'
  | 'registro'
  | 'nodo-sections'
  | 'snapshot-meta'
  | 'cache-sidecar-meta'
  | 'ontology-seeds'
  | 'force'
  | 'cota'
  | 'force-registry'
  | 'force-manifest'
  | 'triage-manifest'
  | 'ssb-manifest'
  | 'viaje-recorrido';

/** Absolute path of the `schemas/` directory inside the installed package. */
export declare const SCHEMAS_DIR: string;

/** Schema id → file name under `SCHEMAS_DIR`. */
export declare const SCHEMA_FILES: Readonly<Record<SchemaId, string>>;

/**
 * Parse every shipped schema once and memoize it.
 * The values are the parsed JSON Schema documents; `JsonSchemaDocument`
 * describes the five members every shipped document carries.
 */
export declare function loadSchemaObjects(): Map<string, unknown>;

/**
 * Validate an in-memory value.
 *
 * An unknown `schemaId` is reported as a normal `ok:false` result — with ONE
 * documented hole, which no type in TypeScript can express: the guard is
 * `if (!SCHEMA_FILES[schemaId])` (`src/validate.mjs:80`), a plain property
 * read, so keys inherited from `Object.prototype` slip past it and then throw.
 * Measured — `validate('constructor', {})`, `validate('__proto__', {})`,
 * `validate('toString', {})` and `validate('valueOf', {})` all raise
 * `TypeError: Cannot read properties of undefined (reading '$id')`.
 *
 * Pass a {@link SchemaId} and the hole is unreachable; pass a `string` from
 * untrusted input and guard it yourself with
 * `Object.prototype.hasOwnProperty.call(SCHEMA_FILES, id)`.
 */
export declare function validate(schemaId: string, data: unknown): ValidationResult;

/** `JSON.parse` of a file. The parsed value has no promised form. */
export declare function readJsonFile(absPath: string): unknown;

/** `yaml.parse` of a file. The parsed value has no promised form. */
export declare function readYamlFile(absPath: string): unknown;

/** `validate` over a file, with `path` added to the result. */
export declare function validateFile(
  schemaId: string,
  absPath: string,
  format?: 'json' | 'yaml'
): ValidationResult & { path: string };

/**
 * Resolve the VOLUMES root with ZERO search (WP-U200 · ◆5).
 *
 * @throws {Error} when neither `opts.volumesRoot` nor an absolute
 *   `ZEUS_VOLUMES_ROOT` is available, or when the root falls inside
 *   `node_modules`.
 */
export declare function resolveVolumesRoot(opts?: { volumesRoot?: string }): string;

export interface ValidateVolumesTreeOptions {
  volumesRoot?: string;
  sampleRegistros?: number;
  sampleCacheMeta?: number;
}

export interface ValidateVolumesTreeReport {
  ok: boolean;
  /** `null` when the root could not be resolved — an honest failure report. */
  volumesRoot: string | null;
  results: Array<ValidationResult & { path?: string }>;
  skipped: string[];
}

/**
 * Validate a live (or fixture) VOLUMES tree without mutating files.
 * Missing disks are reported as skipped, not as failures.
 */
export declare function validateVolumesTree(
  opts?: ValidateVolumesTreeOptions
): ValidateVolumesTreeReport;
