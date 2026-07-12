/**
 * Shared helpers for zeus-sdk e2e scripts.
 */

import { loadZeusEnv, resolveLineasBasePath } from '@zeus/presets-sdk';
import { waitForSocketEvent } from '@zeus/session-protocol';

loadZeusEnv();
export const lineasBasePath = resolveLineasBasePath();

/** Isolated linea MCP ports — avoids EADDRINUSE when dev servers occupy 4111/4112. */
export const E2E_LINEA_PORTS = { espana: 14111, wpHistoria: 14112 };

/**
 * Point linea-system startAll() at e2e ports via ZEUS_MCP_LINEA_* env.
 * @returns {() => void} restore previous env
 */
export function applyE2eLineaPorts() {
  const prev = {
    espana: process.env.ZEUS_MCP_LINEA_ESPAN,
    wp: process.env.ZEUS_MCP_LINEA_WP
  };
  process.env.ZEUS_MCP_LINEA_ESPAN = String(E2E_LINEA_PORTS.espana);
  process.env.ZEUS_MCP_LINEA_WP = String(E2E_LINEA_PORTS.wpHistoria);
  return () => {
    if (prev.espana == null) delete process.env.ZEUS_MCP_LINEA_ESPAN;
    else process.env.ZEUS_MCP_LINEA_ESPAN = prev.espana;
    if (prev.wp == null) delete process.env.ZEUS_MCP_LINEA_WP;
    else process.env.ZEUS_MCP_LINEA_WP = prev.wp;
  };
}

export function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

export const waitForEvent = waitForSocketEvent;

/** Close an MCP/HTTP server handle without throwing if already stopped. */
export async function safeClose(handle) {
  if (!handle?.close) return;
  try {
    await handle.close();
  } catch (err) {
    if (err?.code !== 'ERR_SERVER_NOT_RUNNING') throw err;
  }
}

/** Shut down all started linea handles and the player server. */
export async function shutdownE2E({ lineaHandles = [], player = null, sockets = [] } = {}) {
  for (const socket of sockets) {
    try {
      if (typeof socket.disconnect === 'function') {
        socket.disconnect();
      } else if (socket?.getSocket) {
        socket.disconnect?.();
      }
    } catch {
      /* best effort */
    }
  }
  if (player) await safeClose(player);
  await Promise.allSettled((lineaHandles || []).map((h) => safeClose(h)));
}
