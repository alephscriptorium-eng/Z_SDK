/**
 * MCP server factory for DISK_04/SSB (read-only ssb:// resources).
 */

import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { SERVER_NAME, SERVER_VERSION } from './config.mjs';
import * as logic from './logic.mjs';

/**
 * @param {number} port
 * @param {string} basePath
 */
export function createServer(port, basePath) {
  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port,
    registry: logic.getResourceRegistry(basePath),
    templateRegistry: logic.getTemplateRegistry(basePath),
    promptRegistry: logic.getPromptRegistry(),
    buildMcp: (server) => logic.buildMcp(server, { basePath }),
    logLabel: SERVER_NAME,
    getCardExamples: () => logic.buildSsbCardExamples(basePath)
  });
}

export { SERVER_NAME, SERVER_VERSION };
