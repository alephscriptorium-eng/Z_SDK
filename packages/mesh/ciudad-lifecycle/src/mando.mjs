/**
 * Shared mando vocabulary — Eje IV: MCP tools and secondary client both use this.
 * One surface: events/facts only; no parallel Socket.IO path.
 */

export const MANDO_VOCAB = Object.freeze({
  start: 'ARRANQUE_SOLICITADO',
  stop: 'PARADA_SOLICITADA',
  status: 'STATUS'
});

/**
 * Normalize tool/CLI mando into leaf events.
 * @param {'start'|'stop'|string} command
 * @param {{ nodo?: string, barrioId?: string }} target
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
  throw new Error(`Unknown mando "${command}"`);
}
