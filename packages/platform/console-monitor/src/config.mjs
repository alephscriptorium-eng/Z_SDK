/**
 * Configuration for @zeus/console-monitor.
 * Resolves player-ui endpoint from ZEUS_* env only.
 */

import { createAppConfig } from '@zeus/app-shell';
import {
  resolvePlayerUiEndpoint,
  resolvePlayerDebugEndpoint as resolveConsoleMonitorEndpoint,
  resolveZeusHost,
  resolveZeusUiPorts
} from '@zeus/presets-sdk';
import { DEFAULT_ZEUS_UI_MESH, DEFAULT_ZEUS_MCP } from '@zeus/presets-sdk/env';

export const { packageDir } = createAppConfig({
  appId: 'debug',
  importMetaUrl: import.meta.url,
  skipConfigFile: true
});

const DEFAULTS = {
  host: DEFAULT_ZEUS_UI_MESH.player.host,
  port: DEFAULT_ZEUS_UI_MESH.player.port,
  mcpHost: DEFAULT_ZEUS_UI_MESH.player.host,
  mcpPort: DEFAULT_ZEUS_MCP.playerDebug.monitor, // env mesh key (ZEUS_PORT_PLAYER_DEBUG)
  defaultCaso: 'aeo-p24-linea',
  refreshHz: 4,
  restPollMs: 7000,
  maxEvents: 32,
  tuiMaxEvents: 8,
  tuiMaxServers: 16
};

/**
 * @param {Partial<typeof DEFAULTS & { baseUrl?: string, sessionUrl?: string, debugServer?: boolean }>} [overrides]
 */
export function getDebugConfig(overrides = {}) {
  const zeusHost = resolveZeusHost();
  const playerEndpoint = resolvePlayerUiEndpoint(DEFAULTS.port);
  const scr = resolveZeusUiPorts().scriptorium || { host: 'localhost', port: 3017, path: '/runtime' };
  const scriptoriumUrl = `http://${scr.host}:${scr.port}${scr.path || '/runtime'}`;

  const host = playerEndpoint.host || DEFAULTS.host;
  const port = playerEndpoint.port || DEFAULTS.port;
  const baseUrl = playerEndpoint.baseUrl;
  const sessionUrl = scriptoriumUrl;

  const mcpEndpoint = resolveConsoleMonitorEndpoint(DEFAULTS.mcpPort);
  const mcpPort = overrides.mcpPort ?? mcpEndpoint.port;

  return {
    baseUrl,
    sessionUrl,
    host,
    port,
    mcpHost: zeusHost,
    defaultCaso: DEFAULTS.defaultCaso,
    refreshHz: DEFAULTS.refreshHz,
    restPollMs: DEFAULTS.restPollMs,
    maxEvents: DEFAULTS.maxEvents,
    tuiMaxEvents: DEFAULTS.tuiMaxEvents,
    tuiMaxServers: DEFAULTS.tuiMaxServers,
    debugServer: false,
    ...overrides,
    mcpPort: overrides.mcpPort ?? mcpPort
  };
}
