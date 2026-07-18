/**
 * @zeus/story-board-schema — canonical story-board contract (WP-U117).
 */

export {
  loadStoryBoardSchema,
  STORY_BOARD_SCHEMA_PATH
} from './schema.mjs';

export {
  validateStoryBoard,
  validateStoryBoardFile,
  detectShapeDialect,
  semanticAlephActRefs,
  buildActsToWidgets,
  schemaFamilyForDialect,
  formatAjvErrors
} from './validate.mjs';
