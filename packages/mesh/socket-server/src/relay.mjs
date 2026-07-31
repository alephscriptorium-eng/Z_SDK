import { SocketClient } from '@zeus/socket-core/client';
import { NAMESPACE, RELAY_DOWNSTREAM_TOP, RELAY_UPSTREAM } from './config.mjs';

/**
 * Traza de descartes del relay (WP-U192).
 *
 * Todo evento que el relay NO propaga deja registro con motivo:
 * dirección (upstream|downstream), tipo de evento, motivo del corte y
 * contador agregado por clave (dirección|evento|motivo) para no inundar.
 * Es SOLO observación: la política de propagación la definen únicamente
 * RELAY_UPSTREAM / RELAY_DOWNSTREAM_TOP y la supresión de MAKE_MASTER,
 * exactamente igual que antes de esta traza.
 */
const CONSOLE_EVERY = 100;

/**
 * @typedef {object} RelayDiscardEntry
 * @property {'upstream' | 'downstream'} direction
 * @property {string} event
 * @property {string} reason
 * @property {number} count
 * @property {string} firstAt
 * @property {string} lastAt
 */

/** @type {Map<string, RelayDiscardEntry>} */
const discardLedger = new Map();

/** Instantánea de los registros agregados de descarte. */
export function relayDiscardLedger() {
  return [...discardLedger.values()].map((entry) => ({ ...entry }));
}

/** Vacía los registros de descarte (aislamiento entre tests). */
export function resetRelayDiscardLedger() {
  discardLedger.clear();
}

/**
 * @param {'upstream' | 'downstream'} direction
 * @param {string} event
 * @param {string} reason
 */
function recordDiscard(direction, event, reason) {
  const key = `${direction}|${event}|${reason}`;
  const now = new Date().toISOString();
  const entry = discardLedger.get(key);
  if (entry) {
    entry.count += 1;
    entry.lastAt = now;
    if (entry.count % CONSOLE_EVERY === 0) {
      console.warn(
        `[relay:discard] ${direction} event=${event} reason=${reason} count=${entry.count}`
      );
    }
    return;
  }
  discardLedger.set(key, {
    direction,
    event,
    reason,
    count: 1,
    firstAt: now,
    lastAt: now
  });
  console.warn(`[relay:discard] ${direction} event=${event} reason=${reason} count=1`);
}

/** Unwrap ROOM_MESSAGE broadcasts for downstream socket.io clients. */
export function emitDownstream(localNs, payload) {
  if (!payload || typeof payload !== 'object') {
    recordDiscard('downstream', '(malformado)', 'sobre-no-objeto');
    return;
  }
  localNs.emit('ROOM_MESSAGE', payload);

  const inner = payload.event;
  const data = payload.data;
  if (!inner) {
    // El sobre sí se reemitió como ROOM_MESSAGE; el corte es el desempaquetado.
    recordDiscard('downstream', '(sin-nombre)', 'sobre-sin-evento-interno');
    return;
  }

  if (inner === 'SET_STATE' && data) {
    localNs.emit('SET_STATE', data);
    return;
  }

  if (inner === 'MAKE_MASTER') {
    recordDiscard('downstream', inner, 'make-master-suprimido');
    return;
  }

  localNs.emit(inner, data);
}

/**
 * @param {import('socket.io').Namespace} localNs
 * @param {{ bridgeUrl: string, secret: string }} options
 * @returns {import('@zeus/socket-core/client').SocketClient}
 */
export function attachRemoteBridge(localNs, { bridgeUrl, secret }) {
  const bridgeClient = new SocketClient('scriptorium-bridge', bridgeUrl, `/${NAMESPACE}`, {
    auth: { token: secret, room: 'PUBLIC_ROOM', user: 'scriptorium-bridge' },
    autoConnect: false
  });
  bridgeClient.io.connect();

  localNs.on('connection', (socket) => {
    for (const ev of RELAY_UPSTREAM) {
      socket.on(ev, (data) => bridgeClient.io.emit(ev, data));
    }
    socket.onAny((event) => {
      // Observación pura: lo que el cliente local emite y el relay no
      // reenvía al puente queda trazado como corte de subida.
      if (RELAY_UPSTREAM.includes(event)) return;
      recordDiscard('upstream', event, 'fuera-del-conjunto-de-subida');
    });
  });

  bridgeClient.io.on('ROOM_MESSAGE', (data) => emitDownstream(localNs, data));
  bridgeClient.io.onAny((event, ...args) => {
    if (RELAY_UPSTREAM.includes(event)) {
      // ROOM_MESSAGE no es descarte: su handler dedicado (arriba) lo
      // desempaqueta y reemite hacia abajo.
      if (event !== 'ROOM_MESSAGE') {
        recordDiscard('downstream', event, 'eco-de-nombre-de-subida');
      }
      return;
    }
    if (RELAY_DOWNSTREAM_TOP.has(event)) {
      localNs.emit(event, args[0]);
      return;
    }
    recordDiscard('downstream', event, 'fuera-de-allowlist-de-bajada');
  });

  return bridgeClient;
}
