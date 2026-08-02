/**
 * Declarations for src/tools/crear-linea.mjs.
 * Scaffold a trunk line and materialize its files. Node-only, writes to disk.
 */

import type { KitFailure } from '../common.js';
import type { ManifestTronco } from '../model.js';

export interface NodoInput {
  id: string;
  parte?: string;
  año_ini: number;
  año_fin?: number | null;
  etiqueta?: string;
  tesis?: string;
  articulos_wp?: string[];
}

export interface CrearLineaOptions {
  /** Line id — also the folder name under `lineasRoot`. */
  id: string;
  /** Absolute path of the LINEAS root (the `registry.yaml` parent). */
  lineasRoot: string;
  etiqueta?: string;
  autorTronco?: string;
  referenciaWp?: string;
  nodoPrefix?: string;
  /** Defaults to `wp/historia/`. */
  sateliteRel?: string;
  nodos?: NodoInput[];
  /** Defaults to `true`. */
  updateRegistry?: boolean;
  overwrite?: boolean;
}

/** Default toy nodos (3) for scaffolding demos — generic, no game names. */
export declare function defaultScaffoldNodos(): NodoInput[];

export interface MaterializarTroncoOptions {
  corpus?: string;
  autorTronco?: string;
  referenciaWp?: string;
  sateliteRel?: string;
  /**
   * In-memory `nodos.yaml` document. Read without validating first, so its
   * form is not promised here; `schemas/nodos-document.json` is the contract.
   */
  nodosDoc?: unknown;
}

export interface MaterializarTroncoOk {
  ok: true;
  lineDir: string;
  manifestPath: string;
  nodoCount: number;
  satDir: string;
  manifest: ManifestTronco;
}

/** Materialize trunk files from `nodos.yaml` (or from in-memory nodos). */
export declare function materializarTronco(
  lineDir: string,
  opts?: MaterializarTroncoOptions
): MaterializarTroncoOk | KitFailure;

export interface CrearLineaOk extends MaterializarTroncoOk {
  id: string;
  lineasRoot: string;
}

/** Scaffold a new line under `lineasRoot` and optionally register it. */
export declare function crearLinea(options: CrearLineaOptions): CrearLineaOk | KitFailure;
