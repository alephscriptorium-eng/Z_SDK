/** Types for `@zeus/room-client-browser/browser` (WP-U157). */

export const DEFAULT_GAME_ROOM: string;

export interface BrowserRoomClientConfig {
  scriptoriumUrl: string;
  room?: string;
  sessionId?: string;
  token: string;
  user?: string;
  type?: string;
  features?: string[];
}

export interface BrowserRoomClient {
  connect(): Promise<void> | void;
  disconnect(): Promise<void> | void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off?(event: string, handler: (...args: unknown[]) => void): void;
  room?(name: string, payload?: unknown, room?: string): void;
  [key: string]: unknown;
}

export function createBrowserRoomClient(
  cfg: BrowserRoomClientConfig
): BrowserRoomClient;
