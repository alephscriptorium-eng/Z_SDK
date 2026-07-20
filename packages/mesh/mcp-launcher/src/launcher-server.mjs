/**
 * @zeus/mcp-launcher — Streamable HTTP MCP server (fleet actuator).
 */

import { createStandardMcpServer, promptMessages } from '@zeus/presets-sdk/mcp';
import { ProcessManager } from './process-manager.mjs';
import { resolveCatalog, PORT_TABLE } from './catalog.mjs';
import * as tools from './tools.mjs';

export const SERVER_NAME = 'mcp-launcher';
export const SERVER_VERSION = '0.1.0';

/** Default launcher port (mesh-legacy MCPLauncher :3050). Override ZEUS_MCP_LAUNCHER. */
export function resolveLauncherPort() {
  const raw = process.env.ZEUS_MCP_LAUNCHER;
  if (raw && Number.isFinite(Number(raw))) return Number(raw);
  return PORT_TABLE.launcher;
}

function getResourceRegistry(manager) {
  return [
    {
      name: 'launcher-info',
      uri: 'launcher://info',
      title: 'Launcher info',
      mimeType: 'application/json',
      description: 'Actuator role, port table, Z12 frontier note.',
      read: () => ({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        role: 'actuator',
        frontier: {
          z06: 'launch/stop/restart/health/catalog/spawn',
          z12: 'XState lifecycle, supervision, tree rollup — not implemented here'
        },
        portTable: PORT_TABLE,
        catalogSize: manager.listCatalog().length
      })
    },
    {
      name: 'launcher-catalog',
      uri: 'launcher://catalog',
      title: 'Fleet catalog',
      mimeType: 'application/json',
      description: 'Declared fleet entries (ids, ports, spawnGroups, capabilities).',
      read: () => ({
        servers: manager.listCatalog().map((e) => ({
          id: e.id,
          name: e.name,
          port: e.port,
          workspace: e.workspace,
          spawnGroup: e.spawnGroup,
          capabilities: e.capabilities,
          tree: e.tree ?? null
        }))
      })
    },
    {
      name: 'launcher-ports',
      uri: 'launcher://ports',
      title: 'Port collision table',
      mimeType: 'application/json',
      description: 'Final port table including firehose 3008 and editor-ui 3012.',
      read: () => PORT_TABLE
    }
  ];
}

function getPromptRegistry() {
  return [
    {
      name: 'explore-launcher',
      title: 'Explore launcher',
      description: 'Onboarding: catalog → launch linea → health → stop.',
      argsSchema: {},
      render: () =>
        promptMessages(
          [
            'Explore the Zeus MCP launcher (actuator only).',
            '',
            'Steps:',
            '1. Read launcher://catalog',
            '2. health — baseline fleet',
            '3. launch_mcp_server server_id=linea-espana (also brings linea-wp-historia)',
            '4. health — both lineas running',
            '5. Optional: POST editor /api/mcp/refresh then GET /api/mcp/servers',
            '6. stop_mcp_server server_id=linea-espana',
            '',
            'Do NOT expect XState / tree supervision here (Z12).'
          ].join('\n')
        )
    },
    {
      name: 'self-check',
      title: 'Launcher self-check',
      description: 'Validate tools and catalog gate.',
      argsSchema: {},
      render: () =>
        promptMessages(
          [
            'Self-check mcp-launcher:',
            '1. generate_vscode_config → valid mcp.json',
            '2. launch unknown id → error (catalog gate)',
            '3. resolve_capability linea.satelite → linea-wp-historia',
            '4. Confirm launcher://info frontier.z12 is documented.'
          ].join('\n')
        )
    }
  ];
}

/**
 * @param {{
 *   port?: number,
 *   catalog?: ReturnType<typeof resolveCatalog>,
 *   manager?: ProcessManager,
 *   refreshEditor?: boolean,
 *   repoRoot?: string
 * }} [opts]
 */
export function createServer(opts = {}) {
  const catalog = opts.catalog || resolveCatalog();
  const manager =
    opts.manager ||
    new ProcessManager({
      catalog,
      repoRoot: opts.repoRoot
    });
  const port = opts.port ?? resolveLauncherPort();

  return createStandardMcpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
    port,
    registry: getResourceRegistry(manager),
    promptRegistry: getPromptRegistry(),
    buildMcp: (server) =>
      tools.buildMcp(server, {
        manager,
        refreshEditor: opts.refreshEditor !== false
      }),
    logLabel: SERVER_NAME,
    extraHealth: () => ({
      role: 'actuator',
      managedGroups: [...manager.byGroup.keys()],
      catalogSize: catalog.length
    }),
    getCardExamples: () => ({
      goldenPath: {
        prompt: 'explore-launcher',
        args: {},
        resolveUri: 'launcher://catalog'
      },
      sampleResolve: [
        { uri: 'launcher://info', expect: 'object with frontier' },
        { uri: 'launcher://catalog', expect: 'servers[]' },
        { uri: 'launcher://ports', expect: 'port table' }
      ],
      prompts: [
        { name: 'explore-launcher', args: {} },
        { name: 'self-check', args: {} }
      ]
    })
  });
}
