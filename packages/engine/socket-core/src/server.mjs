/**
 * @zeus/socket-core/server — SocketServer surface used by @zeus/socket-server.
 * No dependency on @alephscript/mcp-core-sdk.
 */

import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

/**
 * @typedef {object} SocketServerCorsOptions
 * @property {string[] | '*'} [origins]
 * @property {boolean} [credentials]
 */

/**
 * @typedef {(namespace: string, auth: Record<string, unknown>) =>
 *   Promise<{ ok: boolean, reason?: string, userId?: string, rooms?: string[] } | undefined>
 *   | { ok: boolean, reason?: string, userId?: string, rooms?: string[] } | undefined} AuthValidator
 */

/**
 * @typedef {object} SocketServerOptions
 * @property {boolean} [activateInstrumens]
 * @property {boolean} [autoBroadcast]
 * @property {SocketServerCorsOptions} [cors]
 * @property {AuthValidator} [authValidator]
 */

/**
 * @param {boolean | SocketServerOptions | undefined} value
 * @returns {value is SocketServerOptions}
 */
function isSocketServerOptions(value) {
  return typeof value === 'object' && value !== null;
}

/**
 * @param {SocketServerCorsOptions | undefined} options
 */
function createSocketIoCorsOptions(options) {
  const credentials = options?.credentials ?? true;
  const origins = options?.origins ?? '*';

  if (origins === '*') {
    return {
      origin: (_origin, callback) => callback(null, true),
      credentials
    };
  }

  const allowedOrigins = new Set(
    origins.map((origin) => origin.trim()).filter(Boolean)
  );

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`origin not allowed: ${origin}`), false);
    },
    credentials
  };
}

export class SocketServer {
  /**
   * @param {string} [name]
   * @param {import('node:http').Server | import('node:https').Server} server
   * @param {boolean | SocketServerOptions} [activateInstrumensOrOptions]
   * @param {boolean} [autoBroadcast]
   */
  constructor(
    name = 'ZeusSrv',
    server,
    activateInstrumensOrOptions = true,
    autoBroadcast = true
  ) {
    const options = isSocketServerOptions(activateInstrumensOrOptions)
      ? activateInstrumensOrOptions
      : {
          activateInstrumens: activateInstrumensOrOptions,
          autoBroadcast
        };

    this.name = name;
    /** @type {Map<string, import('socket.io').Namespace>} */
    this.namespaces = new Map();
    /** @type {Map<string, object>} */
    this.sockets = new Map();
    /** @type {Map<string, string>} */
    this.rooms = new Map();
    /** @type {Map<string, string[]>} */
    this.roomsSockets = new Map();

    this.autoBroadcast = options.autoBroadcast ?? true;
    this.authValidator = options.authValidator;
    this.cors = options.cors;

    /** @type {import('socket.io').Server} */
    this.io = new Server(server, {
      cors: createSocketIoCorsOptions(this.cors)
    });

    if (options.activateInstrumens !== false && !this.authValidator) {
      instrument(this.io, { auth: false });
    }
  }

  /**
   * @param {string} namespace
   * @returns {string}
   */
  getNamespacePath(namespace) {
    return namespace ? `/${namespace.replace(/^\//, '')}` : '/';
  }

  /**
   * @param {import('socket.io').Socket} socket
   * @returns {Record<string, unknown>}
   */
  getHandshakeAuth(socket) {
    const auth = socket.handshake.auth;
    if (auth && typeof auth === 'object' && !Array.isArray(auth)) {
      return /** @type {Record<string, unknown>} */ (auth);
    }
    return {};
  }

  /**
   * @param {import('socket.io').Socket} socket
   */
  getAuthDecision(socket) {
    return /** @type {{ ok?: boolean, rooms?: string[], userId?: string } | undefined} */ (
      socket.data?.auth
    );
  }

  /**
   * @param {import('socket.io').Socket} socket
   * @param {string} reason
   * @param {string} [room]
   * @param {string} [action]
   */
  emitAuthError(socket, reason, room, action) {
    socket.emit('auth_error', {
      reason,
      room,
      action,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   * @param {string | undefined} room
   * @param {string} action
   */
  ensureRoomAllowed(namespace, socket, room, action) {
    if (!this.authValidator) return true;

    const decision = this.getAuthDecision(socket);
    if (!decision?.rooms || decision.rooms.length === 0) return true;

    if (!room) {
      this.emitAuthError(socket, 'room required', room, action);
      return false;
    }

    if (decision.rooms.includes(room)) return true;

    this.emitAuthError(socket, `room not allowed: ${room}`, room, action);
    return false;
  }

  /**
   * Create a namespace and attach room protocol handlers when autoBroadcast.
   * @param {string} namespace
   */
  createNamespace(namespace) {
    const path = this.getNamespacePath(namespace);
    const nsp = this.io.of(path);

    if (this.authValidator) {
      nsp.use(async (clientSocket, next) => {
        try {
          const decision = await this.authValidator?.(
            namespace,
            this.getHandshakeAuth(clientSocket)
          );
          if (!decision?.ok) {
            next(new Error(decision?.reason || 'unauthorized'));
            return;
          }
          clientSocket.data.auth = decision;
          next();
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          next(new Error(reason || 'unauthorized'));
        }
      });
    }

    nsp.on('connection', (socket) => this.onConnection(namespace, socket));
    this.namespaces.set(namespace.replace(/^\//, ''), nsp);
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   */
  onConnection(namespace, socket) {
    socket.on('disconnect', (reason) =>
      this.onDisconnect(namespace, socket, reason)
    );

    if (!this.autoBroadcast) return;

    socket.on('CLIENT_REGISTER', (data) =>
      this.onClientRegister(namespace, socket, data)
    );
    socket.on('CLIENT_SUSCRIBE', (data) =>
      this.onClientSuscribe(namespace, socket, data)
    );
    socket.on('ROOM_MESSAGE', (data) =>
      this.onRoomMessage(namespace, socket, data)
    );
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   * @param {unknown} _reason
   */
  onDisconnect(namespace, socket, _reason) {
    const roomsids = [];
    for (const [roomId, masterId] of this.rooms.entries()) {
      if (masterId === socket.id) roomsids.push(roomId);
    }
    for (const roomId of roomsids) {
      this.roomsSockets.delete(roomId);
      this.rooms.delete(roomId);
    }
    this.sockets.delete(socket.id);
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   * @param {object} args
   */
  onClientRegister(namespace, socket, args) {
    const authDecision = this.getAuthDecision(socket);
    const payload = { ...args };
    if (!payload.usuario && authDecision?.userId) {
      payload.usuario = authDecision.userId;
    }
    payload.name = `${payload.usuario ?? ''}${payload.sesion ?? ''}`;
    this.sockets.set(socket.id, payload);
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   * @param {{ room?: string, out?: boolean }} args
   */
  onClientSuscribe(namespace, socket, args) {
    if (!args.out && !this.ensureRoomAllowed(namespace, socket, args.room, 'subscribe')) {
      return;
    }
    if (!args.room) return;

    if (args.out) {
      socket.leave(args.room);
      this.purgeSocketFromRoom(socket.id, args.room);
      return;
    }

    socket.join(args.room);
    const sockets = this.roomsSockets.get(args.room) || [];
    sockets.push(socket.id);
    this.roomsSockets.set(args.room, sockets);
  }

  /**
   * @param {string} socketId
   * @param {string} roomId
   */
  purgeSocketFromRoom(socketId, roomId) {
    const sockets = this.roomsSockets.get(roomId) || [];
    const i = sockets.findIndex((s) => s === socketId);
    if (i > -1) {
      sockets.splice(i, 1);
      this.roomsSockets.set(roomId, sockets);
    }
  }

  /**
   * @param {string} namespace
   * @param {import('socket.io').Socket} socket
   * @param {{ room?: string, event?: string, data?: unknown, requester?: string }} args
   */
  onRoomMessage(namespace, socket, args) {
    if (!args?.room) return;
    if (!this.ensureRoomAllowed(namespace, socket, args.room, 'room_message')) {
      return;
    }

    const meta = { ...args, namespace, socket };

    if (args.event === 'GET_SERVER_STATE' || args.event === 'SET_SERVER_STATE') {
      return;
    }

    const isGetter = args.event?.substring(0, 4) === 'GET_';
    if (isGetter) {
      this.forwardRequestToMaster(meta);
      return;
    }

    const isSetter = args.event?.substring(0, 4) === 'SET_';
    if (isSetter) {
      this.forwardAnswerToRequester(meta);
      return;
    }

    if (args.event === 'MAKE_MASTER') {
      this.declareMasterOfARoom(meta);
      return;
    }

    this.broadcast(meta);
  }

  /**
   * @param {{ namespace: string, room: string, socket: import('socket.io').Socket, data?: unknown }} args
   */
  declareMasterOfARoom(args) {
    this.rooms.set(args.room, args.socket.id);
  }

  /**
   * @param {{ room: string, event: string, socket: import('socket.io').Socket, data?: unknown }} args
   */
  forwardRequestToMaster(args) {
    const master = this.rooms.get(args.room);
    if (!master) return;
    const requesterData = {
      ...args,
      requester: args.socket.id
    };
    delete requesterData.socket;
    args.socket.to(master).emit(args.event, requesterData);
  }

  /**
   * @param {{ room: string, event: string, socket: import('socket.io').Socket, data?: unknown, requester?: string }} args
   */
  forwardAnswerToRequester(args) {
    const requesterData = {
      .../** @type {object} */ (args.data ?? {}),
      sender: args.socket.id
    };
    args.socket.to(args.room).emit(args.event, requesterData);
  }

  /**
   * @param {{ namespace: string, room: string, event: string, data?: unknown }} args
   */
  broadcast(args) {
    const key = args.namespace.replace(/^\//, '');
    this.namespaces.get(key)?.to(args.room).emit(args.event, args.data);
  }
}
