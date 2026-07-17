/**
 * Starts the three solar-system MCP servers (sun, moon, earth) in one
 * process. Usable as a CLI (npm start) or programmatically via startAll().
 */

import { resolveZeusMcpPorts, isMainModule, runMcpMain } from '@zeus/presets-sdk';
import { createBodyServer } from './body-server.mjs';
import { bodies } from './bodies.mjs';

const MCP_PORT_KEYS = {
  sun: 'sun',
  moon: 'moon',
  earth: 'earth'
};

function bodiesWithEnvPorts() {
  const mcp = resolveZeusMcpPorts();
  return Object.fromEntries(
    Object.entries(bodies).map(([key, body]) => [
      key,
      { ...body, port: mcp.solar[MCP_PORT_KEYS[key]] ?? body.port }
    ])
  );
}

/**
 * Starts all three servers. Resolves to an array of
 * { name, port, url, close() } handles, in order: sun, moon, earth.
 * If any server fails to start, already-started ones are closed first.
 */
export async function startAll() {
  const handles = [];
  for (const body of Object.values(bodiesWithEnvPorts())) {
    try {
      handles.push(await createBodyServer(body).start());
    } catch (err) {
      await Promise.allSettled(handles.map((h) => h.close()));
      throw err;
    }
  }
  return handles;
}

if (isMainModule(import.meta.url)) {
  await runMcpMain(startAll);
}
