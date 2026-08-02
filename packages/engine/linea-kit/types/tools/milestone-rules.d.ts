/**
 * Declarations for src/tools/milestone-rules.mjs.
 * Table-driven milestone rules for historial segmentation (PRACTICAS §1.2).
 */

export interface MilestoneContext {
  byteDeltaThreshold: number;
  keywords: string[];
  editorAllowlist?: Set<string>;
}

/**
 * One rule of the table. `reg` is `unknown`: the rules are applied to raw
 * historial rows and to viaje pasos alike, and those two do not share a form.
 */
export interface MilestoneRule {
  id: string;
  test: (reg: unknown, ctx: MilestoneContext) => boolean;
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
  editorAllowlist?: Set<string>;
}

/** Run the whole table against one record. */
export declare function applyMilestoneRules(
  registro: unknown,
  opts?: MilestoneOptions
): MilestoneVerdict;
