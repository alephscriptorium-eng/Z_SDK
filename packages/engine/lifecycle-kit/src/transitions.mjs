/**
 * Closed transition table for the leaf lifecycle (data → machine).
 * All states reachable and closed — no open gaps.
 */

/** @typedef {'parada'|'arrancando'|'viva'|'degradada'|'parando'|'rota'} LeafState */

/** @type {ReadonlyArray<{ event: string, from: LeafState[], to: LeafState }>} */
export const LEAF_TRANSITIONS = Object.freeze([
  { event: 'ARRANQUE_SOLICITADO', from: ['parada'], to: 'arrancando' },
  { event: 'ARRANQUE_SOLICITADO', from: ['viva'], to: 'viva' }, // adopción
  { event: 'PROCESO_VIVO', from: ['arrancando', 'degradada'], to: 'viva' },
  { event: 'SALUD_FALLIDA', from: ['arrancando'], to: 'degradada' },
  { event: 'SALUD_FALLIDA', from: ['viva'], to: 'degradada' },
  { event: 'REINTENTO', from: ['degradada'], to: 'arrancando' },
  { event: 'REINTENTOS_AGOTADOS', from: ['degradada', 'arrancando'], to: 'rota' },
  { event: 'PARADA_SOLICITADA', from: ['viva', 'degradada', 'arrancando'], to: 'parando' },
  { event: 'PROCESO_TERMINADO', from: ['parando'], to: 'parada' },
  { event: 'PROCESO_TERMINADO', from: ['viva', 'degradada'], to: 'degradada' },
  { event: 'ARRANQUE_SOLICITADO', from: ['rota'], to: 'arrancando' }
]);

export const LEAF_STATES = Object.freeze([
  'parada',
  'arrancando',
  'viva',
  'degradada',
  'parando',
  'rota'
]);

/** Game-facing rollup vocabulary (composition maps these; kit stays generic). */
export const LIFE_ROLLUP = Object.freeze({
  viva: 'vivo',
  parada: 'latente',
  rota: 'roto',
  arrancando: 'transicion',
  degradada: 'transicion',
  parando: 'transicion'
});
