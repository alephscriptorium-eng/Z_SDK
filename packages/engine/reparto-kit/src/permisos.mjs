/**
 * Permisos de dominio del reparto, montados sobre la peer-card existente.
 *
 * La identidad del actor SIEMPRE se resuelve desde el `ssbId` de la peer-card
 * (`@zeus/protocol`): cero identidad paralela. La vigencia se comprueba con el
 * ciclo de vida no-crypto de la propia peer-card (`isPeerCardFresh`).
 *
 * Decisión = f(reparto, card, personajeId, permiso):
 *   1. card vigente (TTL)                         → si no: card_no_vigente
 *   2. identidad durable presente (ssbId)         → si no: identidad_ausente
 *   3. asiento SSB verificado por el protocol      → si no: seat_invalido / seat_ausente
 *   4. permiso del catálogo                        → si no: permiso_desconocido
 *   5. personaje existe en el reparto              → si no: personaje_desconocido
 *   6. personaje asignado a ESTE actor             → si no: personaje_no_en_reparto
 *   7. el rol del personaje concede el permiso     → si no: rol_sin_permiso
 *   → concedido
 *
 * Asiento (paso 3): si la card trae `seatSignature`, se exige que verifique con
 * `verifyTravelingPeerCard` del protocol (esto ata el `ssbId` a la firma: un
 * `ssbId` manipulado post-firma NO verifica → `seat_invalido`). Card SIN
 * `seatSignature` = identidad no acreditada por asiento: por defecto se acepta
 * (el llamador es responsable de haber autenticado la card); con
 * `exigirSeat:true` se deniega (`seat_ausente`) para forzar frontera de asiento.
 */

import { isSsbId, isPeerCardFresh, roleFromPeerCard } from '@zeus/protocol';
// Verificación de asiento SSB: se DELEGA en el protocol (node:crypto ed25519).
// No se reimplementa cripto aquí. Esto hace que la evaluación de permisos con
// asiento sea node-side (autoridad); el adaptador de vista (`./vista`) es aparte.
import { verifyTravelingPeerCard } from '@zeus/protocol/peer-card-seat';
import { PERMISOS, MOTIVOS } from './tipos.mjs';

/**
 * Identidad durable del actor tomada de la peer-card (nunca inventada).
 * @param {object} card
 * @returns {string|null} ssbId `@….ed25519` o null
 */
export function actorDeCard(card) {
  const id = card?.ssbId;
  return isSsbId(id) ? id : null;
}

/**
 * Personajes que interpreta un actor (1 actor — N personajes).
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {string} actorSsbId
 * @returns {import('./tipos.mjs').Personaje[]}
 */
export function personajesDeActor(reparto, actorSsbId) {
  const ids = new Set(
    reparto.asignaciones.filter((a) => a.actorSsbId === actorSsbId).map((a) => a.personajeId)
  );
  return reparto.personajes.filter((p) => ids.has(p.id));
}

/**
 * Actores (ssbId) que interpretan un personaje.
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {string} personajeId
 * @returns {string[]}
 */
export function actoresDePersonaje(reparto, personajeId) {
  return reparto.asignaciones.filter((a) => a.personajeId === personajeId).map((a) => a.actorSsbId);
}

/**
 * Permisos que concede el rol de un personaje según la política.
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {string} personajeId
 * @returns {string[]}
 */
export function permisosDePersonaje(reparto, personajeId) {
  const personaje = reparto.personajes.find((p) => p.id === personajeId);
  if (!personaje) return [];
  const permisos = reparto.politica[personaje.rol];
  return Array.isArray(permisos) ? [...permisos] : [];
}

/**
 * @typedef {object} DecisionPermiso
 * @property {boolean} ok
 * @property {string} motivo               — uno de MOTIVOS
 * @property {string|null} actorSsbId      — identidad durable resuelta (o null)
 * @property {string|null} [personajeId]
 * @property {string|null} [rol]           — rol narrativo del personaje
 * @property {string|null} [asiento]       — rol de asiento del peer-card (advisory)
 * @property {string} [permiso]
 * @property {string} [seatError]          — error de verifyTravelingPeerCard si seat_invalido
 */

/**
 * Evalúa el permiso de dominio de un actor (peer-card) sobre un personaje.
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {object} card — peer-card de `@zeus/protocol` (con `ssbId`)
 * @param {object} q
 * @param {string} q.personajeId
 * @param {string} q.permiso
 * @param {number} [q.now=Date.now()]
 * @param {boolean} [q.exigirSeat=false] — si true, deniega cards sin seatSignature
 * @returns {DecisionPermiso}
 */
export function evaluarPermiso(
  reparto,
  card,
  { personajeId, permiso, now = Date.now(), exigirSeat = false } = {}
) {
  const asiento = roleFromPeerCard(card) ?? null;
  if (!isPeerCardFresh(card, now)) {
    return deny(MOTIVOS.CARD_NO_VIGENTE, { actorSsbId: actorDeCard(card), personajeId, asiento, permiso });
  }
  const actorSsbId = actorDeCard(card);
  if (!actorSsbId) {
    return deny(MOTIVOS.IDENTIDAD_AUSENTE, { actorSsbId: null, personajeId, asiento, permiso });
  }
  // Paso 3: verificación de asiento SSB delegada en el protocol (sin cripto propia).
  const tieneSeat = card != null && card.seatSignature != null && card.seatSignature !== '';
  if (tieneSeat) {
    const v = verifyTravelingPeerCard(card);
    if (!v.ok) {
      return deny(MOTIVOS.SEAT_INVALIDO, { actorSsbId, personajeId, asiento, permiso, seatError: v.error });
    }
  } else if (exigirSeat) {
    return deny(MOTIVOS.SEAT_AUSENTE, { actorSsbId, personajeId, asiento, permiso });
  }
  if (!PERMISOS.includes(permiso)) {
    return deny(MOTIVOS.PERMISO_DESCONOCIDO, { actorSsbId, personajeId, asiento, permiso });
  }
  const personaje = reparto.personajes.find((p) => p.id === personajeId);
  if (!personaje) {
    return deny(MOTIVOS.PERSONAJE_DESCONOCIDO, { actorSsbId, personajeId, asiento, permiso });
  }
  const asignado = reparto.asignaciones.some(
    (a) => a.actorSsbId === actorSsbId && a.personajeId === personajeId
  );
  if (!asignado) {
    return deny(MOTIVOS.PERSONAJE_NO_EN_REPARTO, {
      actorSsbId, personajeId, rol: personaje.rol, asiento, permiso
    });
  }
  const permisosRol = reparto.politica[personaje.rol];
  if (!Array.isArray(permisosRol) || !permisosRol.includes(permiso)) {
    return deny(MOTIVOS.ROL_SIN_PERMISO, {
      actorSsbId, personajeId, rol: personaje.rol, asiento, permiso
    });
  }
  return {
    ok: true,
    motivo: MOTIVOS.CONCEDIDO,
    actorSsbId,
    personajeId,
    rol: personaje.rol,
    asiento,
    permiso
  };
}

/**
 * Azúcar booleano sobre `evaluarPermiso`.
 * @param {import('./tipos.mjs').RepartoV1} reparto
 * @param {object} card
 * @param {string} personajeId
 * @param {string} permiso
 * @param {number|{ now?: number, exigirSeat?: boolean }} [opts] — `now` (compat) u opciones
 * @returns {boolean}
 */
export function puede(reparto, card, personajeId, permiso, opts = {}) {
  const q = typeof opts === 'number' ? { now: opts } : { ...opts };
  return evaluarPermiso(reparto, card, { personajeId, permiso, ...q }).ok;
}

/**
 * @param {string} motivo
 * @param {Partial<DecisionPermiso>} extra
 * @returns {DecisionPermiso}
 */
function deny(motivo, extra = {}) {
  return { ok: false, motivo, actorSsbId: null, ...extra };
}
