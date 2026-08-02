/**
 * Shared shapes for the `@zeus/linea-kit` declarations.
 *
 * This module is NOT an `exports` subpath: it is reached only through the
 * declared subpaths that re-export from it. Consumers name these types by
 * importing them from the subpath that uses them.
 *
 * Rule applied throughout these declarations: a value is described only as
 * far as the runtime (or the JSON Schema under `schemas/`) actually promises
 * its form. Everything looser is `unknown`, never an escape hatch.
 */

/** One ajv error entry, or the kit's own `{ message }` stand-in. */
export interface ValidationIssue {
  message?: string;
  readonly [key: string]: unknown;
}

/** Result of `validate` / `validateFile` (src/validate.mjs). */
export interface ValidationResult {
  ok: boolean;
  schemaId: string;
  errors: ValidationIssue[] | null;
  /** Present on `validateFile` and on tree entries built from a file. */
  path?: string;
}

/**
 * Uniform failure envelope of the kit tools: `ok:false` plus a stable
 * machine-readable `rule` id and a human `error` string.
 */
export interface KitFailure {
  ok: false;
  error: string;
  rule: string;
  validation?: ValidationResult;
  hint?: string;
}

/**
 * A JSON Schema document as shipped under `schemas/`.
 * The five listed members are present in all 19 shipped documents; the rest
 * of a JSON Schema keyword set is deliberately left as `unknown`.
 */
export interface JsonSchemaDocument {
  readonly $schema: string;
  readonly $id: string;
  readonly title: string;
  readonly description: string;
  readonly type: string;
  readonly [keyword: string]: unknown;
}
