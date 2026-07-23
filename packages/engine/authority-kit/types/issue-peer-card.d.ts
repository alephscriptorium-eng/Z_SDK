/** Peer-card helpers for `@zeus/authority-kit` (WP-U157). */

export const DEFAULT_PEER_CARD_TTL_MS: number;
export const DEFAULT_JOIN_INTENTS: readonly string[];

export function resolvePeerCardExpiresAt(input?: {
  expiresAt?: string | number | Date;
  ttlMs?: number;
  now?: number;
}): number;

export function issuePeerCard(input: {
  roomId: string;
  endpoint: string;
  role?: string;
  displayName?: string;
  sessionId?: string;
  token?: string;
  scopes?: string[];
  expiresAt?: string | number | Date;
  issuedAt?: string | number | Date;
  ttlMs?: number;
  now?: number;
}): Record<string, unknown>;

export function peerCardPhase(
  card: { expiresAt?: string | number },
  now?: number
): string;

export function peerCardRemainingMs(
  card: { expiresAt?: string | number },
  now?: number
): number;

export const PEER_CARD_PHASE: Readonly<Record<string, string>>;
