/**
 * @zeus/authority-kit — autoridad genérica (engine).
 * Sin nombres de juego concretos (D-8 / PRACTICAS §1.11).
 */

export { EVENTS as PROTOCOL_EVENTS } from '@zeus/protocol';
export { checkSnapshotBudget, measureSnapshotBytes, SNAPSHOT_BUDGET_BYTES } from '@zeus/protocol';

export {
  startAuthority,
  resolveContentRevSnapshotOpts,
  normalizeEvents
} from './create-authority.mjs';
