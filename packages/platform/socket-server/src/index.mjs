#!/usr/bin/env node
/**
 * @zeus/socket-server — Socket.io runtime /runtime.
 */

import { pathToFileURL } from 'node:url';
import { createScriptoriumServer } from './create-server.mjs';
import { startScriptoriumServer } from './start.mjs';

export { createScriptoriumServer };
export { NAMESPACE, resolveConfig } from './config.mjs';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    await startScriptoriumServer();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
