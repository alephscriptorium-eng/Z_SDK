/**
 * WP-U251 · DEVOLUCIÓN — el inventario del retrato, y lo que se enterró.
 *
 * La lección de la devolución: *un rollback vale lo que valga su
 * inventario*. El mecanismo de `_policySnapshot()` / `_policyRestore()`
 * restauraba bien los 5 campos retratados; el defecto estaba en **qué se
 * decidió que era «política»**. `userId` no lo parecía — hasta medir que
 * **acuña identidad**.
 *
 *   B1 — `userId` fuera del retrato, y decide lo que se exige después:
 *        · SSB: un `connect()` FALLIDO acuña el feed que luego se estampa
 *          como `ssbId` en una card que no lo trae ⇒ satisface la exigencia
 *          estructural del carril.
 *        · socket: un `connect()` FALLIDO reescribe `userId` y con ello
 *          **deshace el arreglo del defecto (1)**.
 *   B2 — `setPeerCard()` escribe la política y DESPUÉS valida y lanza:
 *        el mismo fail-open de (4), por la vía directa que `connect()` no
 *        cubre, en la función que este WP ya editaba.
 *   M5 — los otros dos campos también muerden: `_allowTrickle` (deja el
 *        trickle ICE encendido sobre un carril que lo cierra a propósito) y
 *        `_transport` (instala el transporte por el que sale la card, con
 *        token dentro).
 *   B3 — EVIDENCIA de un defecto que NO es de este WP y que se enterró por
 *        una medición perezosa: ver §«evidencia U262» al final.
 *
 * ✔ WP-U262 (2026-08-02): la ficha cerró. Las dos pruebas de §«evidencia
 *   U262» están **INVERTIDAS** —afirmaban el fail-open, ahora afirman lo
 *   contrario— y siguen aquí a propósito: son la memoria del defecto.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { assertSignalingPeerCard } from '../src/peer-card-gate.mjs';
import { SocketRoomSignalingService } from '../src/socket-room-signaling.mjs';
import {
  SsbPrivateSignalingService,
  createInMemorySsbPrivateBus
} from '../src/index.mjs';

const ROOM = 'R1';
const FEED = '@Vt0zURlyOWvW6yQL9Q9nQNwFq+ykYCEBJvfDBrmTFPQ=.ed25519';
const FEED_B = '@f2GJ8xVQ0kZ0m1sQ5o0Bq9y8H2r3T4u5V6w7X8y9Z0A=.ed25519';

function freshCard(overrides = {}) {
  return makePeerCard({
    roomId: ROOM,
    endpoint: 'http://test.local/runtime',
    token: 'tok-SECRETO',
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId: 'a',
    ...overrides
  });
}

function fakeClient() {
  const io = new EventEmitter();
  io.id = 'sock-test';
  io.connected = false;
  const realEmit = io.emit.bind(io);
  io.connect = () => {
    io.connected = true;
    queueMicrotask(() => realEmit('connect'));
  };
  io.disconnect = () => {
    io.connected = false;
  };
  const roomCalls = [];
  return {
    io,
    roomCalls,
    room(event, data, room) {
      roomCalls.push({ event, data, room });
    }
  };
}

/** Transporte SSB sin identidad propia (`whoami()` vacío). */
function transporteSinIdentidad(bus, feed) {
  const base = bus.createTransport(feed);
  const publicado = [];
  return {
    publicado,
    whoami: () => '',
    publishPrivate: (content, recps) => {
      publicado.push(content);
      return base.publishPrivate(content, recps);
    },
    subscribePrivate: (handler) => base.subscribePrivate(handler)
  };
}

// ═══════════════════════════════════════════════════════════════════════
// B1 · `userId` decide lo que se exige después — en los DOS carriles
// ═══════════════════════════════════════════════════════════════════════

test('B1a (SSB): un connect() que LANZA no puede acuñar la identidad que satisface la exigencia', async () => {
  const bus = createInMemorySsbPrivateBus();
  const svc = new SsbPrivateSignalingService({
    transport: transporteSinIdentidad(bus, FEED)
  });
  await svc.connect('');
  assert.equal(svc.getUserId(), '', 'punto de partida: sin identidad local');

  const card = freshCard(); // sin ssbId
  await assert.rejects(
    () => svc.joinRoom(ROOM, card),
    /ssbId missing or malformed/,
    'control: el carril SSB exige feed id y esta card no lo trae'
  );

  // El connect declara un modo prohibido aquí y LANZA…
  await assert.rejects(
    () => svc.connect(FEED, { admission: 'anonymous' }),
    /carril SSB no admite antesala anónima/
  );

  // …y no puede haber dejado la identidad puesta: `joinRoom` la estampa
  // como `ssbId` en la card, que es justo lo que la exigencia pedía.
  assert.equal(svc.getUserId(), '', 'el userId NO se queda de un connect que falló');
  await assert.rejects(
    () => svc.joinRoom(ROOM, card),
    /ssbId missing or malformed/,
    'la MISMA card sigue denegada: nadie acuñó identidad por el camino'
  );
  assert.equal(svc.getSsbId(), null);
  assert.equal(svc.getSessionRole(), null);
});

test('B1b (socket): un connect() que LANZA no puede deshacer el arreglo del defecto (1)', async () => {
  const client = fakeClient();
  const svc = new SocketRoomSignalingService({
    client,
    room: ROOM,
    admission: 'anonymous'
  });
  await svc.connect(FEED);

  // Con userId de forma feed SSB, la antesala anónima deniega (defecto 1).
  await assert.rejects(() => svc.joinRoom(ROOM), /unproven identity claim/);

  // Un connect con modo inválido lanza — y NO puede dejar `userId` movido.
  await assert.rejects(
    () => svc.connect('alice', { admission: 'modo-invalido' }),
    /unknown admission mode/
  );
  assert.equal(svc.getAdmission(), 'anonymous', 'la política sí se restauraba ya');
  assert.equal(svc.getUserId(), FEED, 'y ahora el userId también');

  await assert.rejects(
    () => svc.joinRoom(ROOM),
    /unproven identity claim/,
    'el arreglo de (1) sigue en pie tras el connect fallido'
  );
  assert.equal(client.roomCalls.length, 0, 'cero anuncios: el claim no viajó');
});

// ═══════════════════════════════════════════════════════════════════════
// B2 · `setPeerCard()` — validar ANTES de escribir
// ═══════════════════════════════════════════════════════════════════════

test('B2: setPeerCard() que LANZA no deja la exigencia rebajada (la vía directa que connect no cubre)', () => {
  const svc = new SocketRoomSignalingService({
    client: fakeClient(),
    room: ROOM,
    requireSsbId: true
  });

  // Rebaja `requireSsbId` y exige un rol que la card no acredita ⇒ lanza.
  assert.throws(
    () =>
      svc.setPeerCard(freshCard({ ssbId: FEED }), {
        requireSsbId: false,
        role: 'operator'
      }),
    /does not grant role:operator/
  );

  // Nada escrito: la exigencia federada sigue en pie.
  assert.throws(
    () => svc.setPeerCard(freshCard()),
    /ssbId missing or malformed/,
    'una llamada que lanzó no puede haber rebajado requireSsbId'
  );
  assert.equal(svc.getPeerCard(), null, 'ni card adoptada');
});

test('B2b: setPeerCard() que ACEPTA sí aplica la política declarada (no cierra de más)', () => {
  const svc = new SocketRoomSignalingService({ client: fakeClient(), room: ROOM });
  svc.setPeerCard(freshCard({ ssbId: FEED }), { requireSsbId: true, role: 'player' });
  assert.equal(svc.getSessionRole(), 'player');
  // La exigencia quedó guardada: una card sin ssbId ya no pasa.
  assert.throws(() => svc.setPeerCard(freshCard()), /ssbId missing or malformed/);
});

// ═══════════════════════════════════════════════════════════════════════
// M5 · los otros dos campos del retrato también muerden
// ═══════════════════════════════════════════════════════════════════════

test('M5a: un connect() que LANZA no deja el trickle ICE encendido sobre SSB', async () => {
  const bus = createInMemorySsbPrivateBus();
  const transporte = transporteSinIdentidad(bus, FEED);
  const svc = new SsbPrivateSignalingService({ transport: transporte });
  await svc.connect(FEED);
  await svc.joinRoom(ROOM, freshCard({ ssbId: FEED }));

  const ice = () => transporte.publicado.filter((c) => c.signal === 'ice-candidate').length;
  await svc.sendIceCandidate(FEED_B, { candidate: 'c1' });
  assert.equal(ice(), 0, 'control: el carril SSB cierra el trickle a propósito');

  await assert.rejects(
    () => svc.connect(FEED, { allowTrickle: true, admission: 'anonymous' }),
    /carril SSB no admite antesala anónima/
  );

  await svc.sendIceCandidate(FEED_B, { candidate: 'c2' });
  assert.equal(ice(), 0, 'el connect que falló no encendió el trickle');
});

test('M5b: un connect() que LANZA no deja instalado el transporte por el que sale la card', async () => {
  const bus = createInMemorySsbPrivateBus();
  const tA = transporteSinIdentidad(bus, FEED);
  const tB = transporteSinIdentidad(bus, FEED);
  const svc = new SsbPrivateSignalingService({ transport: tA });
  await svc.connect(FEED);
  await svc.joinRoom(ROOM, freshCard({ ssbId: FEED }));

  await assert.rejects(
    () => svc.connect(FEED, { transport: tB, admission: 'anonymous' }),
    /carril SSB no admite antesala anónima/
  );
  assert.equal(svc.getTransport(), tA, 'el transporte del connect fallido no se queda');

  await svc.sendOffer(FEED_B, { type: 'offer', sdp: 'x' });
  assert.equal(tB.publicado.length, 0, 'nada salió por el transporte que instaló la llamada que falló');
  const porB = JSON.stringify(tB.publicado);
  assert.equal(porB.includes('tok-SECRETO'), false, 'y desde luego no el token de la card');
});

// ═══════════════════════════════════════════════════════════════════════
// EVIDENCIA U262 · INVERTIDA (WP-U262, ficha cerrada)
//
// Estas dos pruebas se escribieron AFIRMANDO el defecto: eran verdes
// mientras el portero fallaba ABIERTO ante un getter alternante, y llevaban
// la orden escrita de invertirse el día que la ficha cerrara. Ese día
// llegó. Se INVIERTEN, no se borran: la forma del vector es la evidencia
// de que el defecto existió, y quien vuelva a abrir este hueco tumbará
// exactamente estas dos pruebas.
//
// Lo que afirmaban (medido contra la base, antes del arreglo):
//   · `role` alternante `operator`→`player`: `{ok:true, role:'player'}`
//     HABIENDO EXIGIDO `operator` — 2 lecturas de `opts.role`.
//   · `expectedSsbId` alternante `FEED_B`→`FEED_B`→`FEED`: `{ok:true,
//     ssbId: FEED}` con un amarre exigido a FEED_B — 3 lecturas.
//
// Lo que afirman ahora: **una decisión, una lectura**, y por tanto el
// veredicto de la alternancia es el mismo que el del PRIMER valor leído —
// que es el valor que se exigió.
//
// Y la lección que abrió la ficha, ahora en positivo: U251 midió UNA
// alternancia (`'operator' → undefined`), vio que cerraba y escribió
// «fail-closed». La rama tercera de cada prueba conserva ese vector: con
// una sola lectura, las DOS alternancias cierran, y por el mismo motivo.
// ═══════════════════════════════════════════════════════════════════════

test('U262 cerrado: `role` alternante ⇒ el portero exige y comprueba EL MISMO valor (una lectura)', () => {
  const card = freshCard({ ssbId: FEED }); // acredita `player`, no `operator`
  let n = 0;
  const check = assertSignalingPeerCard(card, {
    get role() {
      return n++ === 0 ? 'operator' : 'player';
    }
  });

  // Antes: 2 lecturas por la rama que acredita (3 por la que deniega).
  assert.equal(n, 1, 'el portero lee `opts.role` UNA vez');
  assert.equal(check.ok, false, 'la alternancia ya no acredita nada');
  assert.match(
    check.error,
    /does not grant role:operator/,
    'y deniega por el rol que se exigió en la PRIMERA lectura, no por el que coló en la segunda'
  );

  // El contraste que ya existía: con el valor FIJO el veredicto es idéntico
  // — el arreglo no movió la política, sólo el número de lecturas.
  const fijo = assertSignalingPeerCard(card, { role: 'operator' });
  assert.deepEqual(fijo, check, 'alternante y fijo dan exactamente el mismo veredicto');

  // La alternancia que U251 midió (`'operator' → undefined`) sigue cerrando,
  // pero ya no por accidente: cierra por el mismo motivo que la otra.
  let m = 0;
  const cerrado = assertSignalingPeerCard(card, {
    get role() {
      return m++ === 0 ? 'operator' : undefined;
    }
  });
  assert.equal(m, 1, 'una lectura también aquí');
  assert.deepEqual(cerrado, check, 'las dos alternancias cierran igual, y por la misma razón');
});

test('U262 cerrado: `expectedSsbId` alternante ⇒ el amarre se cumple contra el feed exigido (una lectura)', () => {
  const card = freshCard({ ssbId: FEED }); // amarrada a FEED
  let n = 0;
  const secuencia = [FEED_B, FEED_B, FEED]; // se exige FEED_B; antes colaba FEED
  const check = assertSignalingPeerCard(card, {
    get expectedSsbId() {
      return secuencia[Math.min(n++, secuencia.length - 1)];
    }
  });

  assert.equal(n, 1, 'el portero lee `opts.expectedSsbId` UNA vez (antes: 3)');
  assert.equal(check.ok, false, 'la card de otro feed ya no pasa el amarre');
  assert.match(check.error, /does not match handshake/);
  assert.equal(check.ssbId, undefined, 'y no acredita ningún feed');

  const fijo = assertSignalingPeerCard(card, { expectedSsbId: FEED_B });
  assert.deepEqual(fijo, check, 'alternante y fijo dan exactamente el mismo veredicto');
});
