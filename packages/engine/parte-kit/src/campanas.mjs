/**
 * Campanas — clasifica titulares del ParteDeCiudad en clases sonoras.
 * Fuente = plantillas fijas (calculadora); sin LLM; sin Audio API.
 *
 * Clases: despertar · degradar · roto
 * Titulares sin clase (censo / work / igual_vivo) → null (silencio).
 */

import { PLANTILLAS } from './plantillas.mjs';
import { isParteDeCiudadShaped } from './tipos.mjs';

/** @typedef {'despertar'|'degradar'|'roto'} ClaseCampana */

export const CLASES_CAMPANA = Object.freeze(['despertar', 'degradar', 'roto']);

/** Sufijos/plantillas → clase (tabla, no switch). */
const MARCAS = Object.freeze([
  { clase: 'roto', marca: 'queda roto' },
  { clase: 'despertar', marca: 'gana pulso' },
  { clase: 'degradar', marca: 'pierde pulso' },
  { clase: 'degradar', marca: 'espera relevo' },
  { clase: 'degradar', marca: 'sin pulso' },
]);

/**
 * @param {string} titular
 * @returns {ClaseCampana|null}
 */
export function claseTitular(titular) {
  if (typeof titular !== 'string' || !titular) return null;
  for (const { clase, marca } of MARCAS) {
    if (titular.includes(marca)) return /** @type {ClaseCampana} */ (clase);
  }
  return null;
}

/**
 * Un evento por clase presente en el parte (orden CLASES_CAMPANA; máx 3).
 * @param {import('./tipos.mjs').ParteDeCiudad|null|undefined} parte
 * @returns {Array<{ clase: ClaseCampana, titular: string }>}
 */
export function campanasDesdeParte(parte) {
  if (!parte || !isParteDeCiudadShaped(parte)) return [];
  /** @type {Map<ClaseCampana, string>} */
  const first = new Map();
  for (const t of parte.titulares) {
    const c = claseTitular(t);
    if (c && !first.has(c)) first.set(c, t);
  }
  /** @type {Array<{ clase: ClaseCampana, titular: string }>} */
  const out = [];
  for (const c of CLASES_CAMPANA) {
    const titular = first.get(/** @type {ClaseCampana} */ (c));
    if (titular != null) out.push({ clase: /** @type {ClaseCampana} */ (c), titular });
  }
  return out;
}

/**
 * Sanity: marcas deben coincidir con plantillas congeladas.
 * @returns {boolean}
 */
export function campanasPlantillasOk() {
  return (
    PLANTILLAS.ROTO.includes('queda roto') &&
    PLANTILLAS.SUBIO.includes('gana pulso') &&
    PLANTILLAS.BAJO.includes('pierde pulso') &&
    PLANTILLAS.LATENTE.includes('espera relevo') &&
    PLANTILLAS.MUERTO.includes('sin pulso')
  );
}
