/**
 * WP-U197 · Signaling anónimo WebRTC (tras U186).
 *
 * Doctrina heredada (U186, BACKLOG :233): **transporte ≠ permiso**.
 * Corolario de este WP: **admisión ≠ permiso**. La antesala WebRTC puede
 * admitir a pares sin card; eso no concede rol, no acredita identidad y
 * no abre nada que antes exigiera permiso.
 *
 * CA verificados aquí:
 *   - CA1: handshake offer → answer → ICE entre 2 anónimos, completo.
 *   - CA2: ningún paso exige card/identidad/credencial (prueba de la
 *     AUSENCIA: el payload de cable no lleva la clave `peerCard`).
 *   - CA3: el anónimo que completa el handshake NO obtiene permiso —
 *     rol null, torno de terceros intacto, par estricto lo rechaza.
 *   - Rojos: card presentada e inválida RECHAZA también en modo anónimo;
 *     claim de identidad sin card deniega; exigencia configurada vuelve a
 *     exigir card; el modo NO se negocia por el cable.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  assertSignalingPeerCard,
  assertSignalingAdmission,
  isPeerCardPresented,
  SIGNALING_ADMISSION
} from '../src/peer-card-gate.mjs';
import { SocketRoomSignalingService } from '../src/socket-room-signaling.mjs';

const ROOM = 'R1';

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

/**
 * Bus de sala en memoria fiel al relay: `emitRoomEvent(client, ev, data)`
 * llega al otro par como `io.emit(ev, data)` (nombre desenvuelto, U88), y
 * el payload cruza un round-trip JSON — igual que el cable, que borra
 * `undefined` y no puede transportar claves ausentes.
 */
function roomBus() {
  /** @type {Array<{ client: any, id: string }>} */
  const peers = [];
  /** @type {Array<{ from: string, event: string, payload: any, room: string }>} */
  const wire = [];

  function makeClient(id) {
    const io = new EventEmitter();
    io.id = `sock-${id}`;
    io.connected = false;
    /** @type {Array<{ event: string, args: unknown[] }>} */
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

function anonService(client, extra = {}) {
  return new SocketRoomSignalingService({
    client,
    room: ROOM,
    admission: SIGNALING_ADMISSION.anonymous,
    ...extra
  });
}

// ───────────────────────────────────────────────────────────────────────
// CA1 · handshake completo entre dos anónimos
// ───────────────────────────────────────────────────────────────────────

test('CA1: offer → answer → ICE entre 2 peers anónimos, sin card en ningún paso', async () => {
  const bus = roomBus();
  const alice = anonService(bus.makeClient('alice'));
  const bob = anonService(bus.makeClient('bob'));

  await alice.connect('alice');
  await bob.connect('bob');
  await alice.joinRoom(ROOM);
  await bob.joinRoom(ROOM);

  const atBob = [];
  const atAlice = [];
  bob.on('message', (m) => atBob.push(m));
  alice.on('message', (m) => atAlice.push(m));
  const errors = [];
  bob.on('error', (e) => errors.push(e));
  alice.on('error', (e) => errors.push(e));

  await alice.sendOffer('bob', { type: 'offer', sdp: 'v=0 anon-offer' });
  await bob.sendAnswer('alice', { type: 'answer', sdp: 'v=0 anon-answer' });
  await alice.sendIceCandidate('bob', { candidate: 'candidate:1 1 udp 2 127.0.0.1 5000 typ host' });
  await bob.sendIceCandidate('alice', { candidate: 'candidate:2 1 udp 2 127.0.0.1 5001 typ host' });

  assert.deepEqual(errors, [], 'ningún paso del handshake anónimo produjo error');

  const offer = atBob.find((m) => m.type === 'offer');
  const answer = atAlice.find((m) => m.type === 'answer');
  const iceAtBob = atBob.find((m) => m.type === 'ice-candidate');
  const iceAtAlice = atAlice.find((m) => m.type === 'ice-candidate');

  assert.ok(offer, 'paso 1/3 — offer entregada al par anónimo');
  assert.equal(offer.offer.sdp, 'v=0 anon-offer');
  assert.ok(answer, 'paso 2/3 — answer entregada al par anónimo');
  assert.equal(answer.answer.sdp, 'v=0 anon-answer');
  assert.ok(iceAtBob && iceAtAlice, 'paso 3/3 — ICE en ambos sentidos');

  // Los tres pasos entran marcados como anónimos, sin card ni ssbId
  for (const m of [offer, answer, iceAtBob, iceAtAlice]) {
    assert.equal(m.anonymous, true, `${m.type} entregado como anónimo`);
    assert.equal('peerCard' in m, false, `${m.type} sin card`);
    assert.equal('ssbId' in m, false, `${m.type} sin ssbId`);
  }
});

// ───────────────────────────────────────────────────────────────────────
// CA2 · anónimo es anónimo: prueba de la AUSENCIA en el cable
// ───────────────────────────────────────────────────────────────────────

test('CA2: ningún payload del signaling anónimo lleva card, identidad ni credencial', async () => {
  const bus = roomBus();
  const alice = anonService(bus.makeClient('alice'));
  const bob = anonService(bus.makeClient('bob'));

  await alice.connect('alice');
  await bob.connect('bob');

  await alice.joinRoom(ROOM);
  await alice.sendOffer('bob', { type: 'offer', sdp: 'x' });
  await bob.joinRoom(ROOM);
  await bob.sendAnswer('alice', { type: 'answer', sdp: 'y' });
  await alice.sendIceCandidate('bob', { candidate: 'c' });

  assert.ok(bus.wire.length >= 5, 'los 4 tipos gated cruzaron el cable');
  for (const frame of bus.wire) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(frame.payload, 'peerCard'),
      false,
      `${frame.event}: la clave peerCard está AUSENTE del cable, no es null`
    );
    assert.equal(
      Object.prototype.hasOwnProperty.call(frame.payload, 'ssbId'),
      false,
      `${frame.event}: sin ssbId en el cable`
    );
    if (frame.payload.data && typeof frame.payload.data === 'object') {
      assert.equal(
        Object.prototype.hasOwnProperty.call(frame.payload.data, 'peerCard'),
        false,
        `${frame.event}: sin card oculta en data`
      );
    }
  }
  const blob = JSON.stringify(bus.wire);
  assert.equal(/peerCard|seatSignature|token/.test(blob), false, 'cero credenciales en el cable');
});

test('CA2b: el transporte base del anónimo se registra sin card (U186 CA1 intacto)', async () => {
  const bus = roomBus();
  const client = bus.makeClient('anon-1');
  const svc = anonService(client);
  await svc.connect('anon-1');

  const reg = client.emitted.find((e) => e.event === 'CLIENT_REGISTER');
  assert.ok(reg, 'CLIENT_REGISTER emitido sin exigir card');
  assert.equal(reg.args[0].peerCard, undefined, 'registro anónimo');
  assert.equal(svc.isAnonymous(), true);
  assert.equal(svc.getAdmission(), 'anonymous');
});

// ───────────────────────────────────────────────────────────────────────
// CA3 · el que entra anónimo NO sale con permisos  (el caso que importa)
// ───────────────────────────────────────────────────────────────────────

test('CA3: handshake anónimo completo ⇒ rol sigue siendo null (admisión ≠ permiso)', async () => {
  const bus = roomBus();
  const alice = anonService(bus.makeClient('alice'));
  const bob = anonService(bus.makeClient('bob'));
  await alice.connect('alice');
  await bob.connect('bob');
  await alice.joinRoom(ROOM);
  await bob.joinRoom(ROOM);
  await alice.sendOffer('bob', { type: 'offer', sdp: 'x' });
  await bob.sendAnswer('alice', { type: 'answer', sdp: 'y' });
  await alice.sendIceCandidate('bob', { candidate: 'c' });

  // El handshake completó (CA1) y aun así:
  assert.equal(alice.getPeerCard(), null, 'no se fabricó card por el camino');
  assert.equal(alice.getSessionRole(), null, 'rol null: la antesala no concede');
  assert.equal(bob.getSessionRole(), null);
  assert.deepEqual(alice.describeAdmission(), {
    admission: 'anonymous',
    anonymous: true,
    role: null
  });

  // El propio veredicto de admisión no devuelve rol alguno: no hay
  // consumidor que pueda leer un rol de la admisión anónima.
  const verdict = assertSignalingAdmission(null, {
    admission: SIGNALING_ADMISSION.anonymous
  });
  assert.deepEqual(verdict, { ok: true, anonymous: true, role: null });
});

test('CA3b: el torno de terceros NO se movió — lo protegido sigue denegando al anónimo', async () => {
  const bus = roomBus();
  const alice = anonService(bus.makeClient('alice'));
  await alice.connect('alice');
  await alice.joinRoom(ROOM);
  await alice.sendOffer('bob', { type: 'offer', sdp: 'x' });

  // `assertSignalingPeerCard` es el portero que consumen terceros
  // (packages/mesh/blob-sync-harness/src/lan-gate.mjs:23 → carril LAN de
  // blobs por DataChannel). Su veredicto ante el anónimo no cambia.
  const asThirdParty = assertSignalingPeerCard(alice.getPeerCard());
  assert.equal(asThirdParty.ok, false, 'card ausente sigue denegada por el torno U186');
  assert.match(asThirdParty.error, /missing or malformed/);

  // Ni siquiera pasándole el modo: el torno U186 no conoce `admission`.
  const forced = assertSignalingPeerCard(null, { admission: 'anonymous' });
  assert.equal(forced.ok, false, 'el torno U186 ignora el modo de antesala');
});

test('CA3c: un par con antesala estricta RECHAZA la offer del anónimo', async () => {
  const bus = roomBus();
  const anon = anonService(bus.makeClient('anon'));
  // Sin `admission`: statu quo U186/U93 — la antesala exige card.
  const strict = new SocketRoomSignalingService({
    client: bus.makeClient('strict'),
    room: ROOM
  });

  await anon.connect('anon');
  await strict.connect('strict');
  assert.equal(strict.getAdmission(), 'peer-card', 'el defecto no cambió');

  const seen = [];
  const errors = [];
  strict.on('message', (m) => seen.push(m));
  strict.on('error', (e) => errors.push(e));

  await anon.joinRoom(ROOM);
  await anon.sendOffer('strict', { type: 'offer', sdp: 'x' });

  const gated = seen.filter((m) => m.type === 'offer' || m.type === 'room-join');
  assert.equal(gated.length, 0, 'el estricto no entrega nada gated del anónimo');
  assert.ok(errors.length >= 1, 'y deja rastro del rechazo');
  assert.match(errors[0].message, /peer-card rejected: peer-card missing or malformed/);
});

test('CA3d: el rol exigido sigue denegando aunque la antesala sea anónima', async () => {
  const bus = roomBus();
  const svc = anonService(bus.makeClient('anon'), { requiredRole: 'operator' });
  await svc.connect('anon');

  // hostil-omite: exigencia configurada + card AUSENTE ⇒ deniega
  await assert.rejects(() => svc.joinRoom(ROOM), /missing or malformed/);
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/
  );
  assert.equal(svc.isConnected(), true, 'el cable sigue intacto tras denegar');
  assert.equal(svc.getSessionRole(), null);
});

test('CA3e: firma de asiento exigida deniega al anónimo (hostil-omite)', async () => {
  const bus = roomBus();
  const svc = anonService(bus.makeClient('anon'), { requireSeatSignature: true });
  await svc.connect('anon');
  await assert.rejects(
    () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
    /peer-card required/
  );

  const direct = assertSignalingAdmission(null, {
    admission: SIGNALING_ADMISSION.anonymous,
    requireSeatSignature: true
  });
  assert.equal(direct.ok, false);
  assert.equal(direct.anonymous, false, 'la exigencia no se salda declarando anonimato');
});

// ───────────────────────────────────────────────────────────────────────
// D1 (devolución) · fail-open contra configuración declarada
//
// El torno U186 lee las exigencias por TRUTHINESS (`peer-card-gate.mjs:85`
// `if (opts.requireSsbId || ssbId != null)` y `:100`). La admisión las
// leía con `=== true`: una exigencia declarada con un truthy no-booleano
// se descartaba en silencio y el anónimo entraba. Asimetría cerrada.
// ───────────────────────────────────────────────────────────────────────

test('D1: exigencia con truthy NO booleano sigue exigiendo card (no fail-open)', () => {
  const card = freshCard('a'); // sin ssbId, sin seatSignature
  for (const truthy of [1, 'yes', -1, Infinity, {}, [], 'false']) {
    // el torno U186: por truthiness, deniega
    const torno = assertSignalingPeerCard(card, { requireSsbId: truthy });
    assert.equal(torno.ok, false, `torno con requireSsbId:${String(truthy)}`);

    // la admisión U197 debe coincidir, no descartar la exigencia
    const adm = assertSignalingAdmission(null, {
      admission: SIGNALING_ADMISSION.anonymous,
      requireSsbId: truthy
    });
    assert.equal(adm.ok, false, `admisión con requireSsbId:${String(truthy)} debe denegar`);
    assert.equal(adm.anonymous, false, 'y no admitir como anónimo');

    const seat = assertSignalingAdmission(null, {
      admission: SIGNALING_ADMISSION.anonymous,
      requireSeatSignature: truthy
    });
    assert.equal(seat.ok, false, `requireSeatSignature:${String(truthy)} debe denegar`);
  }
  // Falsy sigue significando «sin exigencia» (simetría con el torno)
  for (const falsy of [0, '', false, null, undefined, NaN]) {
    const adm = assertSignalingAdmission(null, {
      admission: SIGNALING_ADMISSION.anonymous,
      requireSsbId: falsy
    });
    assert.equal(adm.ok, true, `requireSsbId:${String(falsy)} = sin exigencia`);
    assert.equal(adm.anonymous, true);
  }
});

test('D1b: alcanzable por API pública — connect() con requireSsbId truthy deniega', async () => {
  for (const truthy of [1, 'yes']) {
    const bus = roomBus();
    const svc = new SocketRoomSignalingService({
      client: bus.makeClient(`anon-${String(truthy)}`),
      room: ROOM
    });
    await svc.connect(`anon-${String(truthy)}`, {
      admission: SIGNALING_ADMISSION.anonymous,
      requireSsbId: truthy
    });

    // El join anónimo NO puede entrar con una exigencia declarada
    await assert.rejects(() => svc.joinRoom(ROOM), /missing or malformed/);
    await assert.rejects(
      () => svc.sendOffer('bob', { type: 'offer', sdp: 'x' }),
      /peer-card required/
    );
    // y el valor quedó normalizado, no crudo
    assert.equal(svc._requireSsbId, true, 'la exigencia se guarda normalizada');
  }
});

test('D1c: el carril SSB NO admite antesala anónima (estructural, no por defecto)', async () => {
  const { SsbPrivateSignalingService } = await import('../src/ssb-private-signaling.mjs');

  // Antes se confiaba en `requireSsbId: true` por defecto; eso era un
  // defecto, no una imposibilidad. Ahora es imposible por construcción.
  const svc = new SsbPrivateSignalingService({ requireSsbId: false });
  assert.throws(
    () => svc.setAdmission(SIGNALING_ADMISSION.anonymous),
    /carril SSB no admite antesala anónima/
  );
  assert.throws(
    () => new SsbPrivateSignalingService({ admission: SIGNALING_ADMISSION.anonymous }),
    /carril SSB no admite antesala anónima/
  );
  assert.equal(svc.getAdmission(), 'peer-card', 'el modo del carril SSB no se mueve');
  // El modo estricto sí se puede fijar (no es un lanzador indiscriminado)
  svc.setAdmission(SIGNALING_ADMISSION.peerCard);
  assert.equal(svc.getAdmission(), 'peer-card');
});

// ───────────────────────────────────────────────────────────────────────
// Casos rojos · el bypass que buscará la contrarrevisión
// ───────────────────────────────────────────────────────────────────────

test('rojo 1: card presentada e INVÁLIDA rechaza también en modo anónimo (no degrada)', async () => {
  const bus = roomBus();
  const client = bus.makeClient('mallory');
  const svc = anonService(client);
  const expired = freshCard('mallory', { expiresAt: Date.now() - 1 });

  // (i) en el connect
  await assert.rejects(() => svc.connect('mallory', { peerCard: expired }), /expired/);
  assert.equal(svc.isConnected(), false, 'no hay sesión anónima encubierta');
  assert.equal(
    client.emitted.find((e) => e.event === 'CLIENT_REGISTER'),
    undefined,
    'ni siquiera registro anónimo'
  );

  // (ii) en la antesala
  const svc2 = anonService(bus.makeClient('mallory2'));
  await svc2.connect('mallory2');
  await assert.rejects(() => svc2.joinRoom(ROOM, { not: 'a-card' }), /missing or malformed/);
  assert.equal(svc2.getRoomId(), '', 'no entró a la antesala ni como anónimo');

  // (iii) en la acción saliente
  await assert.rejects(
    () =>
      svc2.sendMessage({
        type: 'offer',
        from: 'mallory2',
        to: 'bob',
        roomId: ROOM,
        timestamp: Date.now(),
        messageId: 'm1',
        peerCard: expired,
        offer: { type: 'offer', sdp: 'x' }
      }),
    /peer-card required: peer-card expired/
  );
});

test('rojo 2: card presentada e inválida ENTRANTE se rechaza, no se cuela como anónima', async () => {
  const bus = roomBus();
  const svc = anonService(bus.makeClient('alice'));
  await svc.connect('alice');
  const seen = [];
  const errors = [];
  svc.on('message', (m) => seen.push(m));
  svc.on('error', (e) => errors.push(e));

  svc._onWirePayload('webrtc-offer', {
    from: 'mallory',
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' },
    peerCard: freshCard('mallory', { expiresAt: Date.now() - 1 })
  });

  assert.equal(seen.length, 0, 'rechazado: no se entrega degradado a anónimo');
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /expired/);
});

test('rojo 3: card falsy PRESENTADA ≠ ausente — también rechaza en anónimo', () => {
  for (const falsy of [false, 0, '', NaN]) {
    assert.equal(isPeerCardPresented(falsy), true, `${String(falsy)} cuenta como presentada`);
    const r = assertSignalingAdmission(falsy, { admission: SIGNALING_ADMISSION.anonymous });
    assert.equal(r.ok, false, `${String(falsy)} presentada debe rechazar`);
    assert.equal(r.anonymous, false, `${String(falsy)} no degrada a anónimo`);
  }
  for (const absent of [null, undefined]) {
    assert.equal(isPeerCardPresented(absent), false);
    const r = assertSignalingAdmission(absent, { admission: SIGNALING_ADMISSION.anonymous });
    assert.equal(r.ok, true);
    assert.equal(r.anonymous, true);
    assert.equal(r.role, null, 'admitido sin rol');
  }
});

test('rojo 4: claim de identidad sin card DENIEGA (anónimo no es un pasaporte sin sello)', async () => {
  const ssbId = '@Vt0zURlyOWvW6yQL9Q9nQNwFq+ykYCEBJvfDBrmTFPQ=.ed25519';
  const bus = roomBus();
  const svc = anonService(bus.makeClient('alice'));
  await svc.connect('alice');
  const seen = [];
  const errors = [];
  svc.on('message', (m) => seen.push(m));
  svc.on('error', (e) => errors.push(e));

  // (i) ssbId suelto en el handshake, sin card que lo respalde
  svc._onWirePayload('webrtc-offer', {
    from: 'mallory',
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' },
    ssbId
  });
  assert.equal(seen.length, 0, 'no se entrega el claim sin sello');
  assert.match(errors[0].message, /unproven identity claim/);

  // (ii) suplantar el feed usando `from` con forma de identidad SSB
  svc._onWirePayload('webrtc-offer', {
    from: ssbId,
    to: 'alice',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' }
  });
  assert.equal(seen.length, 0, 'from con forma de feed tampoco pasa sin card');
  assert.match(errors[1].message, /unproven identity claim/);

  // (iii) tampoco de salida: lo que no se acredita, no viaja
  await assert.rejects(
    () =>
      svc.sendMessage({
        type: 'offer',
        from: 'alice',
        to: 'bob',
        roomId: ROOM,
        timestamp: Date.now(),
        messageId: 'm2',
        ssbId,
        offer: { type: 'offer', sdp: 'x' }
      }),
    /unproven identity claim/
  );
});

test('rojo 5: el modo de admisión NO se negocia por el cable', async () => {
  const bus = roomBus();
  const strict = new SocketRoomSignalingService({
    client: bus.makeClient('strict'),
    room: ROOM
  });
  await strict.connect('strict');
  const seen = [];
  const errors = [];
  strict.on('message', (m) => seen.push(m));
  strict.on('error', (e) => errors.push(e));

  // El par remoto afirma anonimato en el payload: no vale, no se lee.
  strict._onWirePayload('webrtc-offer', {
    from: 'mallory',
    to: 'strict',
    room: ROOM,
    data: { type: 'offer', sdp: 'x' },
    anonymous: true,
    admission: 'anonymous'
  });

  assert.equal(seen.length, 0, 'declararse anónimo no abre la antesala estricta');
  assert.match(errors[0].message, /missing or malformed/);
  assert.equal(strict.getAdmission(), 'peer-card', 'el modo local no se movió');
});

test('rojo 6: no hay tercer modo — setAdmission sólo acepta los dos declarados', () => {
  const bus = roomBus();
  const svc = new SocketRoomSignalingService({ client: bus.makeClient('x'), room: ROOM });
  for (const bad of ['anon', 'ANONYMOUS', '', null, undefined, true, {}]) {
    assert.throws(() => svc.setAdmission(bad), /unknown admission mode/);
  }
  assert.equal(svc.getAdmission(), 'peer-card');
  svc.setAdmission(SIGNALING_ADMISSION.anonymous);
  assert.equal(svc.getAdmission(), 'anonymous');
});

test('rojo 7: modo anónimo NO abre lo no-gated ni cambia la ruta de card válida', async () => {
  const bus = roomBus();
  const svc = anonService(bus.makeClient('alice'));
  await svc.connect('alice');

  // Card válida sigue funcionando igual y sí concede rol EN LA ACCIÓN
  await svc.joinRoom(ROOM, freshCard('alice'));
  assert.equal(svc.getSessionRole(), 'player');
  assert.equal(svc.isAnonymous(), false);

  const announce = bus.wire.find((f) => f.event === 'join-room');
  assert.ok(announce.payload.peerCard, 'con card, el anuncio la lleva');
});
