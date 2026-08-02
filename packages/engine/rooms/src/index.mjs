/**
 * @zeus/rooms — Scriptorium rooms client (E1).
 * Wraps @zeus/socket-core SocketClient with ZEUS_SCRIPTORIUM_* env.
 */

import { once } from 'node:events';
import { SocketClient } from '@zeus/socket-core/client';
import {
  loadScriptoriumConfig,
  config,
  resolveSessionRoom,
  resolveScriptoriumSecret,
  DEFAULT_SCRIPTORIUM_SECRET
} from './config.mjs';

export {
  loadScriptoriumConfig,
  config,
  resolveSessionRoom,
  resolveScriptoriumSecret,
  DEFAULT_SCRIPTORIUM_SECRET
};

/* ─────────────────────────────────────────────────────────────────────────
 * Zonas como ÁMBITO (WP-U196)
 *
 * Antes: `zones` viajaba como interés opaco dentro de CLIENT_SUSCRIBE y el
 * servidor lo ignoraba (`socket.join(args.room)` y nada más). Dos zonas del
 * mismo topic eran UNA conversación con un filtro cosmético en cliente.
 *
 * Ahora: una zona es un **sufijo de canal**. `sala` + zona `norte` es el
 * canal `sala::z:norte`, una sala de socket.io distinta. El aislamiento lo
 * hace el servidor al repartir, no el cliente al descartar. Ningún cambio en
 * `@zeus/socket-core`: se usa el mecanismo de salas que ya existía.
 *
 * Reglas duras:
 * - La AUSENCIA de zona nunca significa «todas». Significa «el ámbito sin
 *   zona»: la sala desnuda. Es el ámbito más pequeño, no el más grande.
 * - No hay comodín. `'*'` se rechaza en voz alta en vez de convertirse en
 *   un canal literal `sala::z:*` que aislaría en silencio a quien creía
 *   estar pidiendo todo (así se lee `'*'` en @zeus/game-engine).
 * - Un id de zona no puede contener el separador: sería fugarse a otro
 *   ámbito por construcción de nombre.
 * ───────────────────────────────────────────────────────────────────────── */

/** Separador de ámbito de zona dentro del nombre de canal. */
export const ZONE_SCOPE_SEPARATOR = '::z:';

/**
 * Valida un nombre de sala.
 *
 * El separador está prohibido **en los dos lados**, no sólo en la zona. Un
 * guardia de un solo lado no hace disjuntos los espacios de nombres: con
 * `room = 'SALA::z:norte'` y `zones` omitido se cae en el canal de la zona
 * `norte` sin haber pedido zona ninguna, y al revés. Y `room` es entrada
 * externa (`ZEUS_SCRIPTORIUM_ROOM`, `?room=`), no una constante del código.
 *
 * @param {unknown} room
 * @returns {string}
 */
function assertRoom(room) {
  if (typeof room !== 'string' || !room.trim()) {
    throw new TypeError(
      `[rooms] room debe ser una cadena no vacía; recibido ${JSON.stringify(room)}`
    );
  }
  if (room.includes(ZONE_SCOPE_SEPARATOR)) {
    throw new TypeError(
      `[rooms] el nombre de sala no puede contener "${ZONE_SCOPE_SEPARATOR}": ` +
        `${JSON.stringify(room)}. Ese sufijo es el ámbito de zona; una sala que ` +
        'lo lleve se colaría en el canal de una zona sin declararla.'
    );
  }
  return room;
}

/**
 * Valida un id de zona. Falla cerrado: es preferible una excepción a un
 * ámbito silencioso y equivocado.
 * @param {unknown} zone
 * @returns {string}
 */
function assertZoneId(zone) {
  if (typeof zone !== 'string') {
    throw new TypeError(
      `[rooms] el id de zona debe ser una cadena; recibido ${typeof zone} (${JSON.stringify(zone)})`
    );
  }
  const id = zone.trim();
  if (!id) {
    throw new TypeError('[rooms] el id de zona no puede ser vacío');
  }
  if (id === '*') {
    throw new TypeError(
      "[rooms] '*' no es una zona: aquí no hay comodín. Para el ámbito sin " +
        'zona omite `zones`; para varias zonas enumera sus ids.'
    );
  }
  if (id.includes(ZONE_SCOPE_SEPARATOR)) {
    throw new TypeError(
      `[rooms] el id de zona no puede contener "${ZONE_SCOPE_SEPARATOR}": ${JSON.stringify(zone)}`
    );
  }
  return id;
}

/**
 * Canal físico de una zona dentro de una sala.
 *
 * SENSIBLE A MAYÚSCULAS, decidido y declarado: `'Norte'` y `'norte'` son
 * **dos zonas distintas**, igual que son dos salas distintas para socket.io.
 * El id de zona es un token opaco y no se normaliza. Plegar mayúsculas
 * uniría dos ámbitos que el llamante declaró separados, y unir ámbitos es
 * ensanchar — la única dirección que este WP no se permite. Lo único que se
 * recorta es el espacio en blanco de los bordes (`' norte '` → `'norte'`),
 * porque ahí no hay ambigüedad de intención.
 *
 * @param {string} room
 * @param {string} zone
 * @returns {string}
 */
export function zoneChannel(room, zone) {
  return `${assertRoom(room)}${ZONE_SCOPE_SEPARATOR}${assertZoneId(zone)}`;
}

/**
 * Normaliza la opción `zones` a una lista de ids, sin duplicados y en orden
 * de aparición. Las entradas en blanco se descartan: una entrada vacía nunca
 * puede ENSANCHAR el ámbito.
 *
 * @param {string | string[] | Set<string> | null | undefined} zones
 * @returns {string[]}
 */
export function normalizeZones(zones) {
  if (zones == null) return [];
  /** @type {unknown[]} */
  let list;
  if (typeof zones === 'string') list = [zones];
  else if (Array.isArray(zones)) list = zones;
  else if (zones instanceof Set) list = [...zones];
  else {
    throw new TypeError(
      `[rooms] zones debe ser cadena, lista o Set; recibido ${JSON.stringify(zones)}`
    );
  }

  /** @type {string[]} */
  const out = [];
  for (const raw of list) {
    if (typeof raw === 'string' && raw.trim() === '') continue; // blanco: se cae
    const id = assertZoneId(raw);
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/**
 * Resuelve los canales de un (room, zones).
 *
 * Sin zonas → `[room]`: la sala desnuda, el ámbito sin zona.
 * Con zonas → un canal por zona; la sala desnuda **no** se incluye, porque
 * estar en un ámbito es estar en él y no en el de al lado.
 *
 * @param {string} room
 * @param {string | string[] | Set<string> | null | undefined} zones
 * @returns {{ zones: string[], channels: string[] }}
 */
export function resolveZoneChannels(room, zones) {
  assertRoom(room);
  const ids = normalizeZones(zones);
  return ids.length === 0
    ? { zones: [], channels: [room] }
    : { zones: ids, channels: ids.map((z) => zoneChannel(room, z)) };
}

/**
 * @param {string} [user]
 * @param {Partial<ReturnType<typeof loadScriptoriumConfig>>} [overrides]
 */
export function createClient(user = config.user, overrides = {}) {
  const cfg = { ...config, ...overrides };
  const client = new SocketClient(user, cfg.url, cfg.namespace, {
    auth: { token: cfg.secret, room: cfg.room, user },
    autoConnect: false,
    reconnection: cfg.reconnection ?? false,
    timeout: 5000
  });
  return client;
}

/**
 * @param {import('@zeus/socket-core/client').SocketClient} client
 * @param {string} user
 * @param {{
 *   type?: string,
 *   features?: string[],
 *   room?: string,
 *   connectTimeoutMs?: number,
 *   zones?: string | string[] | Set<string>,
 *   peerCard?: object,
 * }} [options]
 * `zones` — ÁMBITO, no filtro (U196). Cada zona se suscribe a su propio
 * canal `room::z:<zona>`; el aislamiento lo reparte el servidor. Omitirlo
 * NO es «todas las zonas»: es la sala desnuda, el ámbito sin zona.
 * `peerCard` — optional traveling peer-card (same identity lane as puerta);
 * forwarded on CLIENT_REGISTER when present.
 */
export async function connectAndJoin(client, user, options = {}) {
  const room = options.room ?? config.room;
  const connectTimeoutMs = options.connectTimeoutMs ?? 10_000;
  // Se resuelve ANTES de conectar: un id de zona inválido debe fallar sin
  // haber abierto socket ni haber dejado una suscripción a medias.
  const { zones, channels } = resolveZoneChannels(room, options.zones);

  const join = async () => {
    client.io.connect();
    await once(client.io, 'connect');

    const registerPayload = {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type: options.type ?? 'ZeusClient',
      features: options.features ?? ['zeus-rooms']
    };
    if (options.peerCard != null) {
      registerPayload.peerCard = options.peerCard;
    }
    client.io.emit('CLIENT_REGISTER', registerPayload);

    // Un CLIENT_SUSCRIBE por canal. `zone` viaja como descripción de lo que
    // el canal ES, no como interés que el servidor deba honrar: si el
    // servidor lo ignorase, el aislamiento seguiría en pie.
    channels.forEach((channel, i) => {
      client.io.emit(
        'CLIENT_SUSCRIBE',
        zones.length === 0 ? { room: channel } : { room: channel, zone: zones[i] }
      );
    });
    return { room, socketId: client.io.id, zones, channels };
  };

  let timer;
  try {
    return await Promise.race([
      join(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`[${user}] connect timeout after ${connectTimeoutMs}ms`)),
          connectTimeoutMs
        );
      })
    ]);
  } catch (err) {
    client.io.disconnect();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Declare this socket as master of a room (MAKE_MASTER).
 * Kept for authorities / demos that still use master-room protocol.
 * Con `zone`, el maestro lo es del ámbito de esa zona, no de la sala.
 * @param {import('@zeus/socket-core/client').SocketClient} client
 * @param {string} room
 * @param {Record<string, unknown>} [data]
 * @param {string} [zone]
 */
export function makeMaster(client, room, data = {}, zone) {
  const channel = zone == null ? assertRoom(room) : zoneChannel(room, zone);
  client.room('MAKE_MASTER', { ...data, room: channel }, channel);
}

/**
 * Broadcast SET_STATE to room members (master-room protocol).
 * @param {import('@zeus/socket-core/client').SocketClient} client
 * @param {string} room
 * @param {unknown} data
 * @param {string} [zone]
 */
export function setState(client, room, data, zone) {
  client.room(
    'SET_STATE',
    data,
    zone == null ? assertRoom(room) : zoneChannel(room, zone)
  );
}

/**
 * Subscribe to SET_STATE events for a room.
 */
export function onState(client, cb) {
  client.io.on('SET_STATE', cb);
  return () => client.io.off('SET_STATE', cb);
}

/**
 * Emit a channel event via ROOM_MESSAGE.
 *
 * Con `zone`, la emisión entra EN esa zona: el servidor la reparte sólo a
 * quien esté en ese ámbito. Sin `zone`, entra en la sala desnuda y no la ve
 * ningún suscriptor de zona. No hay forma de emitir «a todas las zonas» de
 * una vez: alcanzar N zonas cuesta N emisiones, y eso es el precio declarado.
 *
 * ASIMETRÍA DECLARADA con la suscripción: aquí «ausencia» es sólo `null` /
 * `undefined`. `zone: ''` **lanza**, mientras que `zones: ''` al suscribir
 * cae a la sala desnuda. Es deliberado y no simétrico a propósito: al
 * suscribir, tratar el blanco como ausencia da el ámbito MÁS PEQUEÑO (no
 * recibes de más); al emitir, tratarlo como ausencia mandaría el mensaje a
 * un destino que el llamante no pidió y que ningún suscriptor de zona oye.
 * Un `cfg.zona ?? ''` se suscribe bien y revienta al emitir — revienta a
 * propósito, en vez de publicar en el sitio equivocado en silencio.
 *
 * @param {import('@zeus/socket-core/client').SocketClient} client
 * @param {string} event
 * @param {unknown} data
 * @param {string} [room]
 * @param {string} [zone] `null`/`undefined` = sala desnuda; `''` lanza
 */
export function emitRoomEvent(client, event, data, room = config.room, zone) {
  client.room(event, data, zone == null ? assertRoom(room) : zoneChannel(room, zone));
}

/**
 * Listen for arbitrary room-broadcast events.
 */
export function onRoomEvent(client, event, cb) {
  client.io.on(event, cb);
  return () => client.io.off(event, cb);
}

/**
 * Wait for a socket.io event (e2e / wire canary).
 * Absorbed from demolished session-protocol client-core.
 */
export function waitForSocketEvent(socket, event, predicate = null, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for ${event}`)),
      timeoutMs
    );
    const handler = (payload) => {
      if (predicate && !predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });
}
