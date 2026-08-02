/**
 * WP-U196 — contrato del ámbito de zona, sin red.
 *
 * Aquí no se mide fan-out (eso vive en `zonas-ambito.test.mjs`, contra un
 * servidor de verdad). Aquí se fija QUÉ significa cada forma de «nada» y qué
 * se rechaza en voz alta, porque un ámbito que se ensancha en silencio no es
 * un ámbito.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  ZONE_SCOPE_SEPARATOR,
  zoneChannel,
  normalizeZones,
  resolveZoneChannels,
  connectAndJoin,
  emitRoomEvent,
  setState,
  makeMaster
} from '../src/index.mjs';

/** Cliente falso: registra lo emitido sin abrir red. */
function fakeClient(id = 'sock-x') {
  const io = new EventEmitter();
  io.id = id;
  io.io = { opts: {} };
  io.connect = () => queueMicrotask(() => EventEmitter.prototype.emit.call(io, 'connect'));
  io.disconnect = () => {};
  const emitted = [];
  io.emit = (event, payload) => {
    EventEmitter.prototype.emit.call(io, event, payload);
    emitted.push({ event, payload });
  };
  const roomCalls = [];
  return {
    io,
    emitted,
    roomCalls,
    room: (event, data, room) => roomCalls.push({ event, data, room })
  };
}

// ─── forma del canal ───────────────────────────────────────────────────────

test('zoneChannel deriva el canal de la sala y es determinista', () => {
  assert.equal(zoneChannel('SALA', 'norte'), `SALA${ZONE_SCOPE_SEPARATOR}norte`);
  assert.equal(zoneChannel('SALA', 'norte'), zoneChannel('SALA', ' norte '));
  assert.notEqual(zoneChannel('SALA', 'norte'), zoneChannel('SALA', 'sur'));
  assert.notEqual(zoneChannel('SALA', 'norte'), zoneChannel('OTRA', 'norte'));
  assert.notEqual(zoneChannel('SALA', 'norte'), 'SALA');
});

// ─── CA4 · la tabla de la ausencia ─────────────────────────────────────────

test('CA4 · tabla de decisión: ninguna forma de «nada» significa «todas»', () => {
  const ROOM = 'SALA';
  /** @type {Array<[string, unknown, string[], string[]]>} */
  const tabla = [
    // [nombre, entrada, zonas resueltas, canales]
    ['omitido', undefined, [], [ROOM]],
    ['null', null, [], [ROOM]],
    ['lista vacía', [], [], [ROOM]],
    ['cadena vacía', '', [], [ROOM]],
    ['sólo espacios', '   ', [], [ROOM]],
    ['lista de blancos', ['', '  '], [], [ROOM]],
    ['Set vacío', new Set(), [], [ROOM]],
    ['una zona', 'norte', ['norte'], [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`]],
    ['zona con espacios', ' norte ', ['norte'], [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`]],
    ['repetida', ['norte', 'norte'], ['norte'], [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`]],
    [
      'repetida con espacios',
      ['norte', ' norte'],
      ['norte'],
      [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`]
    ],
    [
      'dos zonas',
      ['norte', 'sur'],
      ['norte', 'sur'],
      [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`, `${ROOM}${ZONE_SCOPE_SEPARATOR}sur`]
    ],
    [
      'zona + blanco',
      ['norte', ''],
      ['norte'],
      [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`]
    ],
    [
      'Set con dos',
      new Set(['norte', 'sur']),
      ['norte', 'sur'],
      [`${ROOM}${ZONE_SCOPE_SEPARATOR}norte`, `${ROOM}${ZONE_SCOPE_SEPARATOR}sur`]
    ]
  ];

  for (const [nombre, entrada, zonasEsperadas, canalesEsperados] of tabla) {
    const r = resolveZoneChannels(ROOM, entrada);
    assert.deepEqual(r.zones, zonasEsperadas, `zonas de «${nombre}»`);
    assert.deepEqual(r.channels, canalesEsperados, `canales de «${nombre}»`);
    // La invariante que no se puede violar: la ausencia da UN canal, y ese
    // canal es la sala desnuda — el ámbito más pequeño, nunca el mayor.
    if (zonasEsperadas.length === 0) {
      assert.deepEqual(r.channels, [ROOM], `«${nombre}» debe caer en la sala desnuda`);
    }
  }
});

test('CA4 · normalizeZones nunca inventa zonas ni las duplica', () => {
  assert.deepEqual(normalizeZones(undefined), []);
  assert.deepEqual(normalizeZones(['a', 'b', 'a', 'b']), ['a', 'b']);
  assert.deepEqual(normalizeZones(['b', 'a']), ['b', 'a'], 'orden de aparición');
});

// ─── CA4 · lo que se rechaza en voz alta ───────────────────────────────────

test("CA4 · '*' se rechaza: aquí no hay comodín, y el silencio sería peor", () => {
  assert.throws(() => zoneChannel('SALA', '*'), /no hay comodín/);
  assert.throws(() => resolveZoneChannels('SALA', '*'), /no hay comodín/);
  assert.throws(() => resolveZoneChannels('SALA', ['norte', '*']), /no hay comodín/);
});

test('CA4 · un id de zona no puede colarse a otro ámbito por el separador', () => {
  assert.throws(
    () => zoneChannel('SALA', `otra${ZONE_SCOPE_SEPARATOR}zona`),
    /no puede contener/
  );
  assert.throws(
    () => resolveZoneChannels('SALA', [`x${ZONE_SCOPE_SEPARATOR}y`]),
    /no puede contener/
  );
});

test('CA4 · tipos imposibles fallan cerrado', () => {
  assert.throws(() => resolveZoneChannels('SALA', [1]), /debe ser una cadena/);
  assert.throws(() => resolveZoneChannels('SALA', [null]), /debe ser una cadena/);
  assert.throws(() => resolveZoneChannels('SALA', { norte: true }), /cadena, lista o Set/);
  assert.throws(() => zoneChannel('', 'norte'), /room debe ser/);
  assert.throws(() => resolveZoneChannels('', 'norte'), /room debe ser/);
});

// La rama SIN zonas de resolveZoneChannels no la cubría nadie: el guardia de
// `zoneChannel` satisfacía el test anterior. Sin `assertRoom` propio, esto
// devolvía `{ channels: [''] }` en silencio.  (mutante X13)
test('CA4 · resolveZoneChannels valida la sala TAMBIÉN cuando no hay zonas', () => {
  assert.throws(() => resolveZoneChannels('', undefined), /room debe ser/);
  assert.throws(() => resolveZoneChannels('   ', null), /room debe ser/);
  assert.throws(() => resolveZoneChannels('', []), /room debe ser/);
  assert.throws(() => resolveZoneChannels(undefined, undefined), /room debe ser/);
});

// ─── BLOQUEANTE · el separador prohibido POR LOS DOS LADOS ─────────────────

test('el nombre de SALA tampoco puede llevar el separador (espacios disjuntos)', () => {
  const disfraz = `SALA${ZONE_SCOPE_SEPARATOR}norte`;
  // sin zonas: la vía por la que se colaba
  assert.throws(() => resolveZoneChannels(disfraz, undefined), /no puede contener/);
  assert.throws(() => resolveZoneChannels(disfraz, null), /no puede contener/);
  assert.throws(() => resolveZoneChannels(disfraz, []), /no puede contener/);
  // con zonas
  assert.throws(() => resolveZoneChannels(disfraz, ['sur']), /no puede contener/);
  assert.throws(() => zoneChannel(disfraz, 'sur'), /no puede contener/);

  // Sin el guardia, estos dos nombres colisionan. Con él, es imposible
  // construir el mismo canal por dos caminos distintos.
  assert.equal(zoneChannel('SALA', 'norte'), disfraz);
});

test('el guardia de sala cubre las cuatro puertas públicas', () => {
  const disfraz = `SALA${ZONE_SCOPE_SEPARATOR}norte`;
  const client = fakeClient();
  assert.throws(() => emitRoomEvent(client, 'T', {}, disfraz), /no puede contener/);
  assert.throws(() => setState(client, disfraz, {}), /no puede contener/);
  assert.throws(() => makeMaster(client, disfraz, {}), /no puede contener/);
  assert.equal(client.roomCalls.length, 0, 'ninguna emisión escapó');
});

// ─── MENOR · la asimetría de la cadena vacía, declarada y clavada ──────────

test("la cadena vacía NO es simétrica entre suscribir y emitir, y es a propósito", () => {
  // Suscribir: el blanco cae a la sala desnuda (el ámbito más pequeño).
  assert.deepEqual(resolveZoneChannels('SALA', '').channels, ['SALA']);
  assert.deepEqual(resolveZoneChannels('SALA', '   ').channels, ['SALA']);

  // Emitir: el blanco LANZA. Tratarlo como ausencia publicaría en un destino
  // que el llamante no pidió y que ningún suscriptor de zona escucha.
  const client = fakeClient();
  assert.throws(() => emitRoomEvent(client, 'T', {}, 'SALA', ''), /no puede ser vacío/);
  assert.throws(() => emitRoomEvent(client, 'T', {}, 'SALA', '   '), /no puede ser vacío/);
  assert.throws(() => setState(client, 'SALA', {}, ''), /no puede ser vacío/);
  assert.throws(() => makeMaster(client, 'SALA', {}, ''), /no puede ser vacío/);
  assert.equal(client.roomCalls.length, 0, 'ninguna emisión con zona en blanco escapó');

  // Y la ausencia de verdad sí pasa por la sala desnuda en ambas mitades.
  emitRoomEvent(client, 'T', {}, 'SALA', undefined);
  emitRoomEvent(client, 'T', {}, 'SALA', null);
  assert.deepEqual(
    client.roomCalls.map((c) => c.room),
    ['SALA', 'SALA']
  );
});

// ─── MENOR · mayúsculas: decidido, no accidental ──────────────────────────

test('el id de zona es SENSIBLE A MAYÚSCULAS: Norte y norte son dos ámbitos', () => {
  assert.notEqual(zoneChannel('SALA', 'Norte'), zoneChannel('SALA', 'norte'));
  assert.deepEqual(normalizeZones(['Norte', 'norte']), ['Norte', 'norte']);
  assert.equal(resolveZoneChannels('SALA', ['Norte', 'norte']).channels.length, 2);
  // Lo único que se normaliza es el blanco de los bordes.
  assert.deepEqual(normalizeZones([' norte ', 'norte']), ['norte']);
  // El nombre de sala tampoco se pliega.
  assert.notEqual(zoneChannel('SALA', 'n'), zoneChannel('sala', 'n'));
});

// ─── el cable ──────────────────────────────────────────────────────────────

test('connectAndJoin: sin zonas, un CLIENT_SUSCRIBE a la sala desnuda y sin campo de zona', async () => {
  const client = fakeClient('sock-desnuda');
  const joined = await connectAndJoin(client, 'ana', { room: 'SALA' });

  const subs = client.emitted.filter((e) => e.event === 'CLIENT_SUSCRIBE');
  assert.equal(subs.length, 1);
  assert.deepEqual(subs[0].payload, { room: 'SALA' });
  assert.deepEqual(joined.zones, []);
  assert.deepEqual(joined.channels, ['SALA']);
});

test('connectAndJoin: una suscripción POR zona, cada una a su canal', async () => {
  const client = fakeClient('sock-zonas');
  const joined = await connectAndJoin(client, 'ana', {
    room: 'SALA',
    zones: ['norte', 'sur', 'norte']
  });

  const subs = client.emitted.filter((e) => e.event === 'CLIENT_SUSCRIBE');
  assert.equal(subs.length, 2, 'la zona repetida no genera una tercera suscripción');
  assert.deepEqual(subs[0].payload, {
    room: `SALA${ZONE_SCOPE_SEPARATOR}norte`,
    zone: 'norte'
  });
  assert.deepEqual(subs[1].payload, {
    room: `SALA${ZONE_SCOPE_SEPARATOR}sur`,
    zone: 'sur'
  });
  assert.deepEqual(joined.zones, ['norte', 'sur']);
  assert.deepEqual(joined.channels, [
    `SALA${ZONE_SCOPE_SEPARATOR}norte`,
    `SALA${ZONE_SCOPE_SEPARATOR}sur`
  ]);
  assert.equal(joined.room, 'SALA', 'la sala sigue siendo la sala');
});

test('connectAndJoin: una zona inválida falla ANTES de conectar (sin suscripción a medias)', async () => {
  const client = fakeClient('sock-malo');
  await assert.rejects(
    () => connectAndJoin(client, 'ana', { room: 'SALA', zones: ['norte', '*'] }),
    /no hay comodín/
  );
  assert.deepEqual(client.emitted, [], 'ni CLIENT_REGISTER ni CLIENT_SUSCRIBE');
});

test('emitRoomEvent / setState / makeMaster dirigen al canal de la zona', () => {
  const client = fakeClient();
  emitRoomEvent(client, 'TOPIC', { a: 1 }, 'SALA');
  emitRoomEvent(client, 'TOPIC', { a: 2 }, 'SALA', 'norte');
  setState(client, 'SALA', { p: 1 }, 'norte');
  makeMaster(client, 'SALA', { f: [] }, 'norte');

  assert.deepEqual(
    client.roomCalls.map((c) => c.room),
    [
      'SALA',
      `SALA${ZONE_SCOPE_SEPARATOR}norte`,
      `SALA${ZONE_SCOPE_SEPARATOR}norte`,
      `SALA${ZONE_SCOPE_SEPARATOR}norte`
    ]
  );
  // MAKE_MASTER declara el maestro DEL CANAL, no de la sala: si dijera
  // `room: 'SALA'` el servidor guardaría el maestro bajo otra clave.
  assert.equal(client.roomCalls[3].data.room, `SALA${ZONE_SCOPE_SEPARATOR}norte`);
});

test('emitir sin zona y emitir en zona son destinos distintos', () => {
  const client = fakeClient();
  emitRoomEvent(client, 'TOPIC', {}, 'SALA');
  emitRoomEvent(client, 'TOPIC', {}, 'SALA', 'norte');
  assert.notEqual(client.roomCalls[0].room, client.roomCalls[1].room);
});
