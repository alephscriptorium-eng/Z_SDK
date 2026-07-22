/**
 * @zeus/authority-kit — autoridad genérica (engine).
 * Sin nombres de juego concretos (D-8 / PRACTICAS §1.11).
 */

export { EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';
export { checkSnapshotBudget, measureSnapshotBytes, SNAPSHOT_BUDGET_BYTES } from '@zeus/protocol';

export {
  startAuthority,
  resolveContentRevSnapshotOpts,
  resolveStateDeltaSnapshotOpts,
  normalizeEvents
} from './create-authority.mjs';

export {
  issuePeerCard,
  resolvePeerCardExpiresAt,
  DEFAULT_PEER_CARD_TTL_MS,
  DEFAULT_JOIN_INTENTS,
  peerCardPhase,
  peerCardRemainingMs,
  PEER_CARD_PHASE
} from './issue-peer-card.mjs';

// Re-export ACL surface used by startAuthority({ acl }) — single import path.
export {
  POWER,
  createAclPolicy,
  authorizeAcl,
  assertIntentAcl,
  capabilityScope,
  setOwner,
  clearOwner,
  ownerOf
} from '@zeus/protocol';
