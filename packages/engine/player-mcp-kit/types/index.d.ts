/** Types for `@zeus/player-mcp-kit` (WP-U157). */

export const DEFAULT_POLL_MS: number;
export function sleep(ms: number): Promise<void>;
export function fail(
  error: string,
  extra?: Record<string, unknown>
): { ok: false; error: string; [key: string]: unknown };

export function confirmIntent(
  bridge: PlayerRoomBridge,
  cfg: { confirmTimeoutMs: number; noopMs: number; pollMs?: number },
  spec: {
    intent: string;
    args?: object;
    done: (state: object) => unknown;
    unchanged?: (state: object) => boolean;
    evidence?: (state: object | null, value: unknown) => object;
    explain?: (state: object) => { ok: boolean; error?: string | null };
    timeoutMs?: number;
    timeoutHint?: string;
  }
): Promise<object>;

export interface PlayerRoomBridge {
  actor: string;
  room: string;
  connected: boolean;
  lastStateTs?: () => number | null;
  lastState?: () => { ts?: number } | null;
  connect?: () => Promise<void>;
  sendIntent?: (intent: string, args?: object) => Promise<unknown> | unknown;
  [key: string]: unknown;
}

export function createPlayerRoomBridge(options: {
  actor: string;
  room: string;
  user?: string;
  events: { STATE: string; INTENT: string; TRACK: string; LEDGER: string };
  makeIntent: (
    actorId: string,
    intent: string,
    args?: object,
    from?: string
  ) => object;
  peer?: { type: string; features?: string[] };
  peerCard?: object | null;
  requirePeerCard?: boolean;
  assertPeerCard?: (card: object) => { ok: boolean; error?: string };
  createClient?: (...args: unknown[]) => unknown;
  connectAndJoin?: (...args: unknown[]) => Promise<unknown> | unknown;
  isStateSnapshot?: (snapshot: unknown) => boolean;
  myActorFromState?: (state: object | null, actor: string) => object | null;
  onState?: (snapshot: object) => void;
  logger?: Console;
  ledgerTailSize?: number;
  tracksTailSize?: number;
}): PlayerRoomBridge;

export function standardPlayerResourceUris(game: string): {
  playerState: string;
  scene: string;
  casos: string;
};

export function buildStandardPlayerResources(opts: {
  game: string;
  bridge: { actor: string };
  readPlayerState: () => unknown;
  readScene: () => unknown;
  readCasos: () => unknown;
  titles?: { playerState?: string; scene?: string; casos?: string };
  descriptions?: { playerState?: string; scene?: string; casos?: string };
}): unknown[];

/** Returns the handle from presets-sdk `createStandardMcpServer`. */
export function createPlayerMcpServer(options: {
  name: string;
  version: string;
  port: number;
  host?: string;
  bridge: {
    actor: string;
    room: string;
    connected: boolean;
    lastStateTs?: () => number | null;
    lastState?: () => { ts?: number } | null;
  };
  registry?: object[];
  promptRegistry?: object[];
  buildMcp?: (server: object) => void;
  getCardExamples?: () => Record<string, unknown>;
  extraHealth?: () => Record<string, unknown>;
  logLabel?: string;
}): unknown;
