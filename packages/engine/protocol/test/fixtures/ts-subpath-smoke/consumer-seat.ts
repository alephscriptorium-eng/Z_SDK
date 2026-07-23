/**
 * Eje IV sensor A — resolves `@zeus/protocol/peer-card-seat` types (WP-U155).
 * Must typecheck without `any` escape.
 */
import {
  generateSeatKeyPair,
  signTravelingPeerCard,
  verifyTravelingPeerCard,
  type SeatKeyPair
} from '@zeus/protocol/peer-card-seat';
import { makePeerCard } from '@zeus/protocol/peer-card';

export function seatRoundTrip(): {
  keys: SeatKeyPair;
  ok: boolean;
} {
  const keys: SeatKeyPair = generateSeatKeyPair();
  const card = makePeerCard({
    roomId: 'r',
    endpoint: 'http://example.test',
    token: 't',
    scopes: ['role:player'],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ssbId: keys.ssbId
  });
  const signed = signTravelingPeerCard(card, keys.privateKey, keys.ssbId);
  const result = verifyTravelingPeerCard(signed);
  const ok: boolean = result.ok === true;
  return { keys, ok };
}
