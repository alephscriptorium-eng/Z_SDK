/** Utilidades mínimas del player-mcp-kit (sin I/O de red). */

export const DEFAULT_POLL_MS = 120;

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Respuesta de fallo uniforme de tools MCP de jugador.
 * @param {string} error
 * @param {object} [extra]
 */
export function fail(error, extra = {}) {
  return { ok: false, error, ...extra };
}
