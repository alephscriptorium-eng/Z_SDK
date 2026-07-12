/**
 * CLI entry: npm start — firehose MCP server on ZEUS_MCP_FIREHOSE (default 3008).
 */

import { isMainModule, runMcpMain } from '@zeus/presets-sdk';
import { getServerConfig } from './config.mjs';
import { createServer } from './firehose-server.mjs';

export async function startFirehoseMcp(configOverride = {}) {
  const config = { ...getServerConfig(), ...configOverride };
  const factory = createServer(config);
  return factory.start();
}

if (isMainModule(import.meta.url)) {
  await runMcpMain(startFirehoseMcp);
}
