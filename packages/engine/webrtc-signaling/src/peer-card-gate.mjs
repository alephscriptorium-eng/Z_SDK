/**
 * Torno peer-card del carril WebRTC (WP-U93 / D-20 · Z_SDK #4).
 * Exige card con forma, frescura y rol antes de offer/answer/ICE.
 * Extensión SSB: `ssbId` en handshake + verificación de `seatSignature`.
 *
 * WP-U197: el torno NO se retira ni se ablanda — `assertSignalingPeerCard`
 * conserva su semántica exacta (card ausente = denegada) porque terceros
 * lo consumen como portero de cosas protegidas. La antesala anónima se
 * pide EXPLÍCITAMENTE con `assertSignalingAdmission(card, { admission:
 * 'anonymous' })`, que admite sin card y devuelve `role: null`.
 *
 * WP-U262 — **una decisión, una lectura**. El torno leía varias veces la
 * misma clave dentro de la MISMA decisión (`opts.role` ×2, `opts.
 * expectedSsbId` ×3, y —vía `@zeus/protocol`— `card.scopes` ×11). Con un
 * getter alternante eso no es un detalle de estilo: es fail-OPEN, porque
 * la lectura que EXIGE y la lectura que COMPRUEBA pueden devolver valores
 * distintos. Medido, tres veredictos concedidos de más (ver
 * `plan/REPORTES/WP-U262-lectura-multiple.md`).
 *
 * El arreglo es de CLASE, no de vector: todo lo que entra al torno se
 * MATERIALIZA una vez al entrar (`readGateOpts` / `materializePeerCard`) y
 * la decisión entera se toma sobre esa foto. El endurecimiento es
 * unidireccional: con valores fijos —el 100 % de las rutas internas, que
 * pasan literales— el veredicto es idéntico al de antes; lo único que deja
 * de pasar es lo que cambiaba de valor a mitad de la decisión.
 *
 * Solo importa `@zeus/protocol` (browser-safe) + `@zeus/protocol/peer-card-seat`
 * (Node) para verify — usable desde subpath sin arrastrar `@zeus/rooms`.
 */

import {
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  isSsbId
} from '@zeus/protocol';
import { verifyTravelingPeerCard } from '@zeus/protocol/peer-card-seat';

/**
 * Tipos abstractos que el torno bloquea sin card válida.
 *
 * Frontera confirmada (WP-U186 · paso 0, D-O11 — ver
 * plan/REPORTES/U186-paso0-frontera-room-join.md): los 4 tipos son
 * acciones de la capacidad OPT-IN WebRTC (antesala). `room-join` es el
 * anuncio wire `join-room` (ROOM_MESSAGE dentro de la sala de
 * señalización) que dispara ofertas entre pares — NO la membresía
 * genérica del runtime. El transporte base (CLIENT_REGISTER /
 * CLIENT_SUSCRIBE en socket-core/rooms) no pasa por este torno y admite
 * sesión anónima `role:null`; el rol se consulta EN LA ACCIÓN.
 */
export const PEER_CARD_GATED_TYPES = Object.freeze([
  'offer',
  'answer',
  'ice-candidate',
  'room-join'
]);

const GATED = new Set(PEER_CARD_GATED_TYPES);

/**
 * @param {string} abstractType
 */
export function isPeerCardGatedType(abstractType) {
  return GATED.has(abstractType);
}

/**
 * Claves de `opts` que gobiernan un veredicto del torno (WP-U262).
 * Lista CERRADA a propósito: si mañana el torno pasa a mirar una clave
 * nueva, tiene que aparecer aquí — y el sensor de clase
 * (`u262-lectura-multiple.test.mjs`) se pondrá rojo si no está, porque
 * detectará esa clave leída dos veces.
 */
const GATE_OPT_KEYS = Object.freeze([
  'role',
  'now',
  'requireSsbId',
  'requireSeatSignature',
  'expectedSsbId',
  'admission',
  'claimedSsbId',
  'claimedFrom'
]);

/**
 * Foto de las exigencias: cada clave se lee UNA vez, ANTES de decidir.
 *
 * No es defensa contra un `opts` hostil (quien construye el `opts` es
 * quien exige, no quien pide): es la garantía de que **lo que se exige y
 * lo que se comprueba son el mismo valor**. Sin esto, `opts.role` se leía
 * dos veces —una para saber si hay exigencia, otra para comprobarla— y un
 * getter alternante colaba `player` por `operator`.
 *
 * @param {unknown} opts
 * @returns {Record<string, unknown>}
 */
function readGateOpts(opts) {
  /** @type {Record<string, unknown>} */
  const snapshot = {};
  if (opts == null || (typeof opts !== 'object' && typeof opts !== 'function')) {
    return snapshot;
  }
  for (const key of GATE_OPT_KEYS) snapshot[key] = opts[key];
  return snapshot;
}

/**
 * Foto de la card: cada campo se lee UNA vez, ANTES de decidir.
 *
 * Por qué hace falta aunque `opts` ya esté fotografiado: el torno delega
 * en `@zeus/protocol` (`isPeerCardShaped`, `isPeerCardFresh`,
 * `roleFromPeerCard`, `peerCardGrantsRole`, `verifyTravelingPeerCard`) y
 * esas cinco funciones vuelven a leer los mismos campos — `card.scopes`
 * llega a leerse **11 veces** en una sola llamada. Medido: con `scopes`
 * alternante, una card que sólo acredita `player` pasaba una exigencia de
 * `operator`. Fotografiar aquí cierra la clase entera sin tocar
 * `@zeus/protocol` (que es de otro reparto) y sin ablandar nada.
 *
 * `Object.keys` — claves propias enumerables — NO es una elección
 * arbitraria: es **exactamente la vista sobre la que se firma y se
 * verifica el asiento** (`travelingPeerCardPayload` recorre
 * `Object.keys(card).sort()`). O sea que la foto que juzga el torno es la
 * misma foto que la firma protege.
 *
 * Los arrays se copian un nivel (`scopes` es el que decide el rol): un
 * índice con getter es la misma clase de defecto una capa más abajo.
 *
 * @param {unknown} card
 * @returns {unknown} — la card fotografiada, o el valor tal cual si no es objeto
 */
function materializePeerCard(card) {
  if (card === null || typeof card !== 'object') return card;
  /** @type {Record<string, unknown>} */
  const snapshot = {};
  for (const key of Object.keys(card)) {
    const value = card[key];
    snapshot[key] = Array.isArray(value) ? [...value] : value;
  }
  return snapshot;
}

/**
 * Valida peer-card para señalización: forma + fresca + con rol
 * (y rol concreto si se pide). Si hay `seatSignature`, verifica firma.
 * Con `requireSsbId` / `requireSeatSignature` endurece el torno federado.
 *
 * @param {unknown} card
 * @param {{
 *   role?: string,
 *   now?: number,
 *   requireSsbId?: boolean,
 *   requireSeatSignature?: boolean,
 *   expectedSsbId?: string
 * }} [opts]
 * @returns {{ ok: true, role: string, ssbId?: string } | { ok: false, error: string }}
 */
export function assertSignalingPeerCard(card, opts = {}) {
  // WP-U262 · las dos fotos. A partir de aquí NADA vuelve a leerse del
  // objeto original: la decisión entera se toma sobre `demand` y `subject`.
  const demand = readGateOpts(opts);
  const subject = materializePeerCard(card);

  const now = demand.now ?? Date.now();
  if (!isPeerCardShaped(subject)) {
    return { ok: false, error: 'peer-card missing or malformed' };
  }
  if (!isPeerCardFresh(subject, now)) {
    return { ok: false, error: 'peer-card expired' };
  }
  const granted = roleFromPeerCard(subject);
  if (!granted) {
    return { ok: false, error: 'peer-card has no role' };
  }
  // OJO: `granted` (primer rol declarado) y `requiredRole` NO tienen por
  // qué coincidir aunque la card acredite. Una card con scopes
  // `[role:operator, role:player]` a la que se le exige `player` concede
  // devolviendo `role: 'operator'`, y eso es CORRECTO desde U93 — el
  // arreglo de U262 no puede convertirlo en denegación (probado en
  // `u262-lectura-multiple.test.mjs` · «no cerrar de más»).
  const requiredRole = demand.role;
  if (requiredRole && !peerCardGrantsRole(subject, requiredRole, now)) {
    return { ok: false, error: `peer-card does not grant role:${requiredRole}` };
  }

  const ssbId = subject.ssbId;
  if (demand.requireSsbId || ssbId != null) {
    if (!isSsbId(ssbId)) {
      return { ok: false, error: 'peer-card ssbId missing or malformed' };
    }
  }
  const expectedSsbId = demand.expectedSsbId;
  if (expectedSsbId != null) {
    if (!isSsbId(expectedSsbId)) {
      return { ok: false, error: 'expectedSsbId malformed' };
    }
    if (ssbId !== expectedSsbId) {
      return { ok: false, error: 'peer-card ssbId does not match handshake' };
    }
  }

  const seatSignature = subject.seatSignature;
  const hasSeat = typeof seatSignature === 'string' && seatSignature.length > 0;
  if (demand.requireSeatSignature || hasSeat) {
    if (!hasSeat) {
      return { ok: false, error: 'peer-card seat signature missing' };
    }
    // Se verifica la FOTO, no el original: la firma cubre exactamente
    // `Object.keys(card)`, así que verificar la foto es verificar lo mismo
    // — y además es verificar lo que se acaba de juzgar.
    const seat = verifyTravelingPeerCard(subject);
    if (!seat.ok) {
      return { ok: false, error: `peer-card seat signature rejected: ${seat.error}` };
    }
  }

  /** @type {{ ok: true, role: string, ssbId?: string }} */
  const ok = { ok: true, role: granted };
  if (isSsbId(ssbId)) ok.ssbId = ssbId;
  return ok;
}

/**
 * Modos de **admisión** a la antesala WebRTC (WP-U197).
 *
 * `admisión ≠ permiso`. La admisión decide quién puede intercambiar
 * SDP/ICE en la antesala; NO concede rol ninguno. Corolario de U186
 * (transporte ≠ permiso): el rol se consulta EN LA ACCIÓN
 * (`getSessionRole()`), jamás se deriva de haber completado un
 * handshake.
 *
 * - `peer-card` (**por defecto**, statu quo U186): la antesala es una
 *   capacidad opt-in; sin card no hay offer/answer/ICE.
 * - `anonymous` (WP-U197): la antesala admite pares sin card. Elegirlo
 *   es decisión LOCAL de despliegue (dueño: O, contrato D-O11/O13 de
 *   `plan/REPORTES/U186-paso0-frontera-room-join.md`), nunca algo que
 *   un par remoto pueda presentar ni negociar por el cable.
 */
export const SIGNALING_ADMISSION = Object.freeze({
  peerCard: 'peer-card',
  anonymous: 'anonymous'
});

/**
 * ¿Hay card **presentada**? Regla de presencia idéntica a U186
 * (`socket-room-signaling.mjs:79` — `opts.peerCard != null`):
 * `null`/`undefined` = AUSENTE; cualquier otro valor (incluidos `false`,
 * `0`, `''`, `{}`) = PRESENTADO ⇒ se valida y, si no acredita, RECHAZA.
 * «Presentada y falsa» nunca degrada a «ausente».
 *
 * @param {unknown} card
 * @returns {boolean}
 */
export function isPeerCardPresented(card) {
  return card !== null && card !== undefined;
}

/**
 * Admisión a la antesala WebRTC (WP-U197) — envoltura EXPLÍCITA sobre el
 * torno de U186. `assertSignalingPeerCard` no cambia de semántica: quien
 * lo llama directo (p. ej. el carril LAN de blobs,
 * `packages/mesh/blob-sync-harness/src/lan-gate.mjs:23`) sigue exigiendo
 * card. Sólo se es anónimo si se pide `admission: 'anonymous'` aquí.
 *
 * Reglas (fail-closed en el medio):
 * - **sin claim y sin card** → anónimo admitido, `role: null`.
 * - **card presentada** → se valida con el torno U186; inválida = RECHAZA
 *   (jamás «degrada» a anónimo, aunque el modo sea anónimo).
 * - **claim de identidad sin card** (`ssbId` en el handshake, o `from`
 *   con forma de feed SSB) → DENIEGA: anónimo es anónimo, no un
 *   pasaporte sin sello.
 * - cualquier exigencia configurada (`role`, `requireSsbId`,
 *   `requireSeatSignature`) vuelve a exigir card aunque el modo sea
 *   anónimo: la ausencia deniega.
 *
 * @param {unknown} card
 * @param {{
 *   admission?: string,
 *   role?: string,
 *   now?: number,
 *   requireSsbId?: boolean,
 *   requireSeatSignature?: boolean,
 *   expectedSsbId?: string,
 *   claimedSsbId?: unknown,
 *   claimedFrom?: unknown
 * }} [opts]
 * @returns {{ ok: true, anonymous: true, role: null }
 *   | { ok: true, anonymous: false, role: string, ssbId?: string }
 *   | { ok: false, anonymous: false, error: string }}
 */
export function assertSignalingAdmission(card, opts = {}) {
  // WP-U262 · foto ÚNICA de las exigencias, compartida con el torno U186.
  // Antes esta función era inmune por accidente (cada opt caía en una sola
  // rama); ahora lo es por construcción, y `assertSignalingPeerCard` recibe
  // la MISMA foto que decidió `demandsCard` — no una segunda lectura.
  const demand = readGateOpts(opts);
  if (isPeerCardPresented(card)) {
    const check = assertSignalingPeerCard(card, demand);
    if (!check.ok) return { ok: false, anonymous: false, error: check.error };
    return { ...check, anonymous: false };
  }

  const anonymousMode = demand.admission === SIGNALING_ADMISSION.anonymous;
  // D1 (devolución): truthiness, NO `=== true`. El torno U186 lee estas
  // mismas exigencias por truthiness (`:85`, `:100`); si aquí se leyeran
  // por identidad estricta, una exigencia configurada con un truthy
  // no-booleano (`requireSsbId: 1`) se descartaría en silencio y la
  // admisión anónima quedaría fail-OPEN contra lo declarado. Las dos
  // caras del mismo fichero tienen que leer el opt igual.
  const demandsCard =
    !anonymousMode ||
    Boolean(demand.role) ||
    Boolean(demand.requireSsbId) ||
    Boolean(demand.requireSeatSignature);

  if (demandsCard) {
    // Mismo veredicto y mismo texto que el torno U186 ante card ausente:
    // una sola fuente de la denegación, sin ruta paralela.
    const denied = assertSignalingPeerCard(card, demand);
    return {
      ok: false,
      anonymous: false,
      error: denied.ok ? 'peer-card required' : denied.error
    };
  }

  if (demand.claimedSsbId != null || isSsbId(demand.claimedFrom)) {
    return {
      ok: false,
      anonymous: false,
      error: 'anonymous signaling carries an unproven identity claim (ssbId)'
    };
  }

  return { ok: true, anonymous: true, role: null };
}

/**
 * Extrae peer-card de un mensaje abstracto o payload wire.
 *
 * WP-U262: `comprobar y devolver` se hacía con DOS lecturas
 * (`x.peerCard != null` y luego `return x.peerCard`) — se comprobaba una
 * card y se devolvía otra. Ahora se lee una vez y se devuelve lo leído.
 *
 * @param {object} [messageOrPayload]
 * @returns {unknown}
 */
export function peerCardFromMessage(messageOrPayload) {
  if (!messageOrPayload || typeof messageOrPayload !== 'object') return null;
  const top = messageOrPayload.peerCard;
  if (top != null) return top;
  const data = messageOrPayload.data;
  if (data && typeof data === 'object') {
    const nested = data.peerCard;
    if (nested != null) return nested;
  }
  return null;
}

/**
 * Extrae `ssbId` del handshake (top-level, data, o card).
 *
 * WP-U262, dos lecturas múltiples cerradas:
 *  1. dentro: `isSsbId(x.ssbId)` + `return x.ssbId` — se validaba un feed
 *     id y se devolvía el siguiente. Ahora una lectura por sitio.
 *  2. entre llamadas: quien recibe un mensaje llamaba a
 *     `peerCardFromMessage(payload)` y a `ssbIdFromMessage(payload)` por
 *     separado ⇒ `payload.peerCard` se leía **4 veces** en la misma
 *     decisión, y el mensaje resultante podía quedarse con la card de una
 *     lectura y el `ssbId` de otra. El 2.º parámetro deja pasar la card ya
 *     extraída: `undefined` = extráela tú (compatible con todo lo
 *     existente); `null` = no había card, no la busques.
 *
 * @param {object} [messageOrPayload]
 * @param {unknown} [card] — card ya extraída del MISMO mensaje
 * @returns {string|null}
 */
export function ssbIdFromMessage(messageOrPayload, card) {
  if (!messageOrPayload || typeof messageOrPayload !== 'object') return null;
  const top = messageOrPayload.ssbId;
  if (isSsbId(top)) return top;
  const data = messageOrPayload.data;
  if (data && typeof data === 'object') {
    const nested = data.ssbId;
    if (isSsbId(nested)) return nested;
  }
  const fromCard = card === undefined ? peerCardFromMessage(messageOrPayload) : card;
  if (fromCard && typeof fromCard === 'object') {
    const cardSsbId = fromCard.ssbId;
    if (isSsbId(cardSsbId)) return cardSsbId;
  }
  return null;
}
