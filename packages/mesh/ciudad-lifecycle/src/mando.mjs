/**
 * Shared mando vocabulary — Eje IV: MCP tools and secondary client both use this.
 * One surface: events/facts only; no parallel Socket.IO path.
 */

export const MANDO_VOCAB = Object.freeze({
  start: 'ARRANQUE_SOLICITADO',
  stop: 'PARADA_SOLICITADA',
  status: 'STATUS',
  cascade_start: 'CASCADA_ARRANQUE',
  cascade_stop: 'CASCADA_PARADA'
});

/**
 * Normalize tool/CLI mando into leaf events.
 * @param {'start'|'stop'|string} command
 * @param {{ nodo?: string, barrioId?: string, nodos?: string[] }} target
 */
export function mandoToEvents(command, target = {}) {
  const cmd = String(command || '').toLowerCase();
  if (cmd === 'start' || cmd === 'city.start') {
    return {
      type: 'mando',
      action: 'start',
      event: { type: MANDO_VOCAB.start },
      barrioId: target.barrioId || target.nodo,
      nodo: target.nodo || target.barrioId
    };
  }
  if (cmd === 'stop' || cmd === 'city.stop') {
    return {
      type: 'mando',
      action: 'stop',
      event: { type: MANDO_VOCAB.stop },
      barrioId: target.barrioId || target.nodo,
      nodo: target.nodo || target.barrioId
    };
  }
  if (cmd === 'status' || cmd === 'city.status') {
    return {
      type: 'mando',
      action: 'status',
      event: { type: MANDO_VOCAB.status },
      barrioId: target.barrioId || target.nodo,
      nodo: target.nodo || target.barrioId
    };
  }
  if (
    cmd === 'cascade_start' ||
    cmd === 'city.cascade_start' ||
    cmd === 'cascade-start'
  ) {
    return {
      type: 'mando',
      action: 'cascade_start',
      event: { type: MANDO_VOCAB.cascade_start },
      nodos: target.nodos,
      barrioId: null
    };
  }
  if (
    cmd === 'cascade_stop' ||
    cmd === 'city.cascade_stop' ||
    cmd === 'cascade-stop'
  ) {
    return {
      type: 'mando',
      action: 'cascade_stop',
      event: { type: MANDO_VOCAB.cascade_stop },
      nodos: target.nodos,
      barrioId: null
    };
  }
  throw new Error(`Unknown mando "${command}"`);
}
