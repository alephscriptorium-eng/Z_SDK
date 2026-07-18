/**
 * Load the canonical story-board JSON Schema (draft 2020-12).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to story-board.schema.json */
export const STORY_BOARD_SCHEMA_PATH = path.resolve(
  __dirname,
  '../schemas/story-board.schema.json'
);

/** @type {object | null} */
let cached = null;

/**
 * @returns {object}
 */
export function loadStoryBoardSchema() {
  if (cached) return cached;
  cached = JSON.parse(fs.readFileSync(STORY_BOARD_SCHEMA_PATH, 'utf8'));
  return cached;
}
