/**
 * View kit · suscripción resiliente a canales de room (pura — testeable en node).
 *
 * Según la generación del socket-server, un evento de canal puede llegar al
 * navegador de dos maneras:
 *   1. DESNUDO: `io.to(room).emit(event, data)` — servers actuales, solo para
 *      sockets unidos a la room emisora.
 *   2. ENSOBRADO: relay global `ROOM_MESSAGE` con `{event, room, data}`
 *      (a veces envuelto en array) — servers antiguos, sin filtro de room.
 *
 * onChannelEvent escucha AMBOS y dedupea solapes, de modo que una vista
 * sigue funcionando hable con el server que hable (gate G-ARG.2: las vistas
 * consumen arg:state exclusivamente por aquí).
 */

const SEEN_LIMIT = 64;

function signatureOf(event, payload) {
  if (!payload || typeof payload !== 'object' || payload.ts == null) return null;
  return `${event}:${payload.ts}:${payload.tick ?? ''}:${payload.from ?? ''}`;
}

/**
 * @param {{onRoomEvent: (event: string, cb: Function) => Function}} room cliente de room del kit
 * @param {string} event nombre del evento de canal (p.ej. arg:state)
 * @param {(payload: object, meta: {via: 'direct'|'envelope', room: string|null}) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onChannelEvent(room, event, cb) {
  const seen = [];

  function accept(payload) {
    const sig = signatureOf(event, payload);
    if (!sig) return true; // sin identidad → no se puede dedupear, pasa
    if (seen.includes(sig)) return false;
    seen.push(sig);
    if (seen.length > SEEN_LIMIT) seen.shift();
    return true;
  }

  const offDirect = room.onRoomEvent(event, (payload) => {
    if (accept(payload)) cb(payload, { via: 'direct', room: null });
  });

  const offEnvelope = room.onRoomEvent('ROOM_MESSAGE', (raw) => {
    const envelopes = Array.isArray(raw) ? raw : [raw];
    for (const envelope of envelopes) {
      if (!envelope || typeof envelope !== 'object' || envelope.event !== event) continue;
      const data = envelope.data ?? envelope;
      if (accept(data)) cb(data, { via: 'envelope', room: envelope.room ?? null });
    }
  });

  return () => {
    offDirect?.();
    offEnvelope?.();
  };
}
