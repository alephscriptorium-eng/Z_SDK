/**
 * Aggregate for a fixed set of leaves (edificio pattern).
 * Hybrid: parallel regions via child actors — not spawnChild fleet.
 * Criteria: use when leaf count is small and fixed; rollup is reactive.
 */

import { setup, assign, createActor } from 'xstate';
import { leafMachine, provideLeafActors } from './leaf-machine.mjs';
import { projectAggregateLife, snapshotLeaf } from './project.mjs';

/**
 * Create one leaf actor with injected actuators.
 * @param {Parameters<typeof provideLeafActors>[0]} opts
 */
export function createLeafActor(opts) {
  const machine = leafMachine.provide(provideLeafActors(opts));
  const actor = createActor(machine, {
    input: {
      catalogId: opts.catalogId,
      maxRestarts: opts.maxRestarts,
      autoRestart: opts.autoRestart,
      backoffMs: opts.backoffMs
    }
  });
  return actor;
}

/**
 * Thin aggregate controller: holds leaf actors + rollup.
 * Not an XState parallel machine for f1 — rollup read-model over leaf facts.
 */
export function createAggregateController(leafOptsList) {
  const leaves = leafOptsList.map((opts) => ({
    id: opts.catalogId,
    actor: createLeafActor(opts)
  }));

  for (const { actor } of leaves) actor.start();

  function rollup() {
    return projectAggregateLife(leaves.map(({ actor }) => actor.getSnapshot().value));
  }

  function snapshots() {
    return Object.fromEntries(
      leaves.map(({ id, actor }) => [id, snapshotLeaf(actor)])
    );
  }

  return {
    leaves,
    rollup,
    snapshots,
    sendAll(event) {
      for (const { actor } of leaves) actor.send(event);
    },
    send(catalogId, event) {
      const row = leaves.find((l) => l.id === catalogId);
      if (!row) throw new Error(`Unknown leaf "${catalogId}"`);
      row.actor.send(event);
    },
    async waitFor(predicate, { timeoutMs = 15_000, pollMs = 50 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (predicate(this)) return;
        await new Promise((r) => setTimeout(r, pollMs));
      }
      throw new Error('aggregate waitFor timeout');
    },
    stop() {
      for (const { actor } of leaves) actor.stop();
    }
  };
}

/**
 * Optional XState wrapper that only tracks rollup facts (HIJO_CAMBIO).
 * Leaves remain external actors (hybrid, not dogma).
 */
export const aggregateRollupMachine = setup({
  types: {
    context: /** @type {{ life: string, leaves: Record<string, string> }} */ ({}),
    events: /** @type {{ type: 'HIJO_CAMBIO', leafId: string, value: string }} */ ({})
  },
  actions: {
    applyChild: assign({
      leaves: ({ context, event }) => ({
        ...context.leaves,
        [event.leafId]: event.value
      }),
      life: ({ context, event }) => {
        const next = { ...context.leaves, [event.leafId]: event.value };
        return projectAggregateLife(Object.values(next));
      }
    })
  }
}).createMachine({
  id: 'aggregate-rollup',
  initial: 'activo',
  context: ({ input }) => ({
    life: 'latente',
    leaves: input?.leaves ?? {}
  }),
  states: {
    activo: {
      on: {
        HIJO_CAMBIO: { actions: 'applyChild' }
      }
    }
  }
});
