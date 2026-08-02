/**
 * Declarations for src/viaje/reparar.mjs.
 * Toy repair voyage R0→R2 for a broken barrio (minimal Z10 wiring).
 */

import type { ViajeRecorrido } from './cache.js';

export interface ReparacionOptions {
  barrioId: string;
  /** Defaults to `reparar-<barrioId>`. */
  viajeId?: string;
  cacheDir?: string;
}

export interface ReparacionResult {
  ok: boolean;
  barrioId: string;
  /** `true` only when the voyage completed — the caller then applies it. */
  reparacion: boolean;
  path?: string[];
  recorrido?: ViajeRecorrido;
  error?: string;
  rule?: string;
}

/**
 * On `ok`, the caller (a consumer pack) applies its own completion step.
 * A missing or blank `barrioId` refuses with rule `viaje.reparar.args`.
 */
export declare function runViajeReparacionJuguete(
  opts: ReparacionOptions
): Promise<ReparacionResult>;
