/**
 * Declarations for src/tools/segmentar.mjs.
 * Historial → satellite manifest, in memory and on disk. Node-only.
 */

import type { KitFailure } from '../common.js';
import type { ManifestSatelite } from '../model.js';

export { materializarTronco } from './crear-linea.js';

/** A raw historial row, before segmentation assigns ids and milestones. */
export interface RawRegistro {
  oldid: number;
  parent_oldid?: number | null;
  timestamp?: string;
  user?: string;
  byte_delta?: number;
  bytes?: number;
  section?: string | null;
  summary?: string;
  milestone?: boolean;
  urls?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SegmentarHistorialOptions {
  corpus: string;
  title?: string;
  source?: string;
  wikiBase?: string;
  articleTitle?: string;
  byteDeltaThreshold?: number;
  keywords?: string[];
  editorAllowlist?: Set<string> | string[];
  ordering?: 'newest_first' | 'oldest_first';
}

export interface SegmentarHistorialOk {
  ok: true;
  manifest: ManifestSatelite;
  milestoneCount: number;
}

/** Build a satellite manifest in memory (validated, nothing written). */
export declare function segmentarHistorial(
  rawRegs: RawRegistro[],
  opts: SegmentarHistorialOptions
): SegmentarHistorialOk | KitFailure;

export interface SegmentarOptions {
  satDir: string;
  registros?: RawRegistro[];
  rawPath?: string;
  corpus?: string;
  title?: string;
  byteDeltaThreshold?: number;
  keywords?: string[];
  editorAllowlist?: string[];
  writeNodoSections?: boolean;
  nodoIds?: string[];
}

export interface SegmentarOk {
  ok: true;
  satDir: string;
  manifestPath: string;
  registroCount: number;
  milestoneCount: number;
  manifest: ManifestSatelite;
}

/** Segment a historial into a satellite manifest on disk. */
export declare function segmentar(options: SegmentarOptions): SegmentarOk | KitFailure;
