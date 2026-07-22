/**
 * @zeus/rooms — TypeScript declarations for the Node rooms client (WP-U54).
 * Handshake: ZEUS_SCRIPTORIUM_URL + auth { token, room, user }.
 */

export interface ScriptoriumConfig {
  url: string;
  namespace: string;
  room: string;
  user: string;
  secret: string;
  bridge: string;
  bridgeUrl: string;
  reconnection?: boolean;
}

export declare const DEFAULT_SCRIPTORIUM_SECRET: string;

export declare function resolveScriptoriumSecret(
  env?: Record<string, string | undefined>
): string;

export declare function loadScriptoriumConfig(
  env?: Record<string, string | undefined>
): ScriptoriumConfig;

export declare const config: ScriptoriumConfig;

export declare function resolveSessionRoom(
  sessionId?: string,
  env?: Record<string, string | undefined>
): string;

/** Minimal socket surface used by connectAndJoin / emit helpers. */
export interface RoomsSocket {
  connect(): void;
  disconnect(): void;
  id?: string;
  on(event: string, cb: (...args: unknown[]) => void): unknown;
  off(event: string, cb: (...args: unknown[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
}

export interface RoomsClient {
  io: RoomsSocket;
  room(event: string, data: unknown, room?: string): unknown;
  options?: { reconnection?: boolean };
}

export declare function createClient(
  user?: string,
  overrides?: Partial<ScriptoriumConfig>
): RoomsClient;

export declare function connectAndJoin(
  client: RoomsClient,
  user: string,
  options?: {
    type?: string;
    features?: string[];
    room?: string;
    connectTimeoutMs?: number;
    zones?: string | string[];
    peerCard?: object;
  }
): Promise<{ room: string; socketId: string | undefined; zones: string | string[] | null }>;

export declare function makeMaster(
  client: RoomsClient,
  room: string,
  data?: Record<string, unknown>
): void;

export declare function setState(
  client: RoomsClient,
  room: string,
  data: unknown
): void;

export declare function onState(
  client: RoomsClient,
  cb: (data: unknown) => void
): () => void;

export declare function emitRoomEvent(
  client: RoomsClient,
  event: string,
  data: unknown,
  room?: string
): void;

export declare function onRoomEvent(
  client: RoomsClient,
  event: string,
  cb: (...args: unknown[]) => void
): () => void;

export declare function waitForSocketEvent(
  socket: RoomsSocket,
  event: string,
  predicate?: ((payload: unknown) => boolean) | null,
  timeoutMs?: number
): Promise<unknown>;
