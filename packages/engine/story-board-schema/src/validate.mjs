/**
 * AJV validator for story-board.json (WP-U117).
 * Schema is the shape contract; post-check covers block.act → known act id.
 */

import fs from 'node:fs';
import path from 'node:path';
import Ajv2020Module from 'ajv/dist/2020.js';
import {
  loadStoryBoardSchema,
  STORY_BOARD_SCHEMA_PATH
} from './schema.mjs';

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

const ACT_ID = /^act-[0-9]+$/;

/**
 * @param {unknown} v
 * @returns {v is Record<string, unknown>}
 */
function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** @type {import('ajv').ValidateFunction | null} */
let rootValidate = null;
/** @type {import('ajv').ValidateFunction | null} */
let solveValidate = null;
/** @type {import('ajv').ValidateFunction | null} */
let alephValidate = null;
/** @type {string | null} */
let schemaLoadError = null;

/**
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
function ensureCompiled() {
  if (rootValidate) return { ok: true };
  if (schemaLoadError) {
    return { ok: false, errors: [schemaLoadError] };
  }
  let schema;
  try {
    schema = loadStoryBoardSchema();
  } catch (e) {
    schemaLoadError = `schema load: ${e.message}`;
    return { ok: false, errors: [schemaLoadError] };
  }
  const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false
  });
  rootValidate = ajv.compile(schema);
  const defs = schema.$defs ?? {};
  solveValidate = ajv.compile({
    $schema: schema.$schema,
    $defs: defs,
    ...defs.dialectSolve
  });
  alephValidate = ajv.compile({
    $schema: schema.$schema,
    $defs: defs,
    ...defs.dialectAleph
  });
  return { ok: true };
}

/**
 * @param {import('ajv').ErrorObject[] | null | undefined} errors
 * @returns {string[]}
 */
export function formatAjvErrors(errors) {
  if (!errors?.length) return ['schema validation failed'];
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const e of errors) {
    const instancePath = e.instancePath || '(root)';
    const detail =
      e.keyword === 'pattern' && e.params?.pattern
        ? `${e.message} (${e.params.pattern})`
        : e.keyword === 'required' && e.params?.missingProperty
          ? `must have required property '${e.params.missingProperty}'`
          : e.message || e.keyword;
    const line = `${instancePath}: ${detail}`;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

/**
 * Shape-based dialect guess (not a substitute for oneOf).
 * @param {unknown} board
 * @returns {'aleph-blocks' | 'solve-inline'}
 */
export function detectShapeDialect(board) {
  if (isObj(board) && Array.isArray(board.blocks)) return 'aleph-blocks';
  return 'solve-inline';
}

/**
 * Semántica que JSON Schema no expresa: block.act → act id conocido.
 * @param {Record<string, unknown>} board
 * @returns {string[]}
 */
export function semanticAlephActRefs(board) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Set<string>} */
  const actIds = new Set();
  if (Array.isArray(board.acts)) {
    for (const act of board.acts) {
      if (isObj(act) && typeof act.id === 'string' && ACT_ID.test(act.id)) {
        actIds.add(act.id);
      }
    }
  }
  if (!Array.isArray(board.blocks)) return errors;
  for (let i = 0; i < board.blocks.length; i++) {
    const block = board.blocks[i];
    if (!isObj(block)) continue;
    if (
      typeof block.act === 'string' &&
      ACT_ID.test(block.act) &&
      !actIds.has(block.act)
    ) {
      errors.push(`blocks[${i}].act: unknown act id ${block.act}`);
    }
  }
  return errors;
}

/**
 * @param {Record<string, unknown>} board
 * @param {'solve-inline' | 'aleph-blocks'} dialect
 * @returns {Map<string, string[]>}
 */
export function buildActsToWidgets(board, dialect) {
  /** @type {Map<string, string[]>} */
  const actsToWidgets = new Map();
  if (dialect === 'solve-inline') {
    for (const act of /** @type {unknown[]} */ (board.acts)) {
      if (!isObj(act) || typeof act.id !== 'string') continue;
      const widgets = Array.isArray(act.widgets)
        ? act.widgets.filter((w) => typeof w === 'string')
        : [];
      actsToWidgets.set(act.id, /** @type {string[]} */ (widgets));
    }
    return actsToWidgets;
  }
  for (const act of /** @type {unknown[]} */ (board.acts)) {
    if (isObj(act) && typeof act.id === 'string') {
      actsToWidgets.set(act.id, []);
    }
  }
  for (const block of /** @type {unknown[]} */ (board.blocks ?? [])) {
    if (!isObj(block) || typeof block.act !== 'string') continue;
    if (!isObj(block.uichain) || !Array.isArray(block.uichain.widgets)) continue;
    if (!actsToWidgets.has(block.act)) continue;
    const merged = actsToWidgets.get(block.act);
    for (const w of block.uichain.widgets) {
      if (typeof w === 'string' && !merged.includes(w)) merged.push(w);
    }
  }
  return actsToWidgets;
}

/**
 * Map editor/kit dialect ids onto schema dialect families.
 * @param {string} dialectId
 * @returns {'solve-inline' | 'aleph-blocks'}
 */
export function schemaFamilyForDialect(dialectId) {
  if (dialectId === 'aleph-blocks') return 'aleph-blocks';
  return 'solve-inline';
}

/**
 * Validate board shape against the canonical schema.
 * @param {unknown} board
 * @param {{ dialect?: string | null }} [opts]
 *   When `dialect` is set, compiles that family ($defs) for clearer errors
 *   and still requires root oneOf + aleph semantic refs.
 * @returns {{
 *   ok: true,
 *   dialect: string,
 *   actsToWidgets: Map<string, string[]>
 * } | { ok: false, errors: string[] }}
 */
export function validateStoryBoard(board, opts = {}) {
  const compiled = ensureCompiled();
  if (!compiled.ok) return compiled;

  const hint =
    typeof opts.dialect === 'string' && opts.dialect !== ''
      ? opts.dialect
      : null;
  const family = hint
    ? schemaFamilyForDialect(hint)
    : detectShapeDialect(board);

  const ok = /** @type {boolean} */ (rootValidate(board));
  if (!ok) {
    const dialectFn = family === 'aleph-blocks' ? alephValidate : solveValidate;
    dialectFn(board);
    return {
      ok: false,
      errors: formatAjvErrors(dialectFn.errors)
    };
  }

  if (!isObj(board)) {
    return { ok: false, errors: ['(root): must be object'] };
  }

  const shape = detectShapeDialect(board);
  if (hint && schemaFamilyForDialect(hint) !== shape) {
    return {
      ok: false,
      errors: [
        `dialect ${hint}: board shape is ${shape} (schema oneOf mismatch)`
      ]
    };
  }

  if (shape === 'aleph-blocks') {
    const semantic = semanticAlephActRefs(board);
    if (semantic.length) return { ok: false, errors: semantic };
  }

  const dialect = hint || shape;
  return {
    ok: true,
    dialect,
    actsToWidgets: buildActsToWidgets(board, shape)
  };
}

/**
 * @param {string} filePath
 * @param {{ dialect?: string | null }} [opts]
 */
export function validateStoryBoardFile(filePath, opts = {}) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    return { ok: false, path: abs, errors: [`file not found: ${abs}`] };
  }
  let board;
  try {
    board = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    return { ok: false, path: abs, errors: [`JSON parse: ${e.message}`] };
  }
  const result = validateStoryBoard(board, opts);
  return { ...result, path: abs };
}

export { STORY_BOARD_SCHEMA_PATH };
