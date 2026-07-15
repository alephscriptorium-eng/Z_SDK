/**
 * Factoría del servidor MCP arg-player (patrón de la casa: Streamable HTTP
 * POST /mcp, GET /mcp/health, server card en server://card).
 */

import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { SERVER_VERSION } from './config.mjs';
import {
  buildMcp,
  getResourceRegistry,
  getPromptRegistry,
  buildCardExamples
} from './logic.mjs';

/**
 * @param {{ name: string, port: number, actor: string, confirmTimeoutMs: number, noopMs: number }} config
 * @param {object} bridge — room bridge del actor (createRoomBridge)
 */
export function createServer(config, bridge) {
  return createStandardMcpServer({
    name: config.name,
    version: SERVER_VERSION,
    port: config.port,
    registry: getResourceRegistry(bridge),
    promptRegistry: getPromptRegistry(bridge),
    buildMcp: (server) => buildMcp(server, bridge, config),
    logLabel: config.name,
    extraHealth: () => ({
      actor: bridge.actor,
      room: bridge.room,
      connected: bridge.connected,
      actorEnEstado: Boolean(bridge.myActor()),
      lastStateTs: bridge.lastState()?.ts ?? null
    }),
    getCardExamples: () => buildCardExamples(bridge)
  });
}

export { SERVER_VERSION };
