import type { EventEmitter } from 'node:events';
import type { Socket } from 'socket.io-client';

export interface HandshakeAuth {
  token?: string;
  room?: string;
  user?: string;
  [key: string]: unknown;
}

export interface SocketClientOptions {
  autoConnect?: boolean;
  auth?: HandshakeAuth | (() => HandshakeAuth | Promise<HandshakeAuth>);
  extraHeaders?: Record<string, string>;
  transports?: Array<'websocket' | 'polling'>;
  path?: string;
  withCredentials?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

export declare class SocketClient extends EventEmitter {
  name: string;
  url: string;
  namespace: string;
  io: Socket;
  options: SocketClientOptions;

  constructor(
    name?: string,
    url?: string,
    namespace?: string,
    optsOrAutoConnect?: boolean | SocketClientOptions
  );

  room(event: string, data?: unknown, room?: string): void;
}
