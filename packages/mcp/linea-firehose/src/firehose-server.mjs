/**
 * MCP server factory for the firehose volume (read-only DISK_01).
 * POST /mcp + GET /mcp/health — same contract as linea-system and solar-system.
 */

import { createStandardMcpServer } from '@zeus/presets-sdk/mcp';
import { SERVER_NAME, SERVER_VERSION } from './config.mjs';
import * as logic from './logic.mjs';

/**
 * @param {object} [config]
 * @returns {{ name: string, port: number, app: import('express').Express, start: () => Promise<{ name: string, port: number, url: string, close: () => Promise<void> }> }}
 */
export function createServer(config) {
  return createStandardMcpServer({
    name: config.name,
    version: SERVER_VERSION,
    port: config.port,
    registry: logic.getResourceRegistry(),
    templateRegistry: logic.getTemplateRegistry(),
    promptRegistry: logic.getPromptRegistry(),
    buildMcp: (server) => logic.buildMcp(server),
    logLabel: config.name,
    getCardExamples: () => logic.buildFirehoseCardExamples()
  });
}

export { SERVER_NAME, SERVER_VERSION };
