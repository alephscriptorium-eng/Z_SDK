/**
 * WP-U196 — las zonas dejan de ser un filtro y pasan a ser un ámbito.
 *
 * TODO lo que se afirma aquí se **cuenta en el servidor**, en el adaptador de
 * socket.io (`nsp.adapter.broadcast` → `adapter.apply`): entregas realmente
 * escritas a un socket. Un cliente que recibe y descarta CUENTA como entrega;
 * por eso el conteo no puede vivir en el cliente. Las aserciones que miran al
 * cliente están marcadas como *corroboración*, nunca como la prueba.
 *
 * Contra el código anterior a U196 estos tests fallan con una cifra
 * (2 entregas donde se exige 1), no con un error de importación.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { SocketServer } from '@zeus/socket-core/server';
import { SocketClient } from '@zeus/socket-core/client';
import { connectAndJoin, emitRoomEvent } from '../src/index.mjs';

const NS = 'runtime';

/**
 * @param {import('node:events').EventEmitter} emitter
 * @param {string} event
 * @param {number} [ms]
 */
function onceTimeout(emitter, event, ms = 4000) {
  return Promise.race([
    once(emitter, event),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), ms);
    })
  ]);
}

/**
 * Arranca servidor + fábrica de clientes y REGISTRA el cierre en `t.after`,
 * para que un assert que falla no deje handles vivos colgando el proceso.
 * @param {import('node:test').TestContext} [t]
 */
async function bootServer(t) {
  const httpServer = http.createServer();
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = /** @type {import('node:net').AddressInfo} */ (
    httpServer.address()
  );
  const socketServer = new SocketServer('U196', httpServer, {
    activateInstrumens: false,
    autoBroadcast: true
  });
  socketServer.createNamespace(NS);

  /** @type {SocketClient[]} */
  const clients = [];
  let cerrado = false;

  const handle = {
    port,
    socketServer,
    url: `http://127.0.0.1:${port}`,
    /** @param {string} user */
    client(user) {
      const c = new SocketClient(user, `http://127.0.0.1:${port}`, `/${NS}`, {
        autoConnect: false,
        reconnection: false
      });
      clients.push(c);
      return c;
    },
    async close() {
      if (cerrado) return;
      cerrado = true;
      for (const c of clients) {
        c.io.disconnect();
        c.io.close();
      }
      socketServer.io.disconnectSockets(true);
      await new Promise((resolve) => socketServer.io.close(() => resolve()));
      if (httpServer.listening) {
        await new Promise((resolve) => httpServer.close(() => resolve()));
      }
    }
  };

  t?.after(() => handle.close());
  return handle;
}

/**
 * Contador de entregas EN EL SERVIDOR.
 *
 * Envuelve `adapter.broadcast` y, sólo durante esa llamada, sustituye
 * `adapter.apply` por un espía que incrementa por cada socket al que el
 * adaptador escribe de verdad. No estima por tamaño de sala: cuenta la
 * escritura.
 *
 * @param {SocketServer} socketServer
 */
function trackDeliveries(socketServer) {
  const nsp = socketServer.io.of(`/${NS}`);
  const adapter = /** @type {any} */ (nsp.adapter);
  const originalBroadcast = adapter.broadcast.bind(adapter);
  const originalApply = adapter.apply.bind(adapter);

  /** @type {Array<{ event: string, rooms: string[], deliveries: number }>} */
  const log = [];

  adapter.broadcast = (packet, opts) => {
    let deliveries = 0;
    adapter.apply = (o, cb) =>
      originalApply(o, (socket) => {
        deliveries += 1;
        cb(socket);
      });
    try {
      originalBroadcast(packet, opts);
    } finally {
      adapter.apply = originalApply;
    }
    log.push({
      event: Array.isArray(packet.data) ? String(packet.data[0]) : '',
      rooms: [...(opts.rooms ?? [])],
      deliveries
    });
  };

  return {
    log,
    /** @param {string} event */
    entriesFor(event) {
      return log.filter((e) => e.event === event);
    },
    /** @param {string} event */
    totalFor(event) {
      return this.entriesFor(event).reduce((a, e) => a + e.deliveries, 0);
    },
    reset() {
      log.length = 0;
    },
    restore() {
      adapter.broadcast = originalBroadcast;
      adapter.apply = originalApply;
    }
  };
}

/**
 * Espera a que el servidor haya procesado `expected` altas de CLIENT_SUSCRIBE.
 * Cuenta el libro del servidor (`roomsSockets`), sin depender del NOMBRE del
 * canal — así el mismo helper sirve antes y después de U196.
 *
 * @param {SocketServer} socketServer
 * @param {number} expected
 * @param {number} [ms]
 */
async function waitForSubscribes(socketServer, expected, ms = 4000) {
  const total = () =>
    [...socketServer.roomsSockets.values()].reduce((a, l) => a + l.length, 0);
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (total() >= expected) return total();
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(
    `timeout: ${expected} altas esperadas, ${total()} vistas; canales=${JSON.stringify(
      [...socketServer.roomsSockets.entries()]
    )}`
  );
}

/**
 * Espera a que el servidor haya emitido `count` broadcasts de `event`.
 * @param {ReturnType<typeof trackDeliveries>} tracker
 * @param {string} event
 * @param {number} count
 * @param {number} [ms]
 */
async function waitForBroadcasts(tracker, event, count, ms = 4000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (tracker.entriesFor(event).length >= count) return tracker.entriesFor(event);
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(
    `timeout: ${count} broadcasts de ${event} esperados, ${
      tracker.entriesFor(event).length
    } vistos; log=${JSON.stringify(tracker.log)}`
  );
}

/**
 * Ventana de silencio: deja pasar tiempo real para que un mensaje "que no
 * debía llegar" tenga oportunidad de llegar antes de afirmar que no llegó.
 */
function silencio(ms = 250) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {Awaited<ReturnType<typeof bootServer>>} h
 * @param {string} user
 */
async function emitter(h, user) {
  const c = h.client(user);
  c.io.connect();
  await onceTimeout(c.io, 'connect');
  c.io.emit('CLIENT_REGISTER', { usuario: user, sesion: `${user}-1` });
  return c;
}

/**
 * @param {Awaited<ReturnType<typeof bootServer>>} h
 * @param {string} user
 * @param {string} room
 * @param {string | string[] | undefined} zones
 * @param {string} topic
 */
async function subscriber(h, user, room, zones, topic) {
  const c = h.client(user);
  /** @type {unknown[]} */
  const seen = [];
  c.io.on(topic, (p) => seen.push(p));
  const joined = await connectAndJoin(c, user, { room, zones, features: ['u196'] });
  return { client: c, seen, joined };
}

// ─────────────────────────────────────────────────────────────────────────────
// CA1 + CA2 · mismo topic, dos zonas, dos conversaciones
// ─────────────────────────────────────────────────────────────────────────────

test('CA1/CA2 · mismo topic en dos zonas = dos conversaciones (entregas contadas en el servidor)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196';
  const TOPIC = 'PLANO_CAMBIA';

  const a = await subscriber(h, 'ana', ROOM, ['norte'], TOPIC);
  const b = await subscriber(h, 'bruno', ROOM, ['sur'], TOPIC);
  await waitForSubscribes(h.socketServer, 2);

  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');

  // Emisión EN la zona norte.
  emitRoomEvent(src, TOPIC, { donde: 'norte' }, ROOM, 'norte');
  const [n1] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(
    n1.deliveries,
    1,
    'una emisión en la zona norte debe escribirse a UN socket (el de norte), no a los dos de la sala'
  );

  // Emisión EN la zona sur.
  emitRoomEvent(src, TOPIC, { donde: 'sur' }, ROOM, 'sur');
  const dos = await waitForBroadcasts(tracker, TOPIC, 2);
  assert.equal(dos[1].deliveries, 1, 'la emisión en sur también escribe a UN socket');

  // Los dos canales son distintos: dos conversaciones, no una filtrada.
  assert.notDeepEqual(
    dos[0].rooms,
    dos[1].rooms,
    'norte y sur deben resolverse a canales distintos en el servidor'
  );

  await silencio();

  // Corroboración en cliente (no es la prueba).
  assert.deepEqual(a.seen, [{ donde: 'norte' }], 'ana sólo vio lo de norte');
  assert.deepEqual(b.seen, [{ donde: 'sur' }], 'bruno sólo vio lo de sur');

  tracker.restore();
  await h.close();
});

test('CA2 · el aislamiento se prueba en los DOS sentidos (0 entregas cruzadas)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_CRUCE';
  const TOPIC = 'CRUCE';

  await subscriber(h, 'ana', ROOM, ['norte'], TOPIC);
  await subscriber(h, 'bruno', ROOM, ['sur'], TOPIC);
  await waitForSubscribes(h.socketServer, 2);

  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');

  emitRoomEvent(src, TOPIC, { i: 1 }, ROOM, 'norte');
  emitRoomEvent(src, TOPIC, { i: 2 }, ROOM, 'sur');
  const entries = await waitForBroadcasts(tracker, TOPIC, 2);

  // norte → 1 entrega (ana). sur → 1 entrega (bruno). Ni una cruzada.
  assert.deepEqual(
    entries.map((e) => e.deliveries),
    [1, 1],
    'norte→sur y sur→norte: cero entregas cruzadas en el servidor'
  );

  tracker.restore();
  await h.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// CA3 · fan-out MEDIDO con 1, 2 y N zonas
// ─────────────────────────────────────────────────────────────────────────────

test('CA3 · fan-out medido: 6 suscriptores repartidos en 1, 2 y 6 zonas', async (t) => {
  const ROOM = 'ROOM_U196_FANOUT';
  const TOPIC = 'TICK';
  const POBLACION = 6;

  /**
   * @param {string[] | null} reparto lista de zonas, una por suscriptor;
   *   null = ninguno declara zona (la sala desnuda de hoy)
   */
  async function medir(reparto) {
    const h = await bootServer(t);
    const zonas = reparto ? [...new Set(reparto)] : [];
    for (let i = 0; i < POBLACION; i += 1) {
      await subscriber(
        h,
        `p${i}`,
        ROOM,
        reparto ? [reparto[i]] : undefined,
        TOPIC
      );
    }
    await waitForSubscribes(h.socketServer, POBLACION);

    const tracker = trackDeliveries(h.socketServer);
    const src = await emitter(h, 'fuente');

    // Cubrir a TODA la población: una emisión por zona (o una sola si no hay zonas).
    const emisiones = zonas.length === 0 ? 1 : zonas.length;
    if (zonas.length === 0) {
      emitRoomEvent(src, TOPIC, { n: 0 }, ROOM);
    } else {
      for (const z of zonas) emitRoomEvent(src, TOPIC, { z }, ROOM, z);
    }
    const entries = await waitForBroadcasts(tracker, TOPIC, emisiones);

    const porEmision = entries.map((e) => e.deliveries);
    const total = porEmision.reduce((a, n) => a + n, 0);
    const canales = h.socketServer.io.of(`/${NS}`).adapter.rooms.size;

    tracker.restore();
    await h.close();
    return { emisiones, porEmision, total, canales };
  }

  const sinZonas = await medir(null);
  const dosZonas = await medir(['n', 'n', 'n', 's', 's', 's']);
  const seisZonas = await medir(['z0', 'z1', 'z2', 'z3', 'z4', 'z5']);

  console.log(
    '[U196 fan-out] ' +
      JSON.stringify({ sinZonas, dosZonas, seisZonas }, null, 0)
  );

  // 0 zonas: 1 emisión, 6 entregas.
  assert.deepEqual(sinZonas.porEmision, [6]);
  assert.equal(sinZonas.total, 6);

  // 2 zonas (3+3): cada emisión escribe a 3. Cubrir la sala cuesta 2 emisiones.
  assert.deepEqual(dosZonas.porEmision, [3, 3]);
  assert.equal(dosZonas.emisiones, 2);
  assert.equal(dosZonas.total, 6);

  // 6 zonas (1+1+...): cada emisión escribe a 1. Cubrir la sala cuesta 6.
  assert.deepEqual(seisZonas.porEmision, [1, 1, 1, 1, 1, 1]);
  assert.equal(seisZonas.emisiones, 6);
  assert.equal(seisZonas.total, 6);

  // El precio en memoria: un canal más por zona en el adaptador.
  assert.ok(
    seisZonas.canales > dosZonas.canales,
    `6 zonas debe registrar más canales que 2 (${seisZonas.canales} vs ${dosZonas.canales})`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// CA4 · hostil-omite: la ausencia NO puede significar «todas»
// ─────────────────────────────────────────────────────────────────────────────

test('CA4 · sin zonas declaradas NO se recibe lo emitido en una zona (0 entregas)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_OMIT';
  const TOPIC = 'OMIT';

  const mudo = await subscriber(h, 'mudo', ROOM, undefined, TOPIC);
  await waitForSubscribes(h.socketServer, 1);

  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');

  emitRoomEvent(src, TOPIC, { donde: 'norte' }, ROOM, 'norte');
  const [e1] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(
    e1.deliveries,
    0,
    'omitir zones no es "todas las zonas": es el ámbito sin zona, y no recibe lo zonificado'
  );

  await silencio();
  assert.deepEqual(mudo.seen, [], 'corroboración: nada llegó al cliente sin zona');

  // ...y el sentido contrario: el suscriptor de zona no recibe lo de la sala desnuda.
  const norte = await subscriber(h, 'norte-peer', ROOM, ['norte'], TOPIC);
  await waitForSubscribes(h.socketServer, 2);
  tracker.reset();
  emitRoomEvent(src, TOPIC, { donde: 'sala-desnuda' }, ROOM);
  const [e2] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(
    e2.deliveries,
    1,
    'la sala desnuda entrega sólo a quien no declaró zona (1), no al de zona norte'
  );
  await silencio();
  assert.deepEqual(norte.seen, [], 'corroboración: el de zona no vio lo de la sala desnuda');

  tracker.restore();
  await h.close();
});

test('CA4 · null, [] y cadena vacía se comportan igual que omitir (mismo canal, 1 alta)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_VACIOS';
  const TOPIC = 'VACIOS';

  const casos = [
    ['omitido', undefined],
    ['null', null],
    ['lista vacía', []],
    ['cadena vacía', ''],
    ['sólo espacios', '   ']
  ];

  const canales = [];
  for (const [nombre, valor] of casos) {
    const s = await subscriber(h, `v-${nombre}`, ROOM, valor, TOPIC);
    canales.push([nombre, s.joined]);
  }
  await waitForSubscribes(h.socketServer, casos.length);

  // Los cinco han caído en el MISMO canal: la sala desnuda. Ni uno solo
  // acabó en un canal "comodín" ni recibiendo de todas las zonas.
  const libro = [...h.socketServer.roomsSockets.entries()].filter(
    ([, l]) => l.length > 0
  );
  assert.equal(libro.length, 1, `un solo canal esperado, hay ${JSON.stringify(libro)}`);
  assert.equal(libro[0][0], ROOM, 'el canal es la sala desnuda, sin sufijo de zona');
  assert.equal(libro[0][1].length, casos.length);

  // Y ninguno recibe lo emitido en una zona.
  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');
  emitRoomEvent(src, TOPIC, { donde: 'norte' }, ROOM, 'norte');
  const [e] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(e.deliveries, 0, 'ninguna de las cinco formas de "nada" recibe lo zonificado');

  tracker.restore();
  await h.close();
});

test('CA4 · la misma zona repetida es UNA membresía y UNA entrega, no dos', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_DUP';
  const TOPIC = 'DUP';

  const s = await subscriber(h, 'repetidor', ROOM, ['norte', 'norte'], TOPIC);
  await waitForSubscribes(h.socketServer, 1);

  const libro = [...h.socketServer.roomsSockets.entries()].filter(
    ([, l]) => l.length > 0
  );
  assert.equal(libro.length, 1, 'una zona repetida no abre dos canales');
  assert.equal(
    libro[0][1].length,
    1,
    `una zona repetida no da de alta dos veces el mismo socket: ${JSON.stringify(libro)}`
  );
  // Sin esto el test seguiría verde con el aislamiento apagado (una sola sala
  // desnuda también da «1 canal, 1 alta, 1 entrega»). Exige que el canal SEA
  // de zona y que la repetición se haya colapsado ya en el contrato de vuelta.
  assert.notEqual(
    libro[0][0],
    ROOM,
    `la zona debe abrir un canal propio, no caer en la sala desnuda: ${libro[0][0]}`
  );
  assert.ok(
    libro[0][0].startsWith(ROOM) && libro[0][0].length > ROOM.length,
    `el canal de zona deriva de la sala: ${libro[0][0]}`
  );
  assert.deepEqual(
    s.joined.zones,
    ['norte'],
    'el contrato de vuelta declara la zona una sola vez'
  );

  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');
  emitRoomEvent(src, TOPIC, { i: 1 }, ROOM, 'norte');
  const [e] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(e.deliveries, 1, 'una zona repetida no duplica la entrega');

  await silencio();
  assert.equal(s.seen.length, 1, 'corroboración: el cliente recibió una sola copia');

  tracker.restore();
  await h.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// CA2 · el espacio de nombres es disjunto POR LOS DOS LADOS
// (contrarrevisión: el guardia estaba sólo en el id de zona)
// ─────────────────────────────────────────────────────────────────────────────

test('CA2 · una SALA no puede llamarse como el canal de una zona (vector de la contrarrevisión)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_DISJUNTO';
  const TOPIC = 'DISJUNTO';
  const CANAL_DE_ZONA = `${ROOM}::z:norte`;

  // Ana pide la zona norte por la vía legítima.
  const ana = await subscriber(h, 'ana', ROOM, ['norte'], TOPIC);
  await waitForSubscribes(h.socketServer, 1);

  // Bruno intenta entrar al MISMO canal disfrazando el nombre de la sala,
  // sin declarar zona ninguna. `room` es entrada externa (ZEUS_SCRIPTORIUM_ROOM,
  // ?room=), así que esto no es un llamante hostil hipotético.
  await assert.rejects(
    () => subscriber(h, 'bruno', CANAL_DE_ZONA, undefined, TOPIC),
    /no puede contener/,
    'una sala con el separador debe rechazarse al suscribir'
  );

  // Y el sentido contrario: emitir a ese nombre "de sala", sin zona.
  const src = await emitter(h, 'fuente');
  assert.throws(
    () => emitRoomEvent(src, TOPIC, { colado: true }, CANAL_DE_ZONA),
    /no puede contener/,
    'una sala con el separador debe rechazarse al emitir'
  );

  // El canal de ana sigue teniendo un solo miembro y nadie coló nada.
  const tracker = trackDeliveries(h.socketServer);
  emitRoomEvent(src, TOPIC, { donde: 'norte' }, ROOM, 'norte');
  const [e] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(e.deliveries, 1, 'sigue habiendo UN socket en el canal de la zona');

  await silencio();
  assert.deepEqual(ana.seen, [{ donde: 'norte' }]);

  tracker.restore();
  await h.close();
});

test('CA4 · dos suscriptores en la MISMA zona son una conversación de dos (2 entregas)', async (t) => {
  const h = await bootServer(t);
  const ROOM = 'ROOM_U196_MISMA';
  const TOPIC = 'MISMA';

  await subscriber(h, 'a', ROOM, ['norte'], TOPIC);
  await subscriber(h, 'b', ROOM, ['norte'], TOPIC);
  await subscriber(h, 'c', ROOM, ['sur'], TOPIC);
  await waitForSubscribes(h.socketServer, 3);

  const tracker = trackDeliveries(h.socketServer);
  const src = await emitter(h, 'fuente');
  emitRoomEvent(src, TOPIC, { i: 1 }, ROOM, 'norte');
  const [e] = await waitForBroadcasts(tracker, TOPIC, 1);
  assert.equal(e.deliveries, 2, 'la zona no aísla dentro de sí misma: los dos de norte reciben');

  tracker.restore();
  await h.close();
});
