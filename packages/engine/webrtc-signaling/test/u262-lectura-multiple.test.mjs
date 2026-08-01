/**
 * WP-U262 — **una decisión, una lectura**.
 *
 * El defecto: el portero de peer-cards leía VARIAS VECES la misma clave
 * dentro de la misma decisión. Con un valor fijo da igual; con un objeto de
 * getters alternantes, la lectura que EXIGE y la lectura que COMPRUEBA
 * devuelven cosas distintas y el portero **concede lo que no debía**.
 *
 * Por qué esta suite existe y no dos pruebas más: la ficha llegó con DOS
 * vectores medidos (`opts.role` y `opts.expectedSsbId`), y arreglar dos
 * vectores no cierra una clase. El barrido con proxies contadores encontró
 * un tercero que la ficha no listaba —`card.scopes`, leída **11 veces** vía
 * `@zeus/protocol`— con el mismo fail-open. De ahí que el sensor de esta
 * suite no mida vectores: mide **la operación**. Si alguien vuelve a leer
 * dos veces lo mismo dentro de una decisión del torno, `sensor de clase`
 * se pone rojo aunque nadie escriba el vector.
 *
 * Las dos pruebas que AFIRMABAN el defecto viven, invertidas, en
 * `u251-devolucion.test.mjs` §«evidencia U262». No se borraron.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  generateSeatKeyPair,
  signTravelingPeerCard
} from '@zeus/protocol/peer-card-seat';
import {
  assertSignalingPeerCard,
  assertSignalingAdmission,
  peerCardFromMessage,
  ssbIdFromMessage,
  SIGNALING_ADMISSION
} from '../src/peer-card-gate.mjs';

const NOW = 1_700_000_000_000;
const seat = generateSeatKeyPair();
const otroSeat = generateSeatKeyPair();
const FEED = seat.ssbId;
const FEED_B = otroSeat.ssbId;

function card(over = {}) {
  return makePeerCard({
    roomId: 'R1',
    endpoint: 'http://test.local/runtime',
    token: 'tok',
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: NOW + 60_000,
    issuedAt: NOW - 1_000,
    sessionId: 'a',
    ...over
  });
}

function signedCard() {
  return signTravelingPeerCard(card({ ssbId: FEED }), seat.privateKey, FEED);
}

/** Cuenta cada lectura de propiedad de `target`. */
function espia(target, counts) {
  return new Proxy(target, {
    get(t, prop, recv) {
      if (typeof prop === 'string') counts.set(prop, (counts.get(prop) ?? 0) + 1);
      return Reflect.get(t, prop, recv);
    }
  });
}

function repetidas(counts) {
  return [...counts].filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`);
}

// ═══════════════════════════════════════════════════════════════════════
// 1 · SENSOR DE CLASE — no mide vectores, mide la OPERACIÓN
//
// Medido contra la base (antes del arreglo): 9 claves de `opts` y 37 de
// `card` leídas más de una vez en este mismo barrido.
// ═══════════════════════════════════════════════════════════════════════

test('sensor de clase: ninguna decisión del torno lee dos veces la misma clave', () => {
  /** @type {Array<[string, () => unknown, unknown, unknown]>} */
  const casos = [];
  const añade = (nombre, cardObj, optsObj) => casos.push([nombre, cardObj, optsObj]);

  añade('concede con todo exigido', signedCard(), {
    role: 'player',
    now: NOW,
    requireSsbId: true,
    requireSeatSignature: true,
    expectedSsbId: FEED
  });
  añade('deniega por rol', signedCard(), { now: NOW, role: 'operator' });
  añade('deniega por expectedSsbId', signedCard(), { now: NOW, expectedSsbId: FEED_B });
  añade('deniega por firma', { ...signedCard(), token: 'otro' }, {
    now: NOW,
    requireSeatSignature: true
  });
  añade('card sin ssbId ni firma', card(), { now: NOW });
  añade('card caducada', card({ expiresAt: NOW - 1 }), { now: NOW });
  añade('card sin rol', card({ scopes: ['presence:join'] }), { now: NOW });

  const fallos = [];
  for (const [nombre, cardObj, optsObj] of casos) {
    for (const [api, fn] of [
      ['assertSignalingPeerCard', assertSignalingPeerCard],
      ['assertSignalingAdmission', assertSignalingAdmission]
    ]) {
      const cOpts = new Map();
      const cCard = new Map();
      fn(espia(cardObj, cCard), espia(optsObj, cOpts));
      const dupO = repetidas(cOpts);
      const dupC = repetidas(cCard);
      if (dupO.length) fallos.push(`${api} · ${nombre} · opts: ${dupO.join(', ')}`);
      if (dupC.length) fallos.push(`${api} · ${nombre} · card: ${dupC.join(', ')}`);
    }
  }

  // Admisión anónima: sin card, todo el peso está en `opts`.
  for (const optsObj of [
    { admission: SIGNALING_ADMISSION.anonymous },
    { admission: SIGNALING_ADMISSION.anonymous, requireSsbId: true },
    { admission: SIGNALING_ADMISSION.anonymous, role: 'player' },
    { admission: SIGNALING_ADMISSION.anonymous, claimedSsbId: FEED },
    { admission: SIGNALING_ADMISSION.anonymous, claimedFrom: FEED },
    { admission: SIGNALING_ADMISSION.peerCard }
  ]) {
    const cOpts = new Map();
    assertSignalingAdmission(null, espia(optsObj, cOpts));
    const dup = repetidas(cOpts);
    if (dup.length) fallos.push(`assertSignalingAdmission · anónimo · opts: ${dup.join(', ')}`);
  }

  assert.deepEqual(fallos, [], `lecturas múltiples dentro de una decisión:\n${fallos.join('\n')}`);
});

test('sensor de clase: los extractores devuelven lo que comprobaron (una lectura por sitio)', () => {
  const fallos = [];
  /** @param {string} nombre @param {(espiar: Function) => void} corre */
  const mide = (nombre, corre) => {
    const cuentas = [];
    corre((obj, etiqueta) => {
      const c = new Map();
      cuentas.push([etiqueta, c]);
      return espia(obj, c);
    });
    for (const [etiqueta, c] of cuentas) {
      const dup = repetidas(c);
      if (dup.length) fallos.push(`${nombre} · ${etiqueta}: ${dup.join(', ')}`);
    }
  };

  mide('peerCardFromMessage · top-level', (E) => peerCardFromMessage(E({ peerCard: card() }, 'msg')));
  mide('peerCardFromMessage · en data', (E) => {
    const data = E({ peerCard: card() }, 'data');
    peerCardFromMessage(E({ data }, 'msg'));
  });
  mide('ssbIdFromMessage · top-level', (E) => ssbIdFromMessage(E({ ssbId: FEED }, 'msg')));
  mide('ssbIdFromMessage · en data', (E) => {
    const data = E({ ssbId: FEED }, 'data');
    ssbIdFromMessage(E({ data }, 'msg'));
  });
  mide('ssbIdFromMessage · en card', (E) => {
    const c = E({ ssbId: FEED }, 'card');
    ssbIdFromMessage(E({ peerCard: c }, 'msg'));
  });
  // El patrón REAL de quien recibe un mensaje (`_onWirePayload`,
  // `_onPrivateMsg`, `handleMessage`): antes leía `payload.peerCard` 4
  // veces entre los dos extractores y podía quedarse con la card de una
  // lectura y el `ssbId` de otra.
  mide('extracción completa de un payload entrante', (E) => {
    const c = E({ ssbId: FEED }, 'card');
    const msg = E({ peerCard: c }, 'msg');
    const pc = peerCardFromMessage(msg);
    ssbIdFromMessage(msg, pc);
  });

  assert.deepEqual(fallos, [], `lecturas múltiples en los extractores:\n${fallos.join('\n')}`);
});

// ═══════════════════════════════════════════════════════════════════════
// 2 · EL TERCER VECTOR — el que la ficha NO listaba
// ═══════════════════════════════════════════════════════════════════════

test('vector 3 (card): `scopes` alternante ya no cuela un rol que la card no acredita', () => {
  const soloPlayer = card({ scopes: [roleScope('player')] });
  const soloOperator = card({ scopes: [roleScope('operator')] });

  let n = 0;
  const alternante = {
    roomId: soloPlayer.roomId,
    endpoint: soloPlayer.endpoint,
    token: soloPlayer.token,
    issuedAt: soloPlayer.issuedAt,
    expiresAt: soloPlayer.expiresAt,
    get scopes() {
      n += 1;
      // Contra la base: la lectura 5 producía `granted` y la 8 era la que
      // comparaba con el rol exigido ⇒ {ok:true, role:'player'} exigiendo
      // 'operator'. Aquí sólo puede haber una lectura, así que la secuencia
      // es irrelevante — que es justo lo que hay que demostrar.
      return n >= 6 ? soloOperator.scopes : soloPlayer.scopes;
    }
  };

  const check = assertSignalingPeerCard(alternante, { now: NOW, role: 'operator' });
  assert.equal(n, 1, 'el torno lee `card.scopes` UNA vez (contra la base: 8-11)');
  assert.equal(check.ok, false, 'una card que sólo acredita `player` no pasa una exigencia de `operator`');
  assert.match(check.error, /does not grant role:operator/);

  // Los dos lados con valor FIJO, sin mover: el que no acredita deniega y
  // el que acredita concede.
  assert.equal(assertSignalingPeerCard(soloPlayer, { now: NOW, role: 'operator' }).ok, false);
  assert.deepEqual(assertSignalingPeerCard(soloOperator, { now: NOW, role: 'operator' }), {
    ok: true,
    role: 'operator'
  });
});

test('vector 3 bis: un índice alternante DENTRO de `scopes` tampoco mueve el veredicto', () => {
  // El getter se instala DESPUÉS de `makePeerCard` a propósito: la fábrica
  // copia `scopes` (`[...scopes]`), así que ponerlo antes no mide nada.
  // Contra la base este vector concede `{ok:true, role:'player'}` habiendo
  // exigido `operator` — es la misma clase, una capa más abajo, y por eso
  // la foto de la card copia los arrays.
  const c = card({ scopes: [roleScope('player')] });
  let n = 0;
  Object.defineProperty(c.scopes, 0, {
    get() {
      n += 1;
      return n >= 2 ? roleScope('operator') : roleScope('player');
    },
    enumerable: true,
    configurable: true
  });
  const check = assertSignalingPeerCard(c, { now: NOW, role: 'operator' });
  assert.equal(n, 1, 'el array se copia UNA vez: no hay segunda lectura del índice');
  assert.equal(check.ok, false, 'una card que sólo acredita `player` sigue sin pasar `operator`');
  assert.match(check.error, /does not grant role:operator/);
});

test('vector extractores: se devuelve la card comprobada, no la siguiente lectura', () => {
  const buena = card();
  const otra = card({ token: 'tok-OTRO' });
  let n = 0;
  const msg = {
    get peerCard() {
      n += 1;
      return n === 1 ? buena : otra;
    }
  };
  const extraida = peerCardFromMessage(msg);
  assert.equal(n, 1, 'una lectura');
  assert.equal(extraida, buena, 'lo devuelto ES lo comprobado');

  let m = 0;
  const msgId = {
    get ssbId() {
      m += 1;
      return m === 1 ? FEED : FEED_B;
    }
  };
  assert.equal(ssbIdFromMessage(msgId), FEED, 'el feed validado es el feed devuelto');
  assert.equal(m, 1);
});

// ═══════════════════════════════════════════════════════════════════════
// 3 · NO CERRAR DE MÁS — los dos lados, con valores fijos
//
// El diferencial completo contra la implementación base (656 veredictos:
// 16 formas de card × 19 juegos de `opts` × 2 APIs + extractores) dio
// **0 diferencias**. Aquí quedan fijadas las que más fácil se romperían
// al «endurecer» de más.
// ═══════════════════════════════════════════════════════════════════════

test('no cerrar de más: la card multi-rol sigue concediendo por un rol que NO es el primero', () => {
  // `roleFromPeerCard` devuelve el PRIMER rol declarado; `peerCardGrantsRole`
  // acepta cualquiera de los declarados. Que `granted` ≠ `role exigido` es
  // legal desde U93 — un arreglo que exigiera que coincidieran sería un
  // cierre de más disfrazado de endurecimiento.
  const multi = card({ scopes: [roleScope('operator'), roleScope('player')] });
  assert.deepEqual(assertSignalingPeerCard(multi, { now: NOW, role: 'player' }), {
    ok: true,
    role: 'operator'
  });
  assert.deepEqual(assertSignalingPeerCard(multi, { now: NOW, role: 'operator' }), {
    ok: true,
    role: 'operator'
  });
});

test('no cerrar de más: card legítima, firmada y amarrada, sigue pasando el torno entero', () => {
  const firmada = signedCard();
  assert.deepEqual(
    assertSignalingPeerCard(firmada, {
      now: NOW,
      role: 'player',
      requireSsbId: true,
      requireSeatSignature: true,
      expectedSsbId: FEED
    }),
    { ok: true, role: 'player', ssbId: FEED }
  );
  // La foto que juzga el torno es `Object.keys(card)` — exactamente la
  // vista que la firma de asiento cubre. Verificar la foto es verificar lo
  // mismo: si esto se rompiera, ninguna card firmada pasaría.
  assert.deepEqual(assertSignalingAdmission(firmada, {
    now: NOW,
    admission: SIGNALING_ADMISSION.peerCard,
    requireSeatSignature: true
  }), { ok: true, anonymous: false, role: 'player', ssbId: FEED });
});

test('no cerrar de más: cards congeladas y con getters ESTABLES siguen concediendo', () => {
  assert.deepEqual(assertSignalingPeerCard(Object.freeze(card()), { now: NOW }), {
    ok: true,
    role: 'player'
  });
  const conGetter = { ...card() };
  delete conGetter.scopes;
  Object.defineProperty(conGetter, 'scopes', {
    get: () => [roleScope('player')],
    enumerable: true
  });
  assert.deepEqual(assertSignalingPeerCard(conGetter, { now: NOW, role: 'player' }), {
    ok: true,
    role: 'player'
  });
});

test('el endurecimiento es unidireccional: lo único que deja de pasar, DENIEGA', () => {
  // Las dos formas de card cuyo veredicto SÍ se movió respecto de la base,
  // medidas: campos heredados del prototipo y campos propios NO
  // enumerables. Las dos pasan de conceder a DENEGAR — ningún par obtiene
  // nada que antes no tuviera.
  //
  // No es un cierre gratuito: `travelingPeerCardPayload` (la vista que la
  // firma protege) ya recorría sólo `Object.keys(card)`, así que una card
  // con esa forma jamás pudo llevar asiento verificable. El torno pasa a
  // opinar lo mismo que la capa de firma.
  const plana = card();
  assert.equal(assertSignalingPeerCard(Object.create(plana), { now: NOW }).ok, false);

  const noEnumerable = {};
  for (const [k, v] of Object.entries(plana)) {
    Object.defineProperty(noEnumerable, k, { value: v, enumerable: false });
  }
  assert.equal(assertSignalingPeerCard(noEnumerable, { now: NOW }).ok, false);

  // Y un campo oculto AÑADIDO a una card por lo demás normal no cambia
  // nada: lo que la firma no cubre, el torno tampoco lo mira.
  const conOculto = { ...signedCard() };
  Object.defineProperty(conOculto, 'oculto', { value: 'x', enumerable: false });
  assert.equal(
    assertSignalingPeerCard(conOculto, { now: NOW, requireSeatSignature: true }).ok,
    true
  );
});

// ═══════════════════════════════════════════════════════════════════════
// 4 · LA FRONTERA NO SE MOVIÓ
//
// El vector de frontera end-to-end es el de `u251-menores.test.mjs`
// («frontera: tras los seis arreglos, el anónimo sigue sin obtener permiso
// alguno») y sigue verde. Aquí, la frontera en el propio torno.
// ═══════════════════════════════════════════════════════════════════════

test('frontera: el anónimo sigue sin obtener nada, y una card ausente sigue denegada', () => {
  // Admisión anónima: admite, pero no concede rol.
  assert.deepEqual(
    assertSignalingAdmission(null, { now: NOW, admission: SIGNALING_ADMISSION.anonymous }),
    { ok: true, anonymous: true, role: null }
  );
  // Cualquier exigencia vuelve a pedir card, aunque el modo sea anónimo.
  for (const exigencia of [{ role: 'player' }, { requireSsbId: true }, { requireSeatSignature: true }]) {
    const r = assertSignalingAdmission(null, {
      now: NOW,
      admission: SIGNALING_ADMISSION.anonymous,
      ...exigencia
    });
    assert.equal(r.ok, false, `la exigencia ${JSON.stringify(exigencia)} sigue exigiendo card`);
  }
  // Claim de identidad sin sello: sigue denegado.
  assert.equal(
    assertSignalingAdmission(undefined, {
      now: NOW,
      admission: SIGNALING_ADMISSION.anonymous,
      claimedSsbId: FEED
    }).ok,
    false
  );
  // El torno U186 (el que consume el carril LAN de blobs) no cambió de
  // semántica: card ausente = denegada, sin antesala anónima que valga.
  assert.deepEqual(assertSignalingPeerCard(null, { now: NOW }), {
    ok: false,
    error: 'peer-card missing or malformed'
  });
  assert.deepEqual(assertSignalingPeerCard(undefined, { admission: 'anonymous', now: NOW }), {
    ok: false,
    error: 'peer-card missing or malformed'
  });
});
