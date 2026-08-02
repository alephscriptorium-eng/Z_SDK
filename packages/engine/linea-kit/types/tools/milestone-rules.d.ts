/**
 * Declarations for src/tools/milestone-rules.mjs.
 * Table-driven milestone rules for historial segmentation (PRACTICAS §1.2).
 */

export interface MilestoneContext {
  byteDeltaThreshold: number;
  keywords: string[];
  /**
   * A `Set`, NOT an array. The `editor` rule calls `.size` and `.has()`
   * directly, so an array reaches `.has is not a function`. Measured:
   * `applyMilestoneRules({user:'bob'}, {editorAllowlist:['bob']})` throws
   * `TypeError: ctx.editorAllowlist.has is not a function`.
   */
  editorAllowlist?: Set<string>;
}

/**
 * One rule of the table.
 *
 * `reg` is `Record<string, unknown>` and NOT `unknown`: the rules are applied
 * to raw historial rows and to viaje pasos alike, which do not share a form,
 * but every rule dereferences the record unconditionally
 * (`Math.abs(Number(reg.byte_delta) || 0)`), so `null` and `undefined` — both
 * members of `unknown` — reach a `TypeError`. Measured:
 * `MILESTONE_RULES[0].test(null, ctx)` throws
 * `Cannot read properties of null (reading 'byte_delta')`.
 */
export interface MilestoneRule {
  id: string;
  test: (reg: Record<string, unknown>, ctx: MilestoneContext) => boolean;
}

/** The four shipped rules: `byte_delta`, `keyword`, `editor`, `explicit`. */
export declare const MILESTONE_RULES: readonly MilestoneRule[];

export declare const DEFAULT_BYTE_DELTA_THRESHOLD: number;

export declare const DEFAULT_MILESTONE_KEYWORDS: readonly string[];

export interface MilestoneVerdict {
  milestone: boolean;
  /** Ids of the rules that fired, in table order. */
  milestone_reasons: string[];
}

export interface MilestoneOptions {
  byteDeltaThreshold?: number;
  keywords?: string[];
  /** A `Set`, not an array — see {@link MilestoneContext.editorAllowlist}. */
  editorAllowlist?: Set<string>;
}

/**
 * Run the whole table against one record.
 *
 * The record must be an object: `null` and `undefined` throw, so the domain is
 * `Record<string, unknown>` and not `unknown`.
 */
export declare function applyMilestoneRules(
  registro: Record<string, unknown>,
  opts?: MilestoneOptions
): MilestoneVerdict;
