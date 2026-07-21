/**
 * Second mando client (Eje IV) — same vocab as MCP tools, no Socket.IO fork.
 */

import { mandoToEvents, MANDO_VOCAB } from './mando.mjs';

/**
 * @param {import('./runtime.mjs').CityLifecycleRuntime} runtime
 * @param {'start'|'stop'|'status'|'cascade_start'|'cascade_stop'} command
 * @param {string | string[]} nodoOrNodos
 * @param {{ concurrency?: number }} [opts]
 */
export async function mandoClientCall(runtime, command, nodoOrNodos, opts = {}) {
  if (command === 'cascade_start' || command === 'cascade_stop') {
    const nodos = Array.isArray(nodoOrNodos)
      ? nodoOrNodos
      : nodoOrNodos
        ? [nodoOrNodos]
        : undefined;
    const normalized = mandoToEvents(command, { nodos });
    assertVocab(normalized);
    const action = command === 'cascade_start' ? 'start' : 'stop';
    return runtime.dispatchCascade(action, {
      nodos,
      concurrency: opts.concurrency
    });
  }

  const nodo = Array.isArray(nodoOrNodos) ? nodoOrNodos[0] : nodoOrNodos;
  const normalized = mandoToEvents(command, { nodo });
  assertVocab(normalized);
  return runtime.dispatchMando(command, { nodo });
}

function assertVocab(normalized) {
  if (normalized.action === 'start') {
    if (normalized.event.type !== MANDO_VOCAB.start) {
      throw new Error('mando vocab drift');
    }
  }
  if (normalized.action === 'stop') {
    if (normalized.event.type !== MANDO_VOCAB.stop) {
      throw new Error('mando vocab drift');
    }
  }
  if (normalized.action === 'cascade_start') {
    if (normalized.event.type !== MANDO_VOCAB.cascade_start) {
      throw new Error('mando vocab drift');
    }
  }
  if (normalized.action === 'cascade_stop') {
    if (normalized.event.type !== MANDO_VOCAB.cascade_stop) {
      throw new Error('mando vocab drift');
    }
  }
}
