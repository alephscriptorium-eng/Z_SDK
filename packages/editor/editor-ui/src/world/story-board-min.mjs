/**
 * Minimal story-board validation for dialect `solve-inline` (WP-U111).
 * Full multi-dialect registry → WP-U114. Shape aligned with
 * kits/carpeta-dramaturgo validateSolve (acts[].widgets).
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
 * @param {unknown} board
 * @returns {{ ok: true, dialect: 'solve-inline' } | { ok: false, errors: string[] }}
 */
export function validateSolveInlineBoard(board) {
  const errors = [];
  if (!isObj(board)) {
    return { ok: false, errors: ['root must be an object'] };
  }
  if (Array.isArray(board.blocks)) {
    return {
      ok: false,
      errors: [
        'dialect aleph-blocks not accepted here (U111 mínimo = solve-inline; U114)'
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
  return { ok: true, dialect: 'solve-inline' };
}
