/**
 * Declarations for src/tools/crear-cotas.mjs.
 * Scaffold a cota (sima/cima pole) corpus with its anchor scene.
 */

import type { KitFailure } from '../common.js';

export type CotaBound = 'lower' | 'upper';
export type CotaPole = 'colapso' | 'victoria';

export interface CrearCotasOptions {
  outDir: string;
  id: string;
  /** Inferred from `id` (`sima`→lower, `cima`→upper) when absent. */
  bound?: CotaBound;
  /** Must match `bound`: lower↔colapso, upper↔victoria. */
  pole?: CotaPole;
  viewpoint?: string;
  lore?: string | null;
  anchorScene?: string;
  triggers?: string[];
  pairsWith?: string[];
  /**
   * Caller-supplied scenes. When absent a single synthetic anchor scene is
   * written. Entries are passed through to `manifest.json` unchanged, so
   * their form is the caller's to promise, not this package's.
   */
  scenes?: unknown[];
  overwrite?: boolean;
}

/** The `manifest.json` this tool writes — `schemas/force-manifest.json`. */
export interface CotaManifest {
  id: string;
  kind: 'cota';
  description: string;
  anchor_scene: string;
  scene_count: number;
  scenes: unknown[];
}

/** The `cota.json` this tool writes — `schemas/cota.json`. */
export interface CotaDocument {
  id: string;
  kind: 'cota';
  bound: CotaBound;
  pole: CotaPole;
  viewpoint: string;
  lore: string | null;
  anchor_scene: string;
  triggers: string[];
  pairs_with: string[];
  scene_count: number;
  provenance: { created_at: string; tool: 'crear-cotas' };
}

export interface CrearCotasOk {
  ok: true;
  cotaDir: string;
  id: string;
  bound: CotaBound;
  pole: CotaPole;
  anchor_scene: string;
  manifest: CotaManifest;
  cota: CotaDocument;
}

export declare function crearCotas(options: CrearCotasOptions): CrearCotasOk | KitFailure;
