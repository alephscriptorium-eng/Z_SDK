/**
 * @zeus/protocol — contrato único Zeus (engine).
 * Browser-safe. Sin nombres de juego concretos (D-8 / PRACTICAS §1.11).
 */

export {
  PROTOCOL_VERSION,
  EVENT_KINDS,
  EVENTS,
  makeEnvelope,
  makeIntent,
  isIntentShaped,
  validateIntent
} from './contract.mjs';

export {
  ROLES,
  isRole,
  createIntentCatalog,
  intentAllowsRole,
  resolveIntentRole,
  assertIntentRole
} from './roles.mjs';

export {
  GATES,
  SNAPSHOT_BUDGET_BYTES,
  measureSnapshotBytes,
  checkSnapshotBudget
} from './gates.mjs';

export {
  makePeerCard,
  isPeerCardShaped,
  isPeerCardFresh,
  roleFromPeerCard,
  peerCardGrantsRole,
  roleScope
} from './peer-card.mjs';
