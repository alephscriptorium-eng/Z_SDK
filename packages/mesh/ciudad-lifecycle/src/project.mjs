/**
 * Single projector: process actors → game-facing barrio snapshot + ledger hechos.
 * Wake round-trip with Z03 authority = <pendiente> if not wired; projection is local truth here.
 */

import { ARBOL_F1 } from './catalog-extend.mjs';

/**
 * @param {import('./runtime.mjs').CityLifecycleRuntime} runtime
 */
export function projectSnapshot(runtime) {
  const barrios = {};
  for (const barrioId of Object.keys(ARBOL_F1.barrios)) {
    const life = runtime.rollupBarrio(barrioId);
    const gameEstado =
      life === 'vivo' ? 'vivo' : life === 'roto' ? 'roto' : 'latente';
    barrios[barrioId] = {
      ...ARBOL_F1.barrios[barrioId],
      estado: gameEstado,
      life,
      maquinarias: runtime.snapshotsBarrio(barrioId)
    };
  }
  return {
    at: new Date().toISOString(),
    barrios,
    ledger: [...runtime.ledger]
  };
}
