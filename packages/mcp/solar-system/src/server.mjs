/**
 * Starts a single body server: node src/server.mjs <sun|moon|earth>
 */

import { isMainModule, runMcpMain } from '@zeus/presets-sdk';
import { createBodyServer } from './body-server.mjs';
import { bodies, getBody } from './bodies.mjs';

export async function startOne(name) {
  return createBodyServer(getBody(name)).start();
}

if (isMainModule(import.meta.url)) {
  const name = process.argv[2];
  if (!name || !bodies[name]) {
    console.error(`Usage: node src/server.mjs <${Object.keys(bodies).join('|')}>`);
    process.exit(1);
  }
  await runMcpMain(() => startOne(name), { label: name });
}
