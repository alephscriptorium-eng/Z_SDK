// Ambient declarations for the untyped @zeus ESM libs consumed by the host.
// Pure JS packages; shapes are intentionally light.

declare module '@zeus/operator-bridge' {
  export interface AlephMessage {
    id: string;
    fromBot: string;
    toBot: string;
    channel: string;
    content: string;
    timestamp: number;
    type: string;
  }
  export interface OperatorBridge {
    onState(state?: any): AlephMessage[];
    onLedger(entry?: any): AlephMessage[];
    reset(): void;
    projectSlice(state?: any): any;
  }
  export function createOperatorBridge(opts?: { hub?: string }): OperatorBridge;
  export function projectOperatorSlice(state?: any, sceneId?: string): {
    sceneId: string | null;
    gamemapId: string | null;
    reason: string | null;
    ts: number | null;
    actorCount: number;
    actors: Record<string, unknown>;
    lines: Record<string, unknown>;
    barrios: Record<string, { id?: string; estado?: string; anchorId?: string; parent?: string }>;
    barrioCount: number;
    barrioByEstado: Record<string, number>;
    objetivo: unknown;
    maze: unknown;
    contacts: unknown;
    lastWake: unknown;
    lastSleep: unknown;
  };
  export function tallyBarrioEstados(
    barrios?: Record<string, { estado?: string }>,
  ): Record<string, number>;
  export const BARRIO_CHANNEL: Record<string, string>;
  export const BARRIO_ESTADOS: readonly string[];
  export function makeOperatorIntent(
    actorId: string,
    intent: string,
    args?: Record<string, unknown>,
    opts?: { game?: string; from?: string; ts?: number },
  ): Record<string, unknown>;
  export const CHANNELS: Record<string, string>;
  export const TYPES: Record<string, string>;
  export const HUB: string;
  export const WIRE: {
    STATE: readonly string[];
    INTENT: readonly string[];
    LEDGER: readonly string[];
  };
  export const SCENE_IDS: Record<string, string>;
}

declare module '@zeus/room-client-browser/browser' {
  export interface BrowserRoomClient {
    room: string;
    user: string;
    getSocket(): any;
    connect(): Promise<any>;
    disconnect(): void;
    onState(cb: (snapshot: any, envelope: any) => void): () => void;
    onRoomEvent(event: string, cb: (payload: any) => void): () => void;
    emit(event: string, data: any): void;
  }
  export function createBrowserRoomClient(cfg: {
    scriptoriumUrl: string;
    room?: string;
    sessionId?: string;
    token: string;
    user?: string;
    type?: string;
    features?: string[];
  }): BrowserRoomClient;
  export const DEFAULT_GAME_ROOM: string;
}

declare module '@zeus/room-client-browser/dev-config' {
  export const DEV_ROOM_CLIENT_CONFIG: {
    scriptoriumUrl: string;
    room: string;
    sessionId: string;
    token: string;
  };
  export function readInjectedRoomConfig(elementId: string): typeof DEV_ROOM_CLIENT_CONFIG;
}
