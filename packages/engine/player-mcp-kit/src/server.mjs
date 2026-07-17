/**
 * Factoría del servidor MCP de jugador (Streamable HTTP vía presets-sdk).
 * Health estándar: `connected` + `lastStateTs` (+ extras del juego).
 */

import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';

/**
 * @param {{
 *   name: string,
 *   version: string,
 *   port: number,
 *   host?: string,
 *   bridge: {
 *     actor: string,
 *     room: string,
 *     connected: boolean,
 *     lastStateTs?: () => number|null,
 *     lastState?: () => { ts?: number }|null
 *   },
 *   registry?: Array<object>,
 *   promptRegistry?: Array<object>,
 *   buildMcp?: (server: object) => void,
 *   getCardExamples?: () => Record<string, unknown>,
 *   extraHealth?: () => Record<string, unknown>,
 *   logLabel?: string
 * }} options
 */
export function createPlayerMcpServer({
  name,
  version,
  port,
  host,
  bridge,
  registry = [],
  promptRegistry = [],
  buildMcp,
  getCardExamples,
  extraHealth,
  logLabel
}) {
  return createStandardMcpServer({
    name,
    version,
    port,
    host,
    registry,
    promptRegistry,
    buildMcp,
    logLabel: logLabel || name,
    getCardExamples,
    extraHealth: () => {
      const lastStateTs =
        typeof bridge.lastStateTs === 'function'
          ? bridge.lastStateTs()
          : (bridge.lastState?.()?.ts ?? null);
      return {
        actor: bridge.actor,
        room: bridge.room,
        connected: bridge.connected,
        lastStateTs,
        ...(typeof extraHealth === 'function' ? extraHealth() : {})
      };
    }
  });
}
