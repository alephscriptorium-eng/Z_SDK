/**
 * Reparto v1 — contrato congelado del dominio narrativo (personajes/roles).
 * No inventar campos fuera de este shape.
 *
 * Identidad: el actor es la identidad durable del peer-card (`ssbId`
 * `@….ed25519`). El kit NO crea un espacio de ids propio (cero identidad
 * paralela): `actorSsbId` es exactamente el `ssbId` de la peer-card emitida por
 * `@zeus/protocol` / `@zeus/authority-kit`.
 *
 * Relación: 1 actor (`actorSsbId`) — N personajes (`personajeId`), expresada
 * como N filas `Asignacion` que comparten `actorSsbId`.
 *
 * Permisos de dominio: verbos genéricos de reparto (`PERMISOS`). El personaje
 * lleva un `rol` narrativo; la `politica` mapea rol → permisos que ese rol
 * concede a quien lo interpreta. Sin nombres de juego (D-8).
 *
 * @typedef {object} Personaje
 * @property {string} id      — id estable del personaje
 * @property {string} nombre  — nombre visible del personaje
 * @property {string} rol     — rol narrativo (token de dominio, libre)
 *
 * @typedef {object} Asignacion
 * @property {string} actorSsbId   — identidad durable (ssbId de la peer-card)
 * @property {string} personajeId  — FK a `Personaje.id`
 *
 * @typedef {object} RepartoV1
 * @property {'reparto/1'} version
 * @property {Personaje[]} personajes
 * @property {Asignacion[]} asignaciones
 * @property {Record<string, string[]>} politica  — rol narrativo → permisos[]
 */

import { isSsbId } from '@zeus/protocol';

export const REPARTO_VERSION = 'reparto/1';

/**
 * Catálogo congelado de permisos de dominio (verbos de reparto, genéricos).
 * `leer` = ver la ficha/elenco · `interpretar` = actuar/autorar el personaje
 * asignado · `dirigir` = gestionar el reparto del personaje. Sin nombre de
 * juego (D-8).
 */
export const PERMISOS = Object.freeze([
  'reparto:leer',
  'reparto:interpretar',
  'reparto:dirigir'
]);

/** Motivos de la decisión de permiso (concedido / familia de denegación). */
export const MOTIVOS = Object.freeze({
  CONCEDIDO: 'concedido',
  CARD_NO_VIGENTE: 'card_no_vigente',
  IDENTIDAD_AUSENTE: 'identidad_ausente',
  PERSONAJE_DESCONOCIDO: 'personaje_desconocido',
  PERMISO_DESCONOCIDO: 'permiso_desconocido',
  PERSONAJE_NO_EN_REPARTO: 'personaje_no_en_reparto',
  ROL_SIN_PERMISO: 'rol_sin_permiso'
});

/**
 * @param {unknown} value
 * @returns {value is Personaje}
 */
export function isPersonajeShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const p = /** @type {Record<string, unknown>} */ (value);
  return (
    typeof p.id === 'string' && p.id.length > 0 &&
    typeof p.nombre === 'string' && p.nombre.length > 0 &&
    typeof p.rol === 'string' && p.rol.length > 0
  );
}

/**
 * @param {unknown} value
 * @returns {value is Asignacion}
 */
export function isAsignacionShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const a = /** @type {Record<string, unknown>} */ (value);
  // actorSsbId = identidad durable del peer-card; nunca un id paralelo.
  return isSsbId(a.actorSsbId) && typeof a.personajeId === 'string' && a.personajeId.length > 0;
}

/**
 * ¿El objeto respeta el shape congelado `reparto/1`?
 * Estructural: version, arrays de personajes/asignaciones válidos y `politica`
 * mapa de rol → array de strings.
 * @param {unknown} value
 * @returns {value is RepartoV1}
 */
export function isRepartoShaped(value) {
  if (value == null || typeof value !== 'object') return false;
  const r = /** @type {Record<string, unknown>} */ (value);
  if (r.version !== REPARTO_VERSION) return false;
  if (!Array.isArray(r.personajes) || !r.personajes.every(isPersonajeShaped)) return false;
  if (!Array.isArray(r.asignaciones) || !r.asignaciones.every(isAsignacionShaped)) return false;
  if (r.politica == null || typeof r.politica !== 'object' || Array.isArray(r.politica)) return false;
  for (const permisos of Object.values(/** @type {Record<string, unknown>} */ (r.politica))) {
    if (!Array.isArray(permisos)) return false;
    if (!permisos.every((x) => typeof x === 'string')) return false;
  }
  return true;
}

/** @returns {RepartoV1} reparto vacío bien formado. */
export function repartoVacio() {
  return { version: REPARTO_VERSION, personajes: [], asignaciones: [], politica: {} };
}

/**
 * Constructor validante: aplica shape + integridad referencial y devuelve un
 * reparto congelado. Lanza `TypeError` ante cualquier violación (mismo patrón
 * que `makePeerCard`).
 *
 * @param {object} input
 * @param {Personaje[]} [input.personajes]
 * @param {Asignacion[]} [input.asignaciones]
 * @param {Record<string, string[]>} [input.politica]
 * @returns {Readonly<RepartoV1>}
 */
export function crearReparto({ personajes = [], asignaciones = [], politica = {} } = {}) {
  if (!Array.isArray(personajes) || !personajes.every(isPersonajeShaped)) {
    throw new TypeError('crearReparto: personajes[] inválido');
  }
  const ids = new Set();
  for (const p of personajes) {
    if (ids.has(p.id)) throw new TypeError(`crearReparto: personaje duplicado ${p.id}`);
    ids.add(p.id);
  }
  if (!Array.isArray(asignaciones) || !asignaciones.every(isAsignacionShaped)) {
    throw new TypeError('crearReparto: asignaciones[] inválido (actorSsbId debe ser ssbId)');
  }
  for (const a of asignaciones) {
    if (!ids.has(a.personajeId)) {
      throw new TypeError(`crearReparto: asignacion refiere personaje inexistente ${a.personajeId}`);
    }
  }
  if (politica == null || typeof politica !== 'object' || Array.isArray(politica)) {
    throw new TypeError('crearReparto: politica debe ser un mapa rol → permisos[]');
  }
  /** @type {Record<string, string[]>} */
  const pol = {};
  for (const [rol, permisos] of Object.entries(politica)) {
    if (!Array.isArray(permisos)) {
      throw new TypeError(`crearReparto: politica[${rol}] debe ser array de permisos`);
    }
    for (const permiso of permisos) {
      if (!PERMISOS.includes(permiso)) {
        throw new TypeError(`crearReparto: permiso desconocido "${permiso}" en politica[${rol}]`);
      }
    }
    pol[rol] = Object.freeze([...permisos]);
  }
  const reparto = {
    version: REPARTO_VERSION,
    personajes: Object.freeze(personajes.map((p) => Object.freeze({ id: p.id, nombre: p.nombre, rol: p.rol }))),
    asignaciones: Object.freeze(
      asignaciones.map((a) => Object.freeze({ actorSsbId: a.actorSsbId, personajeId: a.personajeId }))
    ),
    politica: Object.freeze(pol)
  };
  return Object.freeze(reparto);
}
