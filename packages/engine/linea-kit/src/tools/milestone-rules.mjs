/**
 * Milestone rules for historial segmentation (concept from segment_linea.py).
 * Table-driven — PRACTICAS §1.2.
 */

/** @typedef {{ id: string, test: (reg: object, ctx: MilestoneContext) => boolean }} MilestoneRule */

/**
 * @typedef {object} MilestoneContext
 * @property {number} byteDeltaThreshold
 * @property {string[]} keywords
 * @property {Set<string>} [editorAllowlist]
 */

/** @type {MilestoneRule[]} */
export const MILESTONE_RULES = Object.freeze([
  {
    id: 'byte_delta',
    test: (reg, ctx) => Math.abs(Number(reg.byte_delta) || 0) >= ctx.byteDeltaThreshold
  },
  {
    id: 'keyword',
    test: (reg, ctx) => {
      const hay = `${reg.summary ?? ''} ${reg.section ?? ''}`.toLowerCase();
      return ctx.keywords.some((kw) => hay.includes(kw.toLowerCase()));
    }
  },
  {
    id: 'editor',
    test: (reg, ctx) => {
      if (!ctx.editorAllowlist || ctx.editorAllowlist.size === 0) return false;
      return ctx.editorAllowlist.has(String(reg.user ?? ''));
    }
  },
  {
    id: 'explicit',
    test: (reg) => reg.milestone === true
  }
]);

export const DEFAULT_BYTE_DELTA_THRESHOLD = 500;

export const DEFAULT_MILESTONE_KEYWORDS = Object.freeze([
  'fusión',
  'fusion',
  'trasladado',
  'traducción',
  'traduccion',
  'proviene del artículo',
  'ampliada sección',
  'ordenación alfabética'
]);

/**
 * @param {object} registro
 * @param {Partial<MilestoneContext>} [opts]
 * @returns {{ milestone: boolean, milestone_reasons: string[] }}
 */
export function applyMilestoneRules(registro, opts = {}) {
  const ctx = {
    byteDeltaThreshold: opts.byteDeltaThreshold ?? DEFAULT_BYTE_DELTA_THRESHOLD,
    keywords: opts.keywords ?? [...DEFAULT_MILESTONE_KEYWORDS],
    editorAllowlist: opts.editorAllowlist ?? new Set()
  };
  const reasons = [];
  for (const rule of MILESTONE_RULES) {
    if (rule.test(registro, ctx)) reasons.push(rule.id);
  }
  return {
    milestone: reasons.length > 0,
    milestone_reasons: reasons
  };
}
