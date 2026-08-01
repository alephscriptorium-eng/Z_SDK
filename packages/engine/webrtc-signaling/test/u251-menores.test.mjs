/**
 * WP-U251 · Seis menores del signaling anónimo (secuela de U197).
 *
 * Doctrina que NO se toca: `admisión ≠ permiso` (U197) sobre
 * `transporte ≠ permiso` (U186). Ninguno de los seis abre la puerta de lo
 * protegido — por eso U197 se aceptó con ellos enrutados. Lo que arreglan
 * es otra cosa: **fugas de exigencia**. Dos son fail-open y van primero.
 *
 * Un rojo por defecto, con el valor exacto que lo dispara:
 *   D1 (fail-open) — `joinRoom` anónimo no comprueba el `from` que SACA al
 *      cable: con `userId` de forma feed SSB el claim viaja, y luego
 *      `sendOffer` lanza. La vía de admisión era más floja que la de acción.
 *   D4 (fail-open) — un `connect()` que LANZA deja la política ya aplicada:
 *      antesala abierta y exigencias rebajadas sin sesión que las justifique.
 *   D3 — doble lectura del opt en `setPeerCard`: un getter alternante pasa
 *      el `!= null` con `true` y aterriza `false` en el campo.
 *   D2 — el candado del carril SSB era un `override` sobre campo público.
 *   D5 — gemelos: con `admission` FALSY (`''`/`0`/`NaN`/`false`) Node
 *      aceptaba en silencio y el navegador lanzaba. Ambas seguras, no
 *      idénticas: aquí se mide con el valor que las separa.
 *   D6 — el candado SSB es invisible para TypeScript (fixture aparte,
 *      `u251-tipos.test.mjs`).
 *
 * La frontera no se mueve en ninguna dirección permisiva: todos los
 * arreglos DENIEGAN más o hacen RUIDO antes, nunca conceden. El vector
 * `frontera` al final lo mide.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makePeerCard, roleScope } from '@zeus/protocol';
import { SIGNALING_ADMISSION } from '../src/peer-card-gate.mjs';
import { SignalingService } from '../src/signaling-service.mjs';
import { SocketRoomSignalingService } from '../src/socket-room-signaling.mjs';
import {
  SsbPrivateSignalingService,
  createInMemorySsbPrivateBus
} from '../src/index.mjs';

const ROOM = 'R1';
/** feed SSB bien formado: `isSsbId()` lo reconoce como identidad */
const FEED = '@Vt0zURlyOWvW6yQL9Q9nQNwFq+ykYCEBJvfDBrmTFPQ=.ed25519';
const FEED_B = '@f2GJ8xVQ0kZ0m1sQ5o0Bq9y8H2r3T4u5V6w7X8y9Z0A=.ed25519';

function freshCard(sessionId = 'alice', overrides = {}) {
  return makePeerCard({
    roomId: ROOM,
    endpoint: 'http://test.local/runtime',
    token: `tok-${sessionId}`,
    scopes: [roleScope('player'), 'presence:join'],
    expiresAt: Date.now() + 60_000,
    sessionId,
    displayName: sessionId,
    ...overrides
  });
}

/** Bus de sala en memoria (mismo contrato que en `signaling-anonimo.test.mjs`). */
function roomBus() {
  const peers = [];
  /** @type {Array<{ from: string, event: string, payload: any, room: string }>} */
  const wire = [];

  function makeClient(id) {
    const io = new EventEmitter();
    io.id = `sock-${id}`;
    io.connected = false;
    const emitted = [];
    const realEmit = io.emit.bind(io);
    io.emit = (event, ...args) => {
      emitted.push({ event, args });
      return realEmit(event, ...args);
    };
    io.connect = () => {
      io.connected = true;
      queueMicrotask(() => realEmit('connect'));
    };
    io.disconnect = () => {
      io.connected = false;
    };
    const client = {
      io,
      emitted,
      id,
      room(event, data, room) {
        const payload = JSON.parse(JSON.stringify(data));
        wire.push({ from: id, event, payload, room });
        for (const peer of peers) {
          if (peer.id === id) continue;
          peer.client.io.emit(event, JSON.parse(JSON.stringify(payload)));
        }
      }
    };
    peers.push({ client, id });
    return client;
  }

  return { makeClient, wire };
}

// ═══════════════════════════════════════════════════════════════════════
// D1 · FAIL-OPEN — la admisión anónima saca al cable un `from` que la
//      acción deniega.  (ficha U251 (1))
// ═══════════════════════════════════════════════════════════════════════

test('D1: joinRoom anónimo con userId de forma feed SSB DENIEGA (y no saca el claim al cable)', async () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({
    client: bus.makeClient(FEED),
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous
  });
  await svc.connect(FEED);

  // `_gatedOutbound` (signaling-service.mjs) SÍ mira `claimedFrom`.
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /unproven identity claim/,
    'la vía de ACCIÓN ya denegaba el claim sin sello'
  );

  // La vía de ADMISIÓN tiene que decir lo mismo: el anuncio `join-room`
  // lleva `from: this.userId` al cable, así que el claim es el mismo.
  await assert.rejects(
    () => svc.joinRoom(ROOM),
    /unproven identity claim/,
    'la vía de ADMISIÓN debe denegar igual que la de acción'
  );

  assert.equal(svc.getRoomId(), '', 'no entró a la antesala');
  assert.equal(bus.wire.length, 0, 'cero fotogramas: el claim no llegó a viajar');
  const blob = JSON.stringify(bus.wire);
  assert.equal(blob.includes(FEED), false, 'el feed id no aparece en el cable');
});

test('D1b: joinRoom anónimo con userId corriente sigue entrando (el arreglo no cierra de más)', async () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({
    client: bus.makeClient('alice'),
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous
  });
  await svc.connect('alice');
  await svc.joinRoom(ROOM);
  assert.equal(svc.getRoomId(), ROOM);
  const announce = bus.wire.find((f) => f.event === 'join-room');
  assert.ok(announce, 'el anuncio anónimo sigue saliendo');
  assert.equal(announce.payload.from, 'alice');
  assert.equal('peerCard' in announce.payload, false, 'y sigue sin card');
});

test('D1c: card VÁLIDA en modo anónimo no se ve afectada por el claim del from', async () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({
    client: bus.makeClient(FEED),
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous
  });
  await svc.connect(FEED);
  // Card presentada ⇒ el veredicto lo da el torno U186, no el claim suelto.
  await svc.joinRoom(ROOM, freshCard(FEED, { ssbId: FEED }));
  assert.equal(svc.getSessionRole(), 'player', 'con card acreditada, la ruta no cambia');
});

// ═══════════════════════════════════════════════════════════════════════
// D4 · FAIL-OPEN — un `connect()` que lanza deja la política ya rebajada.
//      (ficha U251 (4))
// ═══════════════════════════════════════════════════════════════════════

test('D4: un connect() que LANZA no deja la antesala abierta (carril socket)', async () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({
    client: bus.makeClient('alice'),
    room: ROOM,
    requireSsbId: true
  });
  await svc.connect('alice');
  assert.equal(svc.getAdmission(), 'peer-card', 'punto de partida: antesala estricta');

  // Un connect que declara política MÁS floja y falla a mitad (card caducada).
  await assert.rejects(
    () =>
      svc.connect('alice', {
        admission: SIGNALING_ADMISSION.anonymous,
        requireSsbId: false,
        peerCard: freshCard('alice', { expiresAt: Date.now() - 1 })
      }),
    /expired/
  );

  assert.equal(
    svc.getAdmission(),
    'peer-card',
    'el modo NO se queda aplicado por un connect que falló'
  );
  await assert.rejects(
    () => svc.joinRoom(ROOM),
    /missing or malformed/,
    'y la antesala sigue exigiendo card'
  );
  assert.equal(svc.getPeerCard(), null, 'ni card a medio adoptar');
});

test('D4b: un connect() que LANZA no rebaja `requireSsbId` (carril SSB)', async () => {
  const bus = createInMemorySsbPrivateBus();
  const svc = new SsbPrivateSignalingService({ transport: bus.createTransport(FEED) });
  const sinSsbId = freshCard('a');

  // Exigencia de partida del carril SSB: `requireSsbId` por defecto.
  assert.throws(
    () => svc.setPeerCard(sinSsbId),
    /ssbId missing or malformed/,
    'punto de partida: el carril SSB exige feed id en la card'
  );

  // Un connect que rebaja la exigencia y luego lanza (modo prohibido aquí).
  await assert.rejects(
    () =>
      svc.connect(FEED, {
        requireSsbId: false,
        admission: SIGNALING_ADMISSION.anonymous
      }),
    /carril SSB no admite antesala anónima/
  );

  assert.throws(
    () => svc.setPeerCard(sinSsbId),
    /ssbId missing or malformed/,
    'la exigencia federada NO queda rebajada por un connect que falló'
  );
});

test('D4c: un connect() que falla al abrir el cable tampoco deja política a medias', async () => {
  const bus = roomBus();
  const client = bus.makeClient('alice');
  const svc = new SocketRoomSignalingService({ client, room: ROOM });
  // El transporte se cae: `connectAndJoin` nunca ve el `connect`.
  client.io.connect = () => {
    throw new Error('transport down');
  };
  await assert.rejects(
    () =>
      svc.connect('alice', {
        admission: SIGNALING_ADMISSION.anonymous,
        peerCard: freshCard('alice')
      }),
    /transport down/
  );
  assert.equal(svc.getAdmission(), 'peer-card', 'sin cable, sin antesala anónima');
  assert.equal(svc.getPeerCard(), null, 'sin cable, sin card adoptada');
});

// ═══════════════════════════════════════════════════════════════════════
// D3 · doble lectura del opt — el getter alternante tira la exigencia.
//      (ficha U251 (3))
// ═══════════════════════════════════════════════════════════════════════

/** Opt hostil: `true` en la primera lectura, `false` en las siguientes. */
function alternante(clave, primero = true, resto = false) {
  let n = 0;
  return {
    lecturas: () => n,
    get [clave]() {
      return n++ === 0 ? primero : resto;
    }
  };
}

test('D3: setPeerCard lee cada opt UNA vez — un getter alternante no tira requireSsbId', () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({ client: bus.makeClient('x'), room: ROOM });
  const opts = alternante('requireSsbId');

  assert.throws(
    () => svc.setPeerCard(freshCard('a'), opts),
    /ssbId missing or malformed/,
    'la exigencia declarada (primera lectura: true) tiene que aplicarse'
  );
  assert.equal(opts.lecturas(), 1, 'y el opt se lee exactamente una vez');
});

test('D3b: lo mismo con requireSeatSignature', () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({ client: bus.makeClient('x'), room: ROOM });
  const opts = alternante('requireSeatSignature');

  assert.throws(
    () => svc.setPeerCard(freshCard('a'), opts),
    /seat signature missing/,
    'la firma de asiento declarada no puede caerse entre dos lecturas'
  );
  assert.equal(opts.lecturas(), 1);
});

test('D3c: y con `role` — el rol declarado se PERSISTE, no se evapora', () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({ client: bus.makeClient('x'), room: ROOM });
  let n = 0;
  const opts = {
    get role() {
      return n++ === 0 ? 'operator' : undefined;
    }
  };
  const cardOperator = freshCard('a', { scopes: [roleScope('operator')] });
  svc.setPeerCard(cardOperator, opts);
  assert.equal(n, 1, 'una sola lectura de `role`');
  // Persistido ⇒ una card que sólo acredita `player` deja de valer.
  assert.throws(
    () => svc.setPeerCard(freshCard('b')),
    /does not grant role:operator/,
    'el rol exigido quedó guardado, no descartado en la segunda lectura'
  );
});

test('D3d: connect() sigue inmune al getter alternante — ahora a propósito (spread)', async () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({ client: bus.makeClient('anon'), room: ROOM });
  const opts = alternante('requireSsbId');
  await svc.connect('anon', {
    admission: SIGNALING_ADMISSION.anonymous,
    ...opts
  });
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/,
    'la exigencia declarada vuelve a exigir card aunque el modo sea anónimo'
  );
});

// ═══════════════════════════════════════════════════════════════════════
// D2 · el candado SSB, de verdad: campo privado + modo forzado en el torno.
//      (ficha U251 (2))
// ═══════════════════════════════════════════════════════════════════════

test('D2: pinchar el campo NO abre la antesala del carril SSB', async () => {
  const bus = createInMemorySsbPrivateBus();
  const svc = new SsbPrivateSignalingService({ transport: bus.createTransport(FEED) });

  svc._admission = SIGNALING_ADMISSION.anonymous;
  assert.equal(
    svc.getAdmission(),
    'peer-card',
    'escribir `_admission` ya no alcanza el modo real'
  );
});

test('D2b: saltarse el override por el prototipo tampoco lo abre', async () => {
  const bus = createInMemorySsbPrivateBus();
  const svc = new SsbPrivateSignalingService({ transport: bus.createTransport(FEED) });

  // El bypass documentado en README (U197 §6, «alcance exacto»).
  SignalingService.prototype.setAdmission.call(svc, SIGNALING_ADMISSION.anonymous);
  assert.equal(svc.getAdmission(), 'peer-card', 'el torno del carril SSB no lo ve');

  // Y el torno actúa en consecuencia: sin card no sale nada.
  await svc.connect(FEED);
  await assert.rejects(
    () => svc.sendOffer(FEED_B, { type: 'offer', sdp: 'x' }),
    /peer-card required/,
    'el carril SSB sigue exigiendo card tras el bypass'
  );
});

test('D2c: la vía de configuración sigue siendo RUIDOSA (no se degrada en silencio)', () => {
  const bus = createInMemorySsbPrivateBus();
  const svc = new SsbPrivateSignalingService({ transport: bus.createTransport(FEED) });
  assert.throws(
    () => svc.setAdmission(SIGNALING_ADMISSION.anonymous),
    /carril SSB no admite antesala anónima/
  );
  assert.throws(
    () => new SsbPrivateSignalingService({ admission: SIGNALING_ADMISSION.anonymous }),
    /carril SSB no admite antesala anónima/
  );
});

// ═══════════════════════════════════════════════════════════════════════
// D5 · gemelos: el valor con el que divergen es `admission` FALSY.
//      (ficha U251 (5))
//
// Medido sobre el gemelo de navegador
// (`packages/mesh/webrtc-viewer/src/browser/browser-signaling.mjs:123`
//  `_applyPolicy`: `if (cfg.admission != null) this.setAdmission(cfg.admission)`
//  → `''`/`0`/`NaN`/`false` LANZAN `unknown admission mode`).
// El carril Node usaba `if (options.admission)` → los aceptaba en silencio
// cayendo a `peer-card`. Las dos direcciones son seguras; la correcta es la
// que hace RUIDO (doctrina D3 del gemelo: un typo de despliegue no se
// depura a ciegas). Node sigue al navegador, no al revés.
// ═══════════════════════════════════════════════════════════════════════

const FALSY_QUE_DIVERGEN = ['', 0, NaN, false];

test('D5: admission falsy LANZA en el carril socket (paridad con el gemelo navegador)', () => {
  const bus = roomBus();
  for (const falsy of FALSY_QUE_DIVERGEN) {
    assert.throws(
      () =>
        new SocketRoomSignalingService({
          client: bus.makeClient(`x-${String(falsy)}`),
          room: ROOM,
          admission: falsy
        }),
      /unknown admission mode/,
      `constructor con admission:${String(falsy)}`
    );
  }
});

test('D5b: admission falsy LANZA también en connect() (carril socket)', async () => {
  const bus = roomBus();
  for (const falsy of FALSY_QUE_DIVERGEN) {
    const svc = new SocketRoomSignalingService({
      client: bus.makeClient(`c-${String(falsy)}`),
      room: ROOM
    });
    await assert.rejects(
      () => svc.connect('alice', { admission: falsy }),
      /unknown admission mode/,
      `connect con admission:${String(falsy)}`
    );
    // D4 de propina: el connect que lanzó no dejó nada aplicado.
    assert.equal(svc.getAdmission(), 'peer-card');
  }
});

test('D5c: admission falsy LANZA también en el carril SSB', () => {
  const bus = createInMemorySsbPrivateBus();
  for (const falsy of FALSY_QUE_DIVERGEN) {
    assert.throws(
      () =>
        new SsbPrivateSignalingService({
          transport: bus.createTransport(FEED),
          admission: falsy
        }),
      /unknown admission mode/,
      `carril SSB con admission:${String(falsy)}`
    );
  }
});

test('D5d: ausente (`undefined`/`null`) sigue significando «no declarado»', () => {
  const bus = roomBus();
  for (const ausente of [undefined, null]) {
    const svc = new SocketRoomSignalingService({
      client: bus.makeClient(`a-${String(ausente)}`),
      room: ROOM,
      admission: ausente
    });
    assert.equal(svc.getAdmission(), 'peer-card', 'sin declarar = statu quo U186');
  }
});

// ═══════════════════════════════════════════════════════════════════════
// La frontera NO se movió: un anónimo no obtiene NADA nuevo.
// ═══════════════════════════════════════════════════════════════════════

test('frontera: tras los seis arreglos, el anónimo sigue sin obtener permiso alguno', async () => {
  const bus = roomBus();
  const anon = new SocketRoomSignalingService({
    client: bus.makeClient('anon'),
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous
  });
  const otro = new SocketRoomSignalingService({
    client: bus.makeClient('anon2'),
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous
  });
  await anon.connect('anon');
  await otro.connect('anon2');
  await anon.joinRoom(ROOM);
  await otro.joinRoom(ROOM);
  await anon.sendOffer('anon2', { type: 'offer', sdp: 'x' });

  assert.equal(anon.getSessionRole(), null, 'rol null: la antesala no concede');
  assert.equal(anon.getPeerCard(), null, 'no se fabricó card por el camino');
  assert.equal(anon.getSsbId(), null, 'ni identidad');
  assert.deepEqual(anon.describeAdmission(), {
    admission: 'anonymous',
    anonymous: true,
    role: null
  });
  const blob = JSON.stringify(bus.wire);
  assert.equal(/peerCard|seatSignature|token|ssbId/.test(blob), false, 'cero credenciales en el cable');
});
