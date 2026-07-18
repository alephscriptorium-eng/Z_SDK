/**
 * Story-board dialect registry for the world editor (WP-U114 / U117).
 * Ids/labels/resolve/detect live here; shape contract is
 * `@zeus/story-board-schema` (AJV) — no hand-rolled id/widget regexes.
 */

import { validateStoryBoard as validateShape } from '@zeus/story-board-schema';

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   family: 'solve-inline' | 'aleph-blocks'
 * }} StoryBoardDialect
 */

/** @type {Record<string, StoryBoardDialect>} */
export const STORY_BOARD_DIALECTS = {
  'solve-inline': {
    id: 'solve-inline',
    label: 'acts[].widgets (carpeta / SOLVE-shaped)',
    family: 'solve-inline'
  },
  plantilla: {
    id: 'plantilla',
    label: 'plantilla carpeta (acts[].widgets; sketch narrativo)',
    family: 'solve-inline'
  },
  'aleph-blocks': {
    id: 'aleph-blocks',
    label: 'acts + blocks[].uichain.widgets',
    family: 'aleph-blocks'
  }
};

/**
 * @returns {string[]}
 */
export function listStoryBoardDialectIds() {
  return Object.keys(STORY_BOARD_DIALECTS);
}

/**
 * Infer dialect from board shape when no explicit id is given.
 * @param {Record<string, unknown>} board
 * @returns {string}
 */
export function detectStoryBoardDialect(board) {
  if (Array.isArray(board.blocks)) return 'aleph-blocks';
  return 'solve-inline';
}

/**
 * Resolve dialect id: board.dialect → hint → shape detect.
 * Explicit unknown dialect always fails (even if game hint is known).
 * @param {Record<string, unknown>} board
 * @param {string | null | undefined} hint
 * @returns {{ ok: true, dialect: string } | { ok: false, errors: string[] }}
 */
export function resolveStoryBoardDialect(board, hint) {
  const known = listStoryBoardDialectIds().join(', ');
  if (typeof board.dialect === 'string' && board.dialect !== '') {
    if (!STORY_BOARD_DIALECTS[board.dialect]) {
      return {
        ok: false,
        errors: [`unknown dialect "${board.dialect}". Known: ${known}`]
      };
    }
    return { ok: true, dialect: board.dialect };
  }
  if (hint != null && hint !== '') {
    if (typeof hint !== 'string' || !STORY_BOARD_DIALECTS[hint]) {
      return {
        ok: false,
        errors: [`unknown dialect "${hint}". Known: ${known}`]
      };
    }
    return { ok: true, dialect: hint };
  }
  return { ok: true, dialect: detectStoryBoardDialect(board) };
}

/**
 * Validate a story-board: registry dialect + shared schema.
 * @param {unknown} board
 * @param {{ dialect?: string | null }} [opts]
 * @returns {{ ok: true, dialect: string } | { ok: false, errors: string[] }}
 */
export function validateStoryBoard(board, opts = {}) {
  if (board === null || typeof board !== 'object' || Array.isArray(board)) {
    return { ok: false, errors: ['root must be an object'] };
  }
  const resolved = resolveStoryBoardDialect(
    /** @type {Record<string, unknown>} */ (board),
    opts.dialect
  );
  if (!resolved.ok) return resolved;
  const shape = validateShape(board, { dialect: resolved.dialect });
  if (!shape.ok) return shape;
  return { ok: true, dialect: resolved.dialect };
}
