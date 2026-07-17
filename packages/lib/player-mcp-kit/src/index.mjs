/**
 * @zeus/player-mcp-kit — patrón «un MCP por actor» con semántica verificable.
 * Sin nombres de juego (D-8 / PRACTICAS §1.11).
 */

export { sleep, fail, DEFAULT_POLL_MS } from './util.mjs';
export { confirmIntent } from './confirm-intent.mjs';
export { createPlayerRoomBridge } from './room-bridge.mjs';
export {
  standardPlayerResourceUris,
  buildStandardPlayerResources
} from './resources.mjs';
export { createPlayerMcpServer } from './server.mjs';
export { listCasoIds, extractCaso } from './casos-md.mjs';
