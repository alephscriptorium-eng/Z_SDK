/**
 * @zeus/protocol — generated types (WP-U54).
 * Do not edit by hand: npm run types:generate -w @zeus/protocol
 * Source: contract EVENT_KINDS + roles + gates (same as AsyncAPI).
 */

export declare const PROTOCOL_VERSION: 1;

export type EventKind = 'state' | 'intent' | 'track' | 'ledger';

export declare const EVENT_KINDS: readonly EventKind[];

export declare const EVENTS: {
  readonly STATE: 'state';
  readonly INTENT: 'intent';
  readonly TRACK: 'track';
  readonly LEDGER: 'ledger';
};

/** Wire/AsyncAPI shape table — source for isShaped + AsyncAPI generator (WP-U98). */
export declare const EVENT_META: Readonly<
  Record<
    EventKind,
    {
      readonly direction: 'inbound' | 'outbound';
      readonly summary: string;
      readonly payload: {
        readonly type: 'object';
        readonly required: readonly string[];
        readonly properties: Record<string, unknown>;
        readonly additionalProperties?: boolean;
      };
    }
  >
>;

/** Base envelope fields shared by state|intent|track|ledger (AsyncAPI components). */
export interface EnvelopeBase {
  v: number;
  /** Game id supplied by the consumer package — engine never hardcodes games. */
  game: string;
  from?: string;
  /** Unix epoch milliseconds */
  ts: number;
}

export type Role = 'player' | 'dj' | 'operator';

export declare const ROLES: readonly Role[];

export interface PeerCard {
  roomId: string;
  endpoint: string;
  token: string;
  scopes: string[];
  /** ISO-8601 datetime */
  expiresAt: string;
  displayName?: string;
  sessionId?: string;
  /** SSB feed id `@….ed25519` (federation handshake · Z_SDK #4) */
  ssbId?: string;
  /** ed25519 seat signature (base64) over travelingPeerCardPayload */
  seatSignature?: string;
}

export interface IntentPayload extends EnvelopeBase {
  kind?: 'intent';
  actorId: string;
  intent: string;
  role?: Role;
  peerCard?: PeerCard;
  [key: string]: unknown;
}

export interface StatePayload extends EnvelopeBase {
  kind?: 'state';
  tick?: number;
  reason?: 'change' | 'heartbeat';
  [key: string]: unknown;
}

export interface TrackPayload extends EnvelopeBase {
  kind?: 'track';
  actorId?: string;
  ref?: Record<string, unknown>;
  hint?: string;
  [key: string]: unknown;
}

export interface LedgerPayload extends EnvelopeBase {
  kind: 'ledger';
  seq: number;
  entryKind?: string;
  actorId?: string;
  detail?: Record<string, unknown>;
  [key: string]: unknown;
}

export type ProtocolEnvelope = IntentPayload | StatePayload | TrackPayload | LedgerPayload;

export interface MakeEnvelopeOpts {
  game: string;
  kind: EventKind;
  from?: string;
  ts?: number;
  v?: number;
  [key: string]: unknown;
}

export interface MakeIntentOpts {
  from?: string;
  /** Game id — required (same rule as makeEnvelope). */
  game: string;
  role?: Role;
  ts?: number;
  v?: number;
}

export type IntentCatalog =
  | Map<string, { roles: readonly Role[]; description?: string }>
  | Record<string, { roles: Role[]; description?: string }>
  | string[];

export interface IntentCatalogEntry {
  roles: readonly Role[];
  description?: string;
}

export type ValidateIntentResult =
  | { ok: true; role: string }
  | { ok: false; error: string };

export declare function makeEnvelope(opts: MakeEnvelopeOpts): ProtocolEnvelope;

export declare function makeIntent(
  actorId: string,
  intent: string,
  args?: Record<string, unknown>,
  fromOrOpts?: string | MakeIntentOpts
): IntentPayload;

/**
 * Full wire/AsyncAPI shape per kind (derived from EVENT_META).
 * Distinct from isIntentShaped (transport minimum + optional catalog).
 */
export declare function isShaped(kind: EventKind | string, data: unknown): boolean;

export declare function isIntentShaped(
  payload: unknown,
  catalog?: IntentCatalog | null
): boolean;

export declare function validateIntent(
  payload: unknown,
  catalog: IntentCatalog
): ValidateIntentResult;

export declare function isRole(role: string): role is Role;

export declare function createIntentCatalog(
  defs: Record<string, { roles: Role[]; description?: string }>
): Map<string, IntentCatalogEntry>;

export declare function intentAllowsRole(
  intentName: string,
  role: string,
  catalog: IntentCatalog
): boolean;

export declare function resolveIntentRole(payload: object): string;

export declare function assertIntentRole(
  payload: object,
  catalog: IntentCatalog
): ValidateIntentResult;

export declare const GATES: {
  readonly SINGLE_AUTHORITY: 'G-PROTO.1';
  readonly VIEWS_PROJECT: 'G-PROTO.2';
  readonly DOMAIN_PURE: 'G-PROTO.3';
  readonly REDUCER_TABLE: 'G-PROTO.4';
  readonly SNAPSHOT_BUDGET: 'G-PROTO.5';
};

export declare const SNAPSHOT_BUDGET_BYTES: 32768;

export declare function measureSnapshotBytes(snapshot: unknown): number;

export declare function checkSnapshotBudget(
  snapshot: unknown,
  budget?: number
): { ok: boolean; bytes: number; budget: number };

export interface MakePeerCardInput {
  roomId: string;
  endpoint: string;
  token: string;
  scopes: string[];
  expiresAt: string | number | Date;
  displayName?: string;
  sessionId?: string;
  ssbId?: string;
  seatSignature?: string;
}

export declare const SSB_ID_RE: RegExp;

export declare function isSsbId(value: unknown): value is string;

export declare function ssbIdFromPublicKeyBytes(
  publicKeyBytes: Uint8Array | Buffer
): string;

export declare function publicKeyBytesFromSsbId(ssbId: string): Uint8Array;

export declare function travelingPeerCardPayload(
  card: object
): Record<string, unknown>;

export declare function travelingPeerCardBytes(card: object): Uint8Array;

export declare function attachTravelingSeat(
  card: object,
  seat: { ssbId: string; seatSignature: string }
): PeerCard;

export declare function makePeerCard(input: MakePeerCardInput): PeerCard;

export declare function isPeerCardShaped(card: unknown): boolean;

export declare function isPeerCardFresh(card: object, now?: number): boolean;

export declare function roleFromPeerCard(
  scopesOrCard: string[] | { scopes?: string[] }
): Role | null;

export declare function peerCardGrantsRole(
  card: PeerCard,
  role: string,
  now?: number
): boolean;

export declare function roleScope(role: string): string;

/** Gamechannel GAME_STATE_DELTA wire name (v0.2). */
export declare const GAME_STATE_DELTA: 'GAME_STATE_DELTA';

export declare const GAME_STATE_DELTA_V: 2;

export declare const DEFAULT_DELTA_MAP_KEYS: readonly string[];

export declare function deepEqualJson(a: unknown, b: unknown): boolean;

export declare function diffGameState(
  prev: object | null | undefined,
  next: object,
  opts?: { mapKeys?: string[]; reason?: string }
): object;

export declare function applyGameStateDelta(
  base: object,
  delta: object,
  opts?: { mapKeys?: string[] }
): { ok: true; state: object } | { ok: false; error: string };

export declare function isGameStateDeltaShaped(data: unknown): boolean;

export declare function isEmptyGameStateDelta(
  delta: object,
  mapKeys?: string[]
): boolean;

export declare function makeGameStateDeltaMessage(body: object): object;
