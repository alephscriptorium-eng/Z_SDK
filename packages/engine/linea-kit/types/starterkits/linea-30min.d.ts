/**
 * Declarations for src/starterkits/linea-30min.mjs.
 * Synthetic end-to-end toy line: trunk of 3 nodos + satellite of 10 registros.
 */

import type { KitFailure, ValidationResult } from '../common.js';
import type { RawRegistro } from '../tools/segmentar.js';
import type { FetchSnapshotOk } from '../tools/fetch.js';

/** Build the 10 synthetic historial registros (newest-first oldids). */
export declare function toyHistorialRegistros(): RawRegistro[];

export interface CreateLineaJugueteOptions {
  lineasRoot: string;
  /** Defaults to `juguete`. */
  id?: string;
  /** Set to `false` to skip the sample snapshot fetch. */
  fetchSample?: boolean;
  overwrite?: boolean;
}

export interface CreateLineaJugueteOk {
  ok: true;
  id: string;
  lineasRoot: string;
  lineDir: string;
  satDir: string;
  nodoCount: number;
  registroCount: number;
  milestoneCount: number;
  fetches: FetchSnapshotOk[];
  paths: {
    trunkManifest: string;
    satManifest: string;
    registry: string;
  };
}

/**
 * The starterkit's own failure envelope: it also forwards, unchanged, every
 * failure returned by `crearLinea`, `segmentar`, `conectarSatelite` or
 * `fetchSnapshot`, so `KitFailure` covers both.
 */
export interface StarterkitValidationFailure {
  ok: false;
  error: string;
  rule: string;
  failed: ValidationResult[];
}

export declare function createLineaJuguete(
  options: CreateLineaJugueteOptions
): CreateLineaJugueteOk | StarterkitValidationFailure | KitFailure;
