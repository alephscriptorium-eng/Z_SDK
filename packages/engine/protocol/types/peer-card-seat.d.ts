/**
 * @zeus/protocol/peer-card-seat — generated types (WP-U155).
 * Do not edit by hand: npm run types:generate -w @zeus/protocol
 */

import type { KeyObject } from 'node:crypto';
import type { PeerCard } from './index.js';

export interface SeatKeyPair {
  ssbId: string;
  publicKey: KeyObject;
  privateKey: KeyObject;
  publicKeyBytes: Buffer;
}

export declare function generateSeatKeyPair(): SeatKeyPair;

export declare function publicKeyFromRaw(
  publicKeyBytes: Buffer | Uint8Array
): KeyObject;

export declare function signTravelingPeerCard(
  card: object,
  privateKey: KeyObject | string | Buffer,
  ssbId?: string
): PeerCard;

export declare function verifyTravelingPeerCard(
  card: unknown
): { ok: true } | { ok: false; error: string };
