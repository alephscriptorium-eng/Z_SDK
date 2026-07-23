/** Types for `@zeus/authority-kit/create-authority` (WP-U157). */

export type AuthorityEvents = {
  STATE: string[];
  INTENT: string[];
  TRACK: string[];
  LEDGER: string[];
  DELTA: string[];
};

export function normalizeEvents(
  events?: Partial<{
    STATE: string | string[];
    INTENT: string | string[];
    TRACK: string | string[];
    LEDGER: string | string[];
    DELTA: string | string[];
  }> | null
): AuthorityEvents;

export function resolveContentRevSnapshotOpts(ctx: {
  domain: { contentRev?: () => number };
  now: number;
  lastContentRev: number;
  lastFullAt: number;
  heartbeatMs: number;
}): { opts: object; contentRev: number; isFull: boolean };

export function resolveStateDeltaSnapshotOpts(ctx: {
  now: number;
  lastFullAt: number;
  heartbeatMs: number;
  lastPublished: unknown;
  lastContentRev: number;
}): { opts: object; contentRev: number; isFull: boolean };

export interface AuthorityDomain {
  applyIntent: (intent: object, ctx?: object) => unknown;
  tick: (dtMs: number, ctx?: object) => unknown;
  snapshot: (opts?: object) => object;
  drainOutbox: () => unknown[];
  contentRev?: () => number;
}

export interface StartAuthorityOptions {
  user: string;
  room: string;
  game: string;
  tickMs?: number;
  heartbeatMs?: number;
  domain: AuthorityDomain;
  join?: { type?: string; features?: string[] };
  events?: Parameters<typeof normalizeEvents>[0];
  resolveSnapshotOpts?: (
    ctx: object
  ) => { opts: object; contentRev: number; isFull: boolean };
  stateDelta?: boolean;
  deltaMapKeys?: string[];
  snapshotBudget?:
    | boolean
    | ((snap: object) => { ok: boolean; bytes: number; budget: number });
  onShutdown?: () => Promise<void> | void;
  onLedger?: (entry: object) => void;
  onIntentAccepted?: (payload: object) => void;
  onIntentRejected?: (payload: object, error: string) => void;
  acl?: {
    policy?: Map<string, { power: string; resourceFrom?: ((...args: unknown[]) => unknown) | null }>;
    ownership?: Map<string, string>;
  };
  peerCardEndpoint?: string;
  joinIntents?: string[];
  onPeerCard?: (card: object, intent: object) => void;
  log?: (msg: string, ...args: unknown[]) => void;
  warn?: (msg: string, ...args: unknown[]) => void;
  createClient?: (...args: unknown[]) => unknown;
  connectAndJoin?: (...args: unknown[]) => Promise<unknown> | unknown;
  installSignalHandlers?: boolean;
  exitOnSignal?: number | null;
  now?: () => number;
}

export interface AuthorityHandle {
  client: object;
  stop: (exitCode?: number | null) => Promise<void>;
  publishState: (reason: string) => object;
  publishOutbox: () => number;
  events: AuthorityEvents;
  game: string;
  issuePeerCard: (...args: unknown[]) => object;
  peerCards: Map<string, object>;
  ownership: Map<string, string> | null;
}

export function startAuthority(options: StartAuthorityOptions): Promise<AuthorityHandle>;
