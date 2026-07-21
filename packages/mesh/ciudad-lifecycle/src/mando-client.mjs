/**
 * Second mando client (Eje IV) — same vocab as MCP tools, no Socket.IO fork.
 */

import { mandoToEvents, MANDO_VOCAB } from './mando.mjs';

/**
 * @param {import('./runtime.mjs').CityLifecycleRuntime} runtime
 * @param {'start'|'stop'|'status'} command
 * @param {string} nodo
 */
export async function mandoClientCall(runtime, command, nodo) {
  // Prove the shared vocab is what tools use
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
}
