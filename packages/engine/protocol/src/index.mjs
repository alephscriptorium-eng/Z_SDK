/**
 * @zeus/protocol — contrato único Zeus (engine).
 * Browser-safe. Sin nombres de juego concretos (D-8 / PRACTICAS §1.11).
 */

export {
  PROTOCOL_VERSION,
  EVENT_KINDS,
  EVENTS,
  EVENT_META,
  makeEnvelope,
  makeIntent,
  isShaped,
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

export {
  GAME_STATE_DELTA,
  GAME_STATE_DELTA_V,
  DEFAULT_DELTA_MAP_KEYS,
  deepEqualJson,
  diffGameState,
  applyGameStateDelta,
  isGameStateDeltaShaped,
  isEmptyGameStateDelta,
  makeGameStateDeltaMessage
} from './game-state-delta.mjs';
