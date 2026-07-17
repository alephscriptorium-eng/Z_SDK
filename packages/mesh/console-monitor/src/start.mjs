/**
 * Unified startup: socket+REST substrate, MCP monitor, and TOP console TUI.
 */

import { isMainModule, runMcpMain } from '@zeus/presets-sdk';
import logUpdate from 'log-update';
import { getDebugConfig } from './config.mjs';
import { createSessionClient } from './client.mjs';
import { createRestPoller } from './rest-poller.mjs';
import { createStateStore } from './state-store.mjs';
import { createServer } from './mcp-server.mjs';
import { renderFrame } from './render.mjs';

const CUE_YEARS = [450, 1350, 1808, 1978];

/**
 * @param {ReturnType<typeof getDebugConfig>} config
 */
export function createSubstrate(config) {
  const poller = createRestPoller({
    baseUrl: config.baseUrl,
    defaultCaso: config.defaultCaso,
    intervalMs: config.restPollMs
  });

  /** @type {ReturnType<typeof createStateStore>} */
  let stateStore;
  const client = createSessionClient({
    baseUrl: config.baseUrl,
    pushEvent: (type, payload, detail) => stateStore.recordEvent(type, payload, detail)
  });
  stateStore = createStateStore({ config, client, poller });

  return { client, poller, stateStore };
}

/**
 * @param {ReturnType<typeof createStateStore>} stateStore
 * @param {ReturnType<typeof getDebugConfig>} config
 * @param {{ client: ReturnType<typeof createSessionClient>, poller: ReturnType<typeof createRestPoller> }} substrate
 * @param {{ headless?: boolean }} [options]
 */
export function createTui(stateStore, config, substrate, options = {}) {
  const { client, poller } = substrate;
  const headless = options.headless === true;
  const onQuit = options.onQuit;
  let refreshTimer = null;
  let stdinHandler = null;
  let shuttingDown = false;

  function paint() {
    logUpdate(
      renderFrame({
        config,
        clientState: stateStore.getClientState(),
        restState: stateStore.getRestState(),
        monitorUptime: stateStore.getMonitorUptime(),
        servers: stateStore.getServers().merged
      })
    );
  }

  function onKey(key) {
    const ch = key.toString();
    if (ch === '\u0003' || ch === 'q' || ch === 'Q') {
      if (onQuit) onQuit();
      else close();
      return;
    }
    if (ch === 'r' || ch === 'R') {
      client.reconnect();
      poller.pollOnce();
      return;
    }
    if (ch === 'p' || ch === 'P') {
      client.pauseTransport();
      return;
    }
    const idx = Number(ch) - 1;
    if (idx >= 0 && idx < CUE_YEARS.length) {
      client.setPlayhead(CUE_YEARS[idx]);
    }
  }

  function start() {
    client.connect();
    poller.start();

    if (!headless) {
      const refreshMs = Math.round(1000 / config.refreshHz);
      refreshTimer = setInterval(paint, refreshMs);
      stateStore.onUpdate(paint);
      paint();

      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        stdinHandler = onKey;
        process.stdin.on('data', stdinHandler);
      }
    }
  }

  function close() {
    if (shuttingDown) return;
    shuttingDown = true;

    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    if (stdinHandler && process.stdin.isTTY) {
      process.stdin.off('data', stdinHandler);
      process.stdin.setRawMode(false);
    }

    poller.stop();
    client.disconnect();

    if (!headless) {
      logUpdate.clear();
      logUpdate.done();
    }
  }

  return { start, close, paint };
}

/**
 * Starts substrate, MCP server, and TUI. Returns unified close().
 * @param {Partial<ReturnType<typeof getDebugConfig>> & { headless?: boolean }} [options]
 */
export async function startAll(options = {}) {
  const { headless = false, ...configOverrides } = options;
  const config = getDebugConfig(configOverrides);
  const substrate = createSubstrate(config);

  let mcpHandle = null;
  let tuiHandle = null;

  try {
    mcpHandle = await createServer(substrate.stateStore, config, substrate).start();

    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      tuiHandle?.close();
      await mcpHandle?.close?.();
    };

    tuiHandle = createTui(substrate.stateStore, config, substrate, {
      headless,
      onQuit: () => close().then(() => process.exit(0))
    });
    tuiHandle.start();

    if (!headless) {
      console.log(`[${mcpHandle.name}] TUI monitor → deck-io ${config.baseUrl}`);
    }

    return {
      config,
      substrate,
      stateStore: substrate.stateStore,
      mcp: mcpHandle,
      tui: tuiHandle,
      close
    };
  } catch (err) {
    tuiHandle?.close();
    await mcpHandle?.close?.();
    throw err;
  }
}

if (isMainModule(import.meta.url)) {
  await runMcpMain(async () => {
    const handle = await startAll();
    return {
      name: handle.mcp?.name || 'console-monitor',
      url: handle.mcp?.url,
      close: () => handle.close()
    };
  }, { label: 'console-monitor' });
}

