/**
 * @zeus/ciudad-lifecycle — MCP server (composition / brain).
 */

import { createStandardMcpServer, promptMessages } from '@zeus/presets-sdk/mcp';
import { DEFAULT_ZEUS_MCP, resolveZeusMcpPorts } from '@zeus/presets-sdk/env';
import { ProcessManager } from '@zeus/mcp-launcher';
import { resolveExtendedCatalog } from './catalog-extend.mjs';
import { CityLifecycleRuntime } from './runtime.mjs';
import * as tools from './tools.mjs';

export const SERVER_NAME = 'ciudad-lifecycle';
export const SERVER_VERSION = '0.1.0';

/**
 * Single source = `@zeus/presets-sdk/env` (`ciudadLifecycle.disk` +
 * ZEUS_MCP_CIUDAD_LIFECYCLE). No local literal: the catalog entry
 * `ciudad-lifecycle` (mcp-launcher/src/catalog.mjs) and this bind must not be
 * able to drift. U180 (slot added to the single source by U227).
 */
export const DEFAULT_PORT = DEFAULT_ZEUS_MCP.ciudadLifecycle.disk;

export function resolveLifecyclePort() {
  return resolveZeusMcpPorts().ciudadLifecycle.disk;
}

/**
 * @param {{
 *   port?: number,
 *   catalog?: ReturnType<typeof resolveExtendedCatalog>,
 *   manager?: ProcessManager,
 *   runtime?: CityLifecycleRuntime,
 *   barrioIds?: string[]
 * }} [opts]
 */
export function createServer(opts = {}) {
  const catalog = opts.catalog || resolveExtendedCatalog();
  const manager =
    opts.manager ||
    new ProcessManager({
      catalog,
      healthTimeoutMs: 20_000,
      healthPollMs: 300
    });
  const runtime =
    opts.runtime ||
    new CityLifecycleRuntime({
      manager,
      catalog,
      barrioIds: opts.barrioIds
    });

  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port: opts.port ?? resolveLifecyclePort(),
    buildMcp: (server) => tools.buildMcp(server, { runtime }),
    registry: [
      {
        name: 'lifecycle-info',
        uri: 'ciudad-lifecycle://info',
        title: 'Lifecycle info',
        mimeType: 'application/json',
        description: 'Brain role; Z06 is actuator.',
        read: () => ({
          name: SERVER_NAME,
          version: SERVER_VERSION,
          role: 'behavior',
          frontier: {
            z12: 'when/order/fail — XState',
            z06: 'launch/stop/health/spawn'
          },
          usesProcessSpawn: false
        })
      }
    ],
    promptRegistry: [
      {
        name: 'explore-lifecycle',
        title: 'Explore city lifecycle',
        description: 'city_start state-machine → status → stop',
        argsSchema: {},
        render: () =>
          promptMessages(
            'Use city_start on state-machine, then city_status, then city_stop. Actuation via mcp-launcher (Z06).'
          )
      }
    ],
    logLabel: SERVER_NAME,
    extraHealth: () => ({
      role: 'behavior',
      barrios: runtime.barrioIds,
      ledgerSize: runtime.ledger.length
    })
  });
}

export { CityLifecycleRuntime } from './runtime.mjs';
export { resolveExtendedCatalog, ARBOL_F1, CITY_LEAF_SEED } from './catalog-extend.mjs';
