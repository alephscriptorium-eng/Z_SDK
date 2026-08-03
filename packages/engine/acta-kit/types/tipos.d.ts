/**
 * ActaDeBarrio v1 — contrato congelado (SEMILLA-ARG §A3).
 * Declaraciones espejo de `src/tipos.mjs`. Cero campos inventados.
 */

export type EstadoBarrio = 'vivo' | 'latente' | 'muerto' | 'roto';
export type ClaseJugador = 'residente' | 'visitante' | 'flujo';

export interface ActaDeBarrio {
  version: 'acta/1';
  barrioId: string;
  estado: EstadoBarrio;
  resumen: string;
  pendientes: string[];
  ultimaClase: ClaseJugador;
  tickEmision: number;
  huellaLedger: string;
}

export declare const ACTA_VERSION: 'acta/1';

export declare const ESTADOS_BARRIO: readonly EstadoBarrio[];

export declare const CLASES_JUGADOR: readonly ClaseJugador[];

/** Máx chars de `resumen` (contrato §A3). */
export declare const RESUMEN_MAX: 400;

/** entryKind ledger en canal plaza existente (cero canal nuevo). */
export declare const LEDGER_ACTA: 'acta';
export declare const LEDGER_ACTA_RECHAZADA: 'acta_rechazada';

/**
 * Type guard: estrecha `unknown` al shape exacto que valida el runtime.
 * Campos ausentes o extra no ganan contrato por esta declaración.
 */
export declare function isActaDeBarrioShaped(value: unknown): value is ActaDeBarrio;
