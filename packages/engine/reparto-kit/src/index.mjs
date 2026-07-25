/**
 * @zeus/reparto-kit — reparto del dominio narrativo (personajes/roles) y
 * permisos de dominio, montados sobre identidad y seats EXISTENTES
 * (`@zeus/protocol` peer-card/seat + `@zeus/authority-kit`). Cero identidad
 * paralela; sin nombres de juego (D-8).
 *
 * El core (`.`) importa solo `@zeus/protocol` (incluido
 * `@zeus/protocol/peer-card-seat` para verificar el asiento, que usa
 * `node:crypto` → la evaluación de permisos con asiento es node-side). El
 * adaptador de vista, que consume el cast-table de `@zeus/view-kit`, vive en el
 * subpath `./vista` para no arrastrar la cadena 3D al core.
 */

export {
  REPARTO_VERSION,
  PERMISOS,
  MOTIVOS,
  isPersonajeShaped,
  isAsignacionShaped,
  isRepartoShaped,
  repartoVacio,
  crearReparto
} from './tipos.mjs';

export {
  actorDeCard,
  personajesDeActor,
  actoresDePersonaje,
  permisosDePersonaje,
  evaluarPermiso,
  puede
} from './permisos.mjs';

export { blobReparto, validarReparto, patronCegueraDesdeEnv } from './validar.mjs';

export { filasCastDesdeReparto } from './filas.mjs';
