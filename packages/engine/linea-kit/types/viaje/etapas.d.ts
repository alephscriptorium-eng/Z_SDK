/**
 * Declarations for src/viaje/etapas.mjs.
 * Viaje traversal stages. «viaje» = origin→destination path on a graph.
 */

/**
 * The seven stages. Promised twice over: the runtime freezes exactly these
 * tokens, and `schemas/viaje-recorrido.json` declares the same enum for
 * `etapa`.
 */
export type ViajeEtapa =
  | 'idle'
  | 'planning'
  | 'traversing'
  | 'choosing'
  | 'pruned'
  | 'blocked'
  | 'completed';

export declare const VIAJE_ETAPAS: readonly ViajeEtapa[];

/** Allowed transitions of the travesía state machine. */
export declare const VIAJE_TRANSICIONES: Readonly<
  Record<ViajeEtapa, readonly ViajeEtapa[]>
>;

export declare function isViajeEtapa(value: unknown): value is ViajeEtapa;

/** `false` for unknown stages on either side, never a throw. */
export declare function canTransition(from: string, to: string): boolean;
