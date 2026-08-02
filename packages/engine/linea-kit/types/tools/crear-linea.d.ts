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

/**
 * The `nodos.yaml` document, as the tool WALKS it — which is stricter than
 * `unknown` and stricter than `schemas/nodos-document.json`, because the walk
 * happens BEFORE the document is validated at all.
 *
 * `materializarTronco` iterates `nodosDoc.partes ?? []` and then
 * `parte.nodos ?? []`, dereferencing each entry unconditionally. Three shapes
 * that `unknown` admitted and the runtime does not survive, measured:
 *
 *     partes as a bare record rather than an array
 *         -> TypeError "object is not iterable"
 *     a null parte, `partes` holding `[null]`
 *         -> TypeError "Cannot read properties of null (reading 'nodos')"
 *     a null nodo ref inside a parte
 *         -> TypeError "Cannot read properties of null (reading 'id')"
 *
 * Hence: `partes` may be absent (the tool then returns the honest
 * `crear-linea.empty_nodos` refusal) but must be an ARRAY when present, and
 * neither a parte nor a nodo entry may be `null`.
 *
 * NOT covered by this type: the same three shapes are reachable from a
 * `nodos.yaml` ON DISK, without passing `nodosDoc` at all — see §B3 of the
 * report, routed as a `src/` finding.
 */
export interface NodosDocumentInput {
  corpus?: string;
  version?: string;
  autor_tronco?: string;
  referencia_wp_cima?: string;
  partes?: ReadonlyArray<{
    id: string;
    año_ini?: number;
    año_fin?: number | null;
    nodos?: ReadonlyArray<string | NodoInput>;
  }>;
  /** Detail lookup for string nodo refs: keyed record or array of nodos. */
  nodos?: Record<string, Partial<NodoInput>> | ReadonlyArray<NodoInput>;
  [key: string]: unknown;
}

export interface MaterializarTroncoOptions {
  corpus?: string;
  autorTronco?: string;
  referenciaWp?: string;
  sateliteRel?: string;
  /**
   * In-memory `nodos.yaml` document. When absent the tool reads
   * `<lineDir>/nodos.yaml` from disk instead.
   */
  nodosDoc?: NodosDocumentInput;
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
