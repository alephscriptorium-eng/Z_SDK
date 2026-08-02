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

/**
 * Zonas como ámbito (WP-U196).
 *
 * Una zona es un sufijo de canal (`sala::z:<zona>`), no un filtro de cliente:
 * dos zonas del mismo topic son dos conversaciones y quien reparte es el
 * servidor.
 *
 * LÍMITES QUE VIAJAN CON ESTA API:
 * - El aislamiento es **intra-servidor**. Con `ZEUS_SCRIPTORIUM_BRIDGE=remote`
 *   el relay reparte a todo el namespace ignorando el canal, así que todo
 *   evento de bajada alcanza a todos los sockets. (Herencia: las salas ya se
 *   perdían ahí.)
 * - Ámbito **no** es permiso: el nombre de canal es determinista y adivinable;
 *   cualquiera que sepa el id de una zona puede suscribirse.
 * - El id de zona es **sensible a mayúsculas**: `'Norte'` ≠ `'norte'`.
 */
export type ZoneInput = string | string[] | Set<string> | null | undefined;

/** Separador de ámbito dentro del nombre de canal: `sala::z:<zona>`. */
export declare const ZONE_SCOPE_SEPARATOR: string;

/**
 * Canal físico de una zona. Sensible a mayúsculas; sólo recorta el blanco de
 * los bordes. Lanza si la zona es vacía, `'*'` o lleva el separador — **y
 * también si lo lleva `room`**, para que los dos espacios de nombres sean
 * disjuntos por los dos lados.
 */
export declare function zoneChannel(room: string, zone: string): string;

/** Lista de zonas sin blancos ni duplicados, en orden de aparición. */
export declare function normalizeZones(zones: ZoneInput): string[];

/**
 * Canales de un (room, zones). Sin zonas → `[room]` (la sala desnuda, el
 * ámbito SIN zona). La ausencia nunca significa «todas las zonas».
 */
export declare function resolveZoneChannels(
  room: string,
  zones: ZoneInput
): { zones: string[]; channels: string[] };

export declare function connectAndJoin(
  client: RoomsClient,
  user: string,
  options?: {
    type?: string;
    features?: string[];
    room?: string;
    connectTimeoutMs?: number;
    zones?: ZoneInput;
    peerCard?: object;
  }
): Promise<{
  room: string;
  socketId: string | undefined;
  /** Zonas normalizadas; `[]` = ámbito sin zona (antes de U196: `null`). */
  zones: string[];
  /** Canales realmente suscritos: `[room]` o uno por zona. */
  channels: string[];
}>;

export declare function makeMaster(
  client: RoomsClient,
  room: string,
  data?: Record<string, unknown>,
  zone?: string
): void;

export declare function setState(
  client: RoomsClient,
  room: string,
  data: unknown,
  zone?: string
): void;

export declare function onState(
  client: RoomsClient,
  cb: (data: unknown) => void
): () => void;

/**
 * Emite por `ROOM_MESSAGE`. Con `zone`, entra EN esa zona; sin `zone`, en la
 * sala desnuda, que ningún suscriptor de zona escucha.
 *
 * ASIMETRÍA con la suscripción: aquí «ausencia» es sólo `null`/`undefined`.
 * `zone: ''` **lanza** (al suscribir, `zones: ''` cae a la sala desnuda).
 */
export declare function emitRoomEvent(
  client: RoomsClient,
  event: string,
  data: unknown,
  room?: string,
  zone?: string
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
