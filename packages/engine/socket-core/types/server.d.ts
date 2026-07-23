import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import type { Namespace, Server, Socket } from 'socket.io';

export type ServerInstance = HttpServer | HttpsServer;

export interface SocketServerCorsOptions {
  origins?: string[] | '*';
  credentials?: boolean;
}

export interface AuthDecision {
  ok: boolean;
  reason?: string;
  userId?: string;
  rooms?: string[];
}

export type AuthValidator = (
  namespace: string,
  auth: Record<string, unknown>
) => Promise<AuthDecision | undefined> | AuthDecision | undefined;

export interface SocketServerOptions {
  activateInstrumens?: boolean;
  autoBroadcast?: boolean;
  cors?: SocketServerCorsOptions;
  authValidator?: AuthValidator;
}

export declare class SocketServer {
  name: string;
  namespaces: Map<string, Namespace>;
  sockets: Map<string, object>;
  rooms: Map<string, string>;
  roomsSockets: Map<string, string[]>;
  io: Server;
  autoBroadcast: boolean;
  authValidator?: AuthValidator;
  cors?: SocketServerCorsOptions;

  constructor(
    name: string | undefined,
    server: ServerInstance,
    activateInstrumensOrOptions?: boolean | SocketServerOptions,
    autoBroadcast?: boolean
  );

  createNamespace(namespace: string): void;
  onConnection(namespace: string, socket: Socket): void;
  onDisconnect(namespace: string, socket: Socket, reason: unknown): void;
  onClientRegister(namespace: string, socket: Socket, args: object): void;
  onClientSuscribe(
    namespace: string,
    socket: Socket,
    args: { room?: string; out?: boolean }
  ): void;
  onRoomMessage(
    namespace: string,
    socket: Socket,
    args: { room?: string; event?: string; data?: unknown; requester?: string }
  ): void;
}
