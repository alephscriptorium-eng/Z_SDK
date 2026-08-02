/**
 * Declarations for src/tools/segmentar-force.mjs.
 * Conversational contexts → scenes split into prompt/think/output layers.
 * The trace layer is dropped on purpose (`layers_dropped: ['trace']`).
 */

import type { KitFailure } from '../common.js';

export type SceneLayer = 'prompt' | 'think' | 'output';

/** A 1-based inclusive line range, or a single 1-based line. */
export type LineRange = [number, number] | number;

export interface SceneDef {
  id: string;
  slug: string;
  title?: string;
  session?: string;
  /** 1-based inclusive coverage range. */
  lines?: [number, number];
  prompt?: LineRange;
  think?: LineRange;
  output?: LineRange;
  /** Lines dropped, never written. */
  trace?: number[];
  tags?: string[];
  rol?: string | string[];
  anomalies?: string[];
  anchor?: boolean;
}

export interface CoverageReport {
  total_lines: number;
  covered_lines: number;
  ok: boolean;
  layers_dropped: string[];
  trace_line_count: number;
}

/** Coverage of the raw text by the declared scenes. */
export declare function computeCoverage(
  scenes: SceneDef[],
  totalLines: number
): CoverageReport;

/** One scene as written into `manifest.json`. */
export interface ManifestScene {
  id: string;
  session: string;
  slug: string;
  title: string;
  rol: string[];
  tags: string[];
  /** Layer name → path relative to the force dir, only for written layers. */
  files: Record<string, string>;
  anomalies: string[];
  source: { lines: [number, number]; format: 'line_range' } | { format: 'layers' };
}

/** The `manifest.json` this tool writes — `schemas/force-manifest.json`. */
export interface ForceManifest {
  id: string;
  kind: string;
  description: string;
  anchor_scene: string | null;
  scene_count: number;
  scenes: ManifestScene[];
}

/** The `force.json` this tool writes — `schemas/force.json`. */
export interface ForceCardDocument {
  id: string;
  kind: string;
  type: string;
  viewpoint: string;
  lore: string | null;
  anchor_scene: string | null;
  triggers: string[];
  pairs_with: string[];
  scene_count: number;
  provenance: {
    segmented_at: string;
    coverage: CoverageReport;
    layers_dropped: string[];
  };
}

export interface SegmentarForceOptions {
  outDir: string;
  forceId: string;
  kind?: 'force' | 'boot';
  rawText?: string;
  rawPath?: string;
  session?: string;
  scenes: SceneDef[];
  viewpoint?: string;
  lore?: string | null;
  triggers?: string[];
  pairsWith?: string[];
  type?: string;
  overwrite?: boolean;
}

export interface SegmentarForceOk {
  ok: true;
  forceDir: string;
  forceId: string;
  coverage: CoverageReport;
  anchor_scene: string | null;
  scene_count: number;
  manifest: ForceManifest;
  force: ForceCardDocument;
}

export declare function segmentarForce(
  options: SegmentarForceOptions
): SegmentarForceOk | KitFailure;
