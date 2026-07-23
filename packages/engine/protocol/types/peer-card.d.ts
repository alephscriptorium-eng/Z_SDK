/**
 * @zeus/protocol/peer-card — generated types (WP-U155).
 * Do not edit by hand: npm run types:generate -w @zeus/protocol
 */

export {
  SSB_ID_RE,
  isSsbId,
  ssbIdFromPublicKeyBytes,
  publicKeyBytesFromSsbId,
  travelingPeerCardPayload,
  travelingPeerCardBytes,
  attachTravelingSeat,
  PEER_CARD_PHASE,
  makePeerCard,
  isPeerCardShaped,
  peerCardPhase,
  peerCardRemainingMs,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  roleScope
} from './index.js';
export type { PeerCard, MakePeerCardInput, PeerCardPhase, Role } from './index.js';
