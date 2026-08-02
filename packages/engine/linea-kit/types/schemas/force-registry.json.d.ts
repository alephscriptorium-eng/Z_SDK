/**
 * Declarations for `@zeus/linea-kit/schemas/force-registry.json`.
 *
 * The default export is the JSON Schema DOCUMENT itself (title
 * `ForceRegistry`), not the data it validates. Only the five members every
 * shipped document carries are typed; the rest of the keyword set is
 * reachable through the index signature of `JsonSchemaDocument`.
 *
 * REQUIRES AN IMPORT ATTRIBUTE. The runtime target of this subpath is the
 * literal `.json` file, so Node refuses the bare form:
 *
 * ```ts
 *   import forceRegistrySchema from '@zeus/linea-kit/schemas/force-registry.json'
 *     with { type: 'json' };            // <- mandatory
 * ```
 *
 * Without it: `ERR_IMPORT_ATTRIBUTE_MISSING` at load time. TypeScript does
 * NOT catch that here — resolving through this declaration makes the
 * subpath look like a plain ES module and switches TS1543 off. The check is
 * traded away deliberately, for the typed document; the trade is measured
 * in plan/REPORTES/WP-U245-tipos-linea-kit.md §B1 and pinned by
 * test/json-import-attribute.test.mjs, which asserts the bare form still
 * throws at runtime.
 */

import type { JsonSchemaDocument } from '../common.js';

declare const schema: JsonSchemaDocument;
export default schema;
