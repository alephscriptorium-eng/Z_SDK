import type { ActaDeBarrio, ClaseJugador, EstadoBarrio } from './tipos.d.ts';

export interface EmitirActaInput {
  barrioId: string;
  estado: EstadoBarrio;
  resumen: string;
  pendientes?: string[];
  ultimaClase: ClaseJugador;
  tickEmision: number;
  huellaLedger: string;
}

/**
 * Emisión pura: tick y huella entran como input. Lanza si el shape no cierra.
 */
export declare function emitirActa(input: EmitirActaInput): ActaDeBarrio;
