import test from 'node:test';
import assert from 'node:assert/strict';
import { SocketClient } from '@zeus/socket-core/client';
import { createScriptoriumServer } from '../src/index.mjs';
import {
  emitDownstream,
  relayDiscardLedger,
  resetRelayDiscardLedger
} from '../src/relay.mjs';
import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from '../src/config.mjs';

/** Espera activa con tope; falla con etiqueta si no se cumple. */
function waitFor(predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        reject(new Error(`timeout esperando: ${label}`));
      }
    }, 25);
  });
}

function fakeNamespace() {
  return {
    emitted: [],
    emit(event, data) {
      this.emitted.push({ event, data });
    }
  };
}

/**
 * Política de bajada PREVIA a U192, transcrita literalmente de
 * src/relay.mjs:5-21 en la base de esta rama (commit 4210b12 de Z_SDK;
 * ✎ orquestador: la cita original 412673c era un hash de otro repo —
 * corregida en aceptación, verificada por contrarrevisión contra 4210b12):
 * qué emitía emitDownstream para cada payload, sin traza alguna.
 * Sirve de referencia congelada para probar que la política no cambió.
 */
function politicaPreviaEmitDownstream(payload) {
  const emitted = [];
  const emit = (event, data) => emitted.push({ event, data });
  if (!payload || typeof payload !== 'object') return emitted;
  emit('ROOM_MESSAGE', payload);
  const inner = payload.event;
  const data = payload.data;
  if (!inner) return emitted;
  if (inner === 'SET_STATE' && data) {
    emit('SET_STATE', data);
    return emitted;
  }
  if (inner !== 'MAKE_MASTER') {
    emit(inner, data);
  }
  return emitted;
}

test('política intacta: los conjuntos de propagación son los previos a U192', () => {
  assert.deepEqual(RELAY_UPSTREAM, ['CLIENT_REGISTER', 'CLIENT_SUSCRIBE', 'ROOM_MESSAGE']);
  assert.deepEqual(
    [...RELAY_DOWNSTREAM_TOP].sort(),
    [
      'SET_STATE',
      'catalog:servers',
      'deck:error',
      'deck:resolved',
      'intent',
      'ledger',
      'state',
      'track'
    ].sort()
  );
});

test('emitDownstream emite EXACTAMENTE lo mismo que la política previa a U192', () => {
  resetRelayDiscardLedger();
  const sondas = [
    null,
    undefined,
    42,
    'texto',
    {},
    { event: null },
    { event: 'SET_STATE', data: { a: 1 } },
    { event: 'SET_STATE' },
    { event: 'MAKE_MASTER', data: { room: 'R' } },
    { event: 'MAKE_MASTER' },
    { event: 'deck:resolved', data: 7 },
    { event: 'evento:cualquiera', data: { x: true } },
    { event: 'CLIENT_REGISTER', data: {} },
    { event: 'CLIENT_SUSCRIBE', data: { room: 'R' } },
    { event: 'ROOM_MESSAGE', data: { anidado: true } },
    ...[...RELAY_DOWNSTREAM_TOP].map((ev) => ({ event: ev, data: { via: 'sobre' } }))
  ];
  for (const payload of sondas) {
    const ns = fakeNamespace();
    emitDownstream(ns, payload);
    assert.deepEqual(
      ns.emitted,
      politicaPreviaEmitDownstream(payload),
      `emisión divergente para payload=${JSON.stringify(payload)}`
    );
  }
});

test('todo corte de bajada en emitDownstream deja registro con motivo', () => {
  resetRelayDiscardLedger();
  const ns = fakeNamespace();

  emitDownstream(ns, { event: 'MAKE_MASTER', data: { room: 'R' } });
  emitDownstream(ns, null);
  emitDownstream(ns, { data: 'sobre sin evento' });

  const ledger = relayDiscardLedger();
  const master = ledger.find((e) => e.event === 'MAKE_MASTER');
  assert.ok(master, 'MAKE_MASTER suprimido debe dejar registro');
  assert.equal(master.direction, 'downstream');
  assert.equal(master.reason, 'make-master-suprimido');
  assert.equal(master.count, 1);

  const malformado = ledger.find((e) => e.reason === 'sobre-no-objeto');
  assert.ok(malformado, 'payload no-objeto debe dejar registro');
  assert.equal(malformado.direction, 'downstream');

  const sinEvento = ledger.find((e) => e.reason === 'sobre-sin-evento-interno');
  assert.ok(sinEvento, 'sobre sin evento interno debe dejar registro');
  assert.equal(sinEvento.direction, 'downstream');

  assert.equal(ledger.length, 3, 'exactamente un registro agregado por corte');
});

test('lo propagado NO deja registro; lo repetido agrega contador (no inunda)', () => {
  resetRelayDiscardLedger();
  const ns = fakeNamespace();

  emitDownstream(ns, { event: 'SET_STATE', data: { a: 1 } });
  emitDownstream(ns, { event: 'deck:resolved', data: {} });
  assert.equal(relayDiscardLedger().length, 0, 'propagar no genera registros');

  for (let i = 0; i < 5; i += 1) {
    emitDownstream(ns, { event: 'MAKE_MASTER', data: { i } });
  }
  const ledger = relayDiscardLedger();
  assert.equal(ledger.length, 1, 'descartes repetidos = un solo registro agregado');
  assert.equal(ledger[0].count, 5);
  assert.equal(ledger[0].event, 'MAKE_MASTER');
  assert.equal(ledger[0].reason, 'make-master-suprimido');
});

test('e2e puente real: lo no propagado deja rastro con motivo y la política no cambia', async () => {
  resetRelayDiscardLedger();

  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosArriba = [];
  /** @type {Array<{ event: string, data: unknown }>} */
  const vistosAbajo = [];

  const arriba = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'local' });
  const nsArriba = arriba.socketServer.io.of(`/${NAMESPACE}`);
  nsArriba.on('connection', (socket) => {
    socket.onAny((event, data) => vistosArriba.push({ event, data }));
  });

  process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL = arriba.url;
  let abajo;
  let observador;
  try {
    abajo = await createScriptoriumServer({ port: 0, host: '127.0.0.1', bridge: 'remote' });
    await waitFor(() => abajo.bridgeClient?.io?.connected, 8000, 'puente conectado');

    observador = new SocketClient('observador-u192', abajo.url, `/${NAMESPACE}`, {
      auth: { token: 'test', room: 'PUBLIC_ROOM', user: 'observador-u192' }
    });
    observador.io.onAny((event, data) => vistosAbajo.push({ event, data }));
    await waitFor(() => observador.io.connected, 8000, 'observador conectado');

    // ── BAJADA: inyección desde arriba hacia el relay ──────────────────
    nsArriba.emit('EVENTO_INTRUSO', { marca: 'u192' }); // fuera de allowlist
    nsArriba.emit('EVENTO_INTRUSO', { marca: 'u192-bis' }); // repetido: agrega contador
    nsArriba.emit('CLIENT_SUSCRIBE', { room: 'X' }); // eco de nombre de subida
    nsArriba.emit('ROOM_MESSAGE', { event: 'MAKE_MASTER', room: 'R', data: {} }); // inner suprimido
    nsArriba.emit('ROOM_MESSAGE', { event: 'deck:resolved', room: 'R', data: { ok: true } }); // unwrap propagado
    for (const ev of RELAY_DOWNSTREAM_TOP) {
      nsArriba.emit(ev, { allowlist: ev }); // los 8 permitidos, tal cual antes
    }

    await waitFor(
      () =>
        [...RELAY_DOWNSTREAM_TOP].every((ev) =>
          vistosAbajo.some((v) => v.event === ev && v.data?.allowlist === ev)
        ),
      8000,
      'los 8 de la allowlist llegan abajo'
    );

    // Política intacta (bajada): lo permitido llega…
    assert.ok(vistosAbajo.some((v) => v.event === 'deck:resolved' && v.data?.ok === true));
    assert.ok(vistosAbajo.some((v) => v.event === 'ROOM_MESSAGE' && v.data?.event === 'MAKE_MASTER'));
    // …y lo cortado no llega (mismo conjunto descartado que antes).
    assert.ok(!vistosAbajo.some((v) => v.event === 'EVENTO_INTRUSO'), 'fuera de allowlist no propaga');
    assert.ok(!vistosAbajo.some((v) => v.event === 'CLIENT_SUSCRIBE'), 'eco de subida no propaga');
    assert.ok(!vistosAbajo.some((v) => v.event === 'MAKE_MASTER'), 'MAKE_MASTER sigue suprimido');

    // Rastro con motivo (bajada).
    let ledger = relayDiscardLedger();
    const intruso = ledger.find((e) => e.event === 'EVENTO_INTRUSO');
    assert.ok(intruso, 'el evento fuera de allowlist deja registro');
    assert.equal(intruso.direction, 'downstream');
    assert.equal(intruso.reason, 'fuera-de-allowlist-de-bajada');
    assert.equal(intruso.count, 2, 'dos inyecciones = un registro con contador 2');

    const eco = ledger.find((e) => e.event === 'CLIENT_SUSCRIBE' && e.direction === 'downstream');
    assert.ok(eco, 'el eco de nombre de subida deja registro');
    assert.equal(eco.reason, 'eco-de-nombre-de-subida');

    const master = ledger.find((e) => e.event === 'MAKE_MASTER');
    assert.ok(master, 'MAKE_MASTER suprimido deja registro');
    assert.equal(master.reason, 'make-master-suprimido');

    for (const ev of RELAY_DOWNSTREAM_TOP) {
      assert.ok(
        !ledger.some((e) => e.event === ev && e.direction === 'downstream'),
        `${ev} propagó: no debe figurar como descarte`
      );
    }
    assert.ok(
      !ledger.some((e) => e.event === 'ROOM_MESSAGE' && e.direction === 'downstream'),
      'ROOM_MESSAGE propaga por su handler dedicado: no es descarte'
    );

    // ── SUBIDA: el cliente local emite; el relay solo reenvía los 3 ────
    observador.io.emit('EVENTO_LOCAL_INTRUSO', { x: 1 });
    observador.io.emit('CLIENT_SUSCRIBE', { room: 'SALA_U192' });
    observador.io.emit('ROOM_MESSAGE', { event: 'ping', room: 'SALA_U192', data: {} });
    observador.io.emit('CLIENT_REGISTER', { usuario: 'observador-u192', sesion: 's1' });

    await waitFor(
      () => vistosArriba.some((v) => v.event === 'CLIENT_REGISTER' && v.data?.usuario === 'observador-u192'),
      8000,
      'CLIENT_REGISTER reenviado llega arriba'
    );

    // Política intacta (subida): los 3 de RELAY_UPSTREAM cruzan el puente…
    assert.ok(vistosArriba.some((v) => v.event === 'CLIENT_SUSCRIBE' && v.data?.room === 'SALA_U192'));
    assert.ok(vistosArriba.some((v) => v.event === 'ROOM_MESSAGE' && v.data?.event === 'ping'));
    // …y lo demás no cruza, pero queda trazado.
    assert.ok(
      !vistosArriba.some((v) => v.event === 'EVENTO_LOCAL_INTRUSO'),
      'lo no suscrito no cruza el puente'
    );

    ledger = relayDiscardLedger();
    const intrusoLocal = ledger.find((e) => e.event === 'EVENTO_LOCAL_INTRUSO');
    assert.ok(intrusoLocal, 'el corte de subida deja registro');
    assert.equal(intrusoLocal.direction, 'upstream');
    assert.equal(intrusoLocal.reason, 'fuera-del-conjunto-de-subida');
    assert.ok(
      !ledger.some((e) => e.direction === 'upstream' && RELAY_UPSTREAM.includes(e.event)),
      'los 3 reenviados de subida no figuran como descarte'
    );
  } finally {
    delete process.env.ZEUS_SCRIPTORIUM_BRIDGE_URL;
    observador?.io?.disconnect();
    observador?.io?.close();
    if (abajo) await abajo.close();
    await arriba.close();
  }
});
