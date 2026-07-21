/**
 * Single projector: process actors → game-facing barrio + ciudad snapshot.
 * Wake round-trip with Z03 authority uses wake-sync (injected domain); this
 * file remains the unique process→game projection.
 */

import { projectTreeLife } from '@zeus/lifecycle-kit';
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

  const barrioLives = Object.values(barrios).map((b) => b.life);
  const ciudadLife = projectTreeLife(barrioLives);
  const ciudadEstado =
    ciudadLife === 'vivo' ? 'vivo' : ciudadLife === 'roto' ? 'roto' : 'latente';

  return {
    at: new Date().toISOString(),
    ciudad: { life: ciudadLife, estado: ciudadEstado },
    barrios,
    ledger: [...runtime.ledger]
  };
}
