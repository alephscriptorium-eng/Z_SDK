/**
 * Declarations for `@zeus/linea-kit/schemas/volumes.json`.
 *
 * The default export is the JSON Schema DOCUMENT itself (title
 * `VolumesRegistry`), not the data it validates. Only the five members every
 * shipped document carries are typed; the rest of the keyword set is
 * reachable through the index signature of `JsonSchemaDocument`.
 */

import type { JsonSchemaDocument } from '../common.js';

declare const schema: JsonSchemaDocument;
export default schema;
