// Ambient declarations for the untyped @zeus ESM libs consumed by the host
// (block-13 L-serve). They are pure JS packages; the host only needs the shapes
// it uses, so these are intentionally light.

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
    onSessionEvent(event: string, payload?: any): AlephMessage[];
    onSnapshot(snapshot?: any): AlephMessage[];
    reset(): void;
  }
  export function createOperatorBridge(opts?: { hub?: string }): OperatorBridge;
  export const CHANNELS: Record<string, string>;
  export const TYPES: Record<string, string>;
  export const HUB: string;
  export const SESSION_EVENTS: string[];
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
  }): BrowserRoomClient;
}
