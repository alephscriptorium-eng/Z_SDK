/** Types for `@zeus/authority-kit` (WP-U157). */

export { EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';
export {
  checkSnapshotBudget,
  measureSnapshotBytes,
  SNAPSHOT_BUDGET_BYTES,
  POWER,
  createAclPolicy,
  authorizeAcl,
  assertIntentAcl,
  capabilityScope,
  setOwner,
  clearOwner,
  ownerOf
} from '@zeus/protocol';

export {
  startAuthority,
  resolveContentRevSnapshotOpts,
  resolveStateDeltaSnapshotOpts,
  normalizeEvents
} from './create-authority.js';
export type {
  AuthorityEvents,
  AuthorityDomain,
  StartAuthorityOptions,
  AuthorityHandle
} from './create-authority.js';

export {
  issuePeerCard,
  resolvePeerCardExpiresAt,
  DEFAULT_PEER_CARD_TTL_MS,
  DEFAULT_JOIN_INTENTS,
  peerCardPhase,
  peerCardRemainingMs,
  PEER_CARD_PHASE
} from './issue-peer-card.js';
