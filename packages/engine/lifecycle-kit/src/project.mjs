/**
 * Single projector: process truth (leaf states) → life rollup label.
 * Composition owns game snapshot; kit only maps leaf → rollup token.
 */

import { LIFE_ROLLUP } from './transitions.mjs';

/**
 * @param {string | { value?: string }} leafState
 * @returns {'vivo'|'latente'|'roto'|'transicion'}
 */
export function projectLeafLife(leafState) {
  const value = typeof leafState === 'string' ? leafState : leafState?.value;
  return LIFE_ROLLUP[value] || 'latente';
}

/**
 * Aggregate of fixed leaves: vivo if ≥1 viva; roto if all rota; else latente
 * (transitional if any in flight).
 * @param {Array<string | { value?: string }>} leafStates
 */
export function projectAggregateLife(leafStates) {
  const values = leafStates.map((s) =>
    typeof s === 'string' ? s : s?.value
  );
  if (values.length === 0) return 'latente';
  if (values.some((v) => v === 'viva')) return 'vivo';
  if (values.every((v) => v === 'rota')) return 'roto';
  if (values.some((v) => ['arrancando', 'degradada', 'parando'].includes(v))) {
    return 'transicion';
  }
  return 'latente';
}

/**
 * @param {import('xstate').AnyActorRef} actor
 */
export function snapshotLeaf(actor) {
  const snap = actor.getSnapshot();
  return {
    value: snap.value,
    life: projectLeafLife(snap.value),
    context: {
      catalogId: snap.context.catalogId,
      restartCount: snap.context.restartCount,
      intentionalStop: snap.context.intentionalStop,
      diagnosis: snap.context.diagnosis,
      healthIdentity: snap.context.healthIdentity
    }
  };
}
