/**
 * Session transport — scriptorium room master (E6 cutover; legacy /session removed).
 */

import { INBOUND_SCHEMAS } from '@zeus/session-protocol';
import { resolveValidateMode } from '@zeus/presets-sdk/env';
import {
  createClient,
  connectAndJoin,
  makeMaster,
  setState,
  onState,
  loadScriptoriumConfig,
  resolveSessionRoom
} from '@zeus/rooms';

export function resolveSessionTransport(_env = process.env) {
  return 'room';
}

/**
 * Wrap an inbound room-mode handler with Zod validation.
 *
 * @param {string} event
 * @param {(payload: unknown, ctx: object) => unknown} handler
 * @param {object} [options]
 * @param {'off'|'warn'|'enforce'} [options.mode]
 * @param {(err: {event: string, code: string, message: string, issues: unknown}) => void} [options.emitError]
 * @param {(...args: unknown[]) => void} [options.log]
 * @returns {(payload: unknown, ctx: object) => unknown}
 */
export function wrapInboundHandler(event, handler, options = {}) {
  const {
    mode = resolveValidateMode('socket'),
    emitError = () => {},
    log = (...args) => console.warn(...args)
  } = options;

  const schema = INBOUND_SCHEMAS.get(event);
  if (!schema || mode === 'off') return handler;

  return (payload, ctx) => {
    const parsed = schema.safeParse(payload ?? {});
    if (!parsed.success) {
      const issues = parsed.error.issues;
      log(
        `[session-transport] invalid inbound payload (${event}):`,
        JSON.stringify(issues)
      );
      try {
        emitError({ event, code: 'INVALID_PAYLOAD', message: 'Invalid payload', issues });
      } catch {
        /* best effort */
      }
      return undefined;
    }
    return handler(parsed.data, ctx);
  };
}

/**
 * Wire session inbound handlers on the room master socket.
 * Handles both D0 ROOM_MESSAGE envelopes (bridge downstream) and
 * unwrapped broadcasts from local scriptorium.
 *
 * @param {import('@alephscript/mcp-core-sdk/client').SocketClient} client
 * @param {object} options
 * @param {string} options.room
 * @param {Record<string, (payload: unknown, ctx: object) => unknown>} options.handlers
 * @param {object} [options.validate]
 * @returns {() => void} unsubscribe
 */
export function wireRoomInboundHandlers(client, options) {
  const { room, handlers, validate = {} } = options;
  const wrapped = new Map();

  for (const [event, handler] of Object.entries(handlers)) {
    wrapped.set(event, wrapInboundHandler(event, handler, validate));
  }

  const dispatch = (event, payload, ctx) => {
    const h = wrapped.get(event);
    if (h) h(payload, ctx);
  };

  const ctx = () => ({ socket: client.io, ack: () => {} });
  const offFns = [];

  const onRoomMessage = ({ event, room: msgRoom, data }) => {
    if (msgRoom && msgRoom !== room) return;
    if (!event) return;
    dispatch(event, data, ctx());
  };
  client.io.on('ROOM_MESSAGE', onRoomMessage);
  offFns.push(() => client.io.off('ROOM_MESSAGE', onRoomMessage));

  for (const event of wrapped.keys()) {
    const onDirect = (payload) => dispatch(event, payload, ctx());
    client.io.on(event, onDirect);
    offFns.push(() => client.io.off(event, onDirect));
  }

  return () => {
    for (const off of offFns) off();
  };
}

/**
 * @param {object} deps
 * @param {() => object} deps.getSnapshot
 * @param {object} deps.handlers
 * @param {Function} deps.onConnection
 * @param {string} [deps.sessionId]
 */
export async function createSessionTransport(deps) {
  const { getSnapshot, handlers, onConnection, sessionId = 'default' } = deps;

  const cfg = loadScriptoriumConfig();
  const room = resolveSessionRoom(sessionId);
  const user = `player-ui-${sessionId}`;
  const client = createClient(user, { room, url: cfg.url });
  await connectAndJoin(client, user, { room, type: 'PlayerUI', features: ['session-master'] });
  makeMaster(client, room, { features: ['session'] });

  const snapshotSeq = { n: 0 };
  const broadcastState = () => {
    snapshotSeq.n += 1;
    setState(client, room, { type: 'session:state', snapshot: getSnapshot(), seq: snapshotSeq.n });
  };

  const offState = onState(client, (data) => {
    if (data?.type === 'session:state' && data.snapshot) {
      client.io.emit('session:state', data.snapshot);
    }
  });

  const validateMode = resolveValidateMode('socket');
  const emitSessionError = (err) => {
    try {
      client.io.emit('session:error', err);
    } catch {
      /* best effort */
    }
  };

  const offInbound = wireRoomInboundHandlers(client, {
    room,
    handlers,
    validate: {
      mode: validateMode,
      emitError: emitSessionError
    }
  });

  client.io.on('connect', () => {
    client.io.emit('CLIENT_REGISTER', {
      usuario: user,
      sesion: `${user}-${Date.now()}`,
      type: 'PlayerUI',
      features: ['session-master']
    });
    client.io.emit('CLIENT_SUSCRIBE', { room });
    makeMaster(client, room, { features: ['session'] });
    broadcastState();
  });

  const heartbeat = setInterval(() => broadcastState(), 1000);

  onConnection?.(client.io, {
    unicast: (_s, event, payload) => client.io.emit(event, payload),
    broadcast: (event, payload) => client.io.emit(event, payload)
  });

  broadcastState();

  return {
    mode: 'room',
    io: client.io,
    roomClient: client,
    room,
    broadcastState,
    emitDeckResolved: (payload) => client.io.emit('deck:resolved', payload),
    emitCatalog: (socket, servers) => socket.emit('catalog:servers', servers),
    reaffirmState: () => broadcastState(),
    close: async () => {
      clearInterval(heartbeat);
      offInbound();
      offState();
      client.io.close();
    }
  };
}
