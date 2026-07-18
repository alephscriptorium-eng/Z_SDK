/**
 * Story-board dialect registry for the world editor (WP-U114).
 * Shape aligned with kits/carpeta-dramaturgo validate-story-board
 * (solve-inline · aleph-blocks · plantilla = misma forma que plantilla kit).
 * Schema-as-truth (AJV) → WP-U115 — not here.
 */

const ACT_ID = /^act-[0-9]+$/;
const WIDGET_ID = /^[a-z][a-z0-9-]*$/;

/**
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   validate: (board: Record<string, unknown>) =>
 *     { ok: true, dialect: string } | { ok: false, errors: string[] }
 * }} StoryBoardDialect
 */

/**
 * @param {Record<string, unknown>} board
 * @param {string} dialectId
 * @returns {{ ok: true, dialect: string } | { ok: false, errors: string[] }}
 */
function validateSolveShape(board, dialectId) {
  const errors = [];
  if (Array.isArray(board.blocks)) {
    return {
      ok: false,
      errors: [
        `dialect ${dialectId}: unexpected root.blocks (use aleph-blocks)`
      ]
    };
  }
  if (!Array.isArray(board.acts) || board.acts.length < 1) {
    return { ok: false, errors: ['acts: required non-empty array'] };
  }
  for (let i = 0; i < board.acts.length; i++) {
    const act = board.acts[i];
    const prefix = `acts[${i}]`;
    if (!isObj(act)) {
      errors.push(`${prefix}: must be object`);
      continue;
    }
    if (typeof act.id !== 'string' || !ACT_ID.test(act.id)) {
      errors.push(`${prefix}.id: must match act-N`);
    }
    if (!Array.isArray(act.widgets) || act.widgets.length < 1) {
      errors.push(`${prefix}.widgets: required non-empty array`);
    } else {
      for (let j = 0; j < act.widgets.length; j++) {
        const w = act.widgets[j];
        if (typeof w !== 'string' || !WIDGET_ID.test(w)) {
          errors.push(`${prefix}.widgets[${j}]: invalid widget id`);
        }
      }
    }
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, dialect: dialectId };
}

/**
 * @param {Record<string, unknown>} board
 * @returns {{ ok: true, dialect: string } | { ok: false, errors: string[] }}
 */
function validateAlephBlocks(board) {
  const errors = [];
  /** @type {Set<string>} */
  const actIds = new Set();

  if (!Array.isArray(board.acts) || board.acts.length < 1) {
    return { ok: false, errors: ['acts: required non-empty array'] };
  }

  for (let i = 0; i < board.acts.length; i++) {
    const act = board.acts[i];
    const prefix = `acts[${i}]`;
    if (!isObj(act)) {
      errors.push(`${prefix}: must be object`);
      continue;
    }
    if (typeof act.id !== 'string' || !ACT_ID.test(act.id)) {
      errors.push(`${prefix}.id: must match act-N`);
    } else {
      actIds.add(act.id);
    }
    if (!Array.isArray(act.blocks) || act.blocks.length < 1) {
      errors.push(`${prefix}.blocks: required non-empty array of numbers`);
    }
  }

  if (!Array.isArray(board.blocks) || board.blocks.length < 1) {
    errors.push('blocks: required non-empty array');
  } else {
    for (let i = 0; i < board.blocks.length; i++) {
      const block = board.blocks[i];
      const prefix = `blocks[${i}]`;
      if (!isObj(block)) {
        errors.push(`${prefix}: must be object`);
        continue;
      }
      if (typeof block.n !== 'number' && typeof block.n !== 'string') {
        errors.push(`${prefix}.n: required`);
      }
      if (typeof block.act !== 'string' || !ACT_ID.test(block.act)) {
        errors.push(`${prefix}.act: must match act-N`);
      } else if (!actIds.has(block.act)) {
        errors.push(`${prefix}.act: unknown act id ${block.act}`);
      }
      if (!isObj(block.uichain)) {
        errors.push(`${prefix}.uichain: required object`);
      } else {
        const widgets = block.uichain.widgets;
        if (!Array.isArray(widgets) || widgets.length < 1) {
          errors.push(`${prefix}.uichain.widgets: required non-empty array`);
        } else {
          for (let j = 0; j < widgets.length; j++) {
            const w = widgets[j];
            if (typeof w !== 'string' || !WIDGET_ID.test(w)) {
              errors.push(`${prefix}.uichain.widgets[${j}]: invalid widget id`);
            }
          }
        }
      }
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, dialect: 'aleph-blocks' };
}

/** @type {Record<string, StoryBoardDialect>} */
export const STORY_BOARD_DIALECTS = {
  'solve-inline': {
    id: 'solve-inline',
    label: 'acts[].widgets (carpeta / SOLVE-shaped)',
    validate: (board) => validateSolveShape(board, 'solve-inline')
  },
  plantilla: {
    id: 'plantilla',
    label: 'plantilla carpeta (acts[].widgets; sketch narrativo)',
    validate: (board) => validateSolveShape(board, 'plantilla')
  },
  'aleph-blocks': {
    id: 'aleph-blocks',
    label: 'acts + blocks[].uichain.widgets',
    validate: validateAlephBlocks
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
 * Validate a story-board against the dialect registry.
 * @param {unknown} board
 * @param {{ dialect?: string | null }} [opts]
 * @returns {{ ok: true, dialect: string } | { ok: false, errors: string[] }}
 */
export function validateStoryBoard(board, opts = {}) {
  if (!isObj(board)) {
    return { ok: false, errors: ['root must be an object'] };
  }
  const resolved = resolveStoryBoardDialect(board, opts.dialect);
  if (!resolved.ok) return resolved;
  const entry = STORY_BOARD_DIALECTS[resolved.dialect];
  return entry.validate(board);
}
