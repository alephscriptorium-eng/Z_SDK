/**
 * Viaje traversal stages.
 * «viaje» = origin→destination path on a graph (not a cache-fill campaign).
 */

/** @type {readonly string[]} */
export const VIAJE_ETAPAS = Object.freeze([
  'idle',
  'planning',
  'traversing',
  'choosing',
  'pruned',
  'blocked',
  'completed'
]);

const ETAPA_SET = new Set(VIAJE_ETAPAS);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isViajeEtapa(value) {
  return typeof value === 'string' && ETAPA_SET.has(value);
}

/**
 * Allowed transitions for the travesía state machine.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const VIAJE_TRANSICIONES = Object.freeze({
  idle: Object.freeze(['planning', 'idle']),
  planning: Object.freeze(['traversing', 'blocked', 'idle']),
  traversing: Object.freeze(['choosing', 'completed', 'blocked', 'pruned']),
  choosing: Object.freeze(['traversing', 'pruned', 'blocked', 'completed']),
  pruned: Object.freeze(['idle', 'planning']),
  blocked: Object.freeze(['idle', 'planning']),
  completed: Object.freeze(['idle'])
});

/**
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (!isViajeEtapa(from) || !isViajeEtapa(to)) return false;
  return (VIAJE_TRANSICIONES[from] ?? []).includes(to);
}
