/**
 * Declarative fleet catalog for @zeus/mcp-launcher.
 *
 * Actuator data only (id, port, spawn, deps, capabilities).
 * Tree/lifecycle fields (`tree.*`, autoRestart, …) are reserved for Z12
 * extension — see README. Do not invent supervision semantics here.
 *
 * Ports: single source = `@zeus/presets-sdk/env` (DEFAULT_ZEUS_MCP /
 * resolveZeusMcpPorts + ZEUS_MCP_* / ZEUS_PORT_*). No local literals.
 */

import {
  DEFAULT_ZEUS_MCP,
  DEFAULT_ZEUS_UI_MESH,
  resolveZeusMcpPorts,
  resolveZeusUiPorts
} from '@zeus/presets-sdk/env';

/** @typedef {'stopped'|'starting'|'running'|'stopping'|'unhealthy'|'unknown'} RuntimeStatus */

/**
 * @typedef {object} CatalogEntry
 * @property {string} id
 * @property {string} name
 * @property {number} port
 * @property {string} [workspace] npm workspace package name
 * @property {string} [spawnGroup] shared child process key (one spawn serves many ports)
 * @property {string[]} [deps] catalog ids that should be up first
 * @property {string[]} [capabilities] RNFP / federation capability tags
 * @property {'mcp'|'service'} [kind] default 'mcp'; 'service' = HTTP/socket
 *   service without MCP surface (excluded from vscode mcp.json)
 * @property {string} [uiPort] key into resolveZeusUiPorts() when the port
 *   lives in the UI mesh block (ZEUS_PORT_*), not in DEFAULT_ZEUS_MCP
 * @property {string} [healthPath]
 * @property {string} [mcpPath]
 * @property {string} [notes]
 * @property {{ barrio?: string, edificio?: string, maquinaria?: string }} [tree]
 *   Reserved for Z12 — ignored by Z06 actuator.
 */

/** Offline/tests mirror of presets-sdk defaults (no local port literals). */
export const FALLBACK_MCP_PORTS = structuredClone(DEFAULT_ZEUS_MCP);

/** Offline/tests mirror of UI mesh defaults (no local port literals). */
export const FALLBACK_UI_PORTS = structuredClone(DEFAULT_ZEUS_UI_MESH);

async function loadEnv() {
  try {
    return await import('@zeus/presets-sdk/env');
  } catch {
    return null;
  }
}

function syncEnvPorts() {
  try {
    return resolveZeusMcpPorts();
  } catch {
    return FALLBACK_MCP_PORTS;
  }
}

function syncUiPorts() {
  try {
    return resolveZeusUiPorts();
  } catch {
    return FALLBACK_UI_PORTS;
  }
}

/**
 * Static catalog skeleton (ports filled by resolveCatalog).
 * @type {Omit<CatalogEntry, 'port'>[]}
 */
export const CATALOG_SEED = [
  {
    id: 'linea-espana',
    name: 'linea-espana',
    workspace: '@zeus/linea-system',
    spawnGroup: 'linea-system',
    deps: [],
    capabilities: ['linea.tronco', 'rnfp.linea', 'fleet.lineas'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Tronco; shares process with linea-wp-historia'
  },
  {
    id: 'linea-wp-historia',
    name: 'linea-wp-historia',
    workspace: '@zeus/linea-system',
    spawnGroup: 'linea-system',
    deps: [],
    capabilities: ['linea.satelite', 'rnfp.linea.satelite', 'fleet.lineas'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Satélite wp/historia; same spawnGroup as tronco (conectar-satelite declares shape)'
  },
  {
    id: 'solar-sun',
    name: 'solar-sun',
    workspace: '@zeus/solar-system',
    spawnGroup: 'solar-system',
    deps: [],
    capabilities: ['fleet.solar'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'solar-moon',
    name: 'solar-moon',
    workspace: '@zeus/solar-system',
    spawnGroup: 'solar-system',
    deps: [],
    capabilities: ['fleet.solar'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'solar-earth',
    name: 'solar-earth',
    workspace: '@zeus/solar-system',
    spawnGroup: 'solar-system',
    deps: [],
    capabilities: ['fleet.solar'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'forces',
    name: 'forces-disk',
    workspace: '@zeus/force-system',
    spawnGroup: 'force-system',
    deps: [],
    capabilities: ['fleet.forces'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'linea-editor',
    name: 'linea-editor',
    workspace: '@zeus/linea-editor',
    spawnGroup: 'linea-editor',
    deps: [],
    capabilities: ['linea.editor', 'fleet.lineas', 'rnfp.linea.editor'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Gated authorship MCP; sibling of linea-system (read)'
  },
  {
    id: 'ssb',
    name: 'ssb-disk',
    workspace: '@zeus/ssb-system',
    spawnGroup: 'ssb-system',
    deps: [],
    capabilities: ['fleet.ssb'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'firehose',
    name: 'linea-firehose',
    workspace: '@zeus/linea-firehose',
    spawnGroup: 'linea-firehose',
    deps: [],
    capabilities: ['fleet.firehose'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Firehose MCP port from presets-sdk env; keep clear of editor UI port'
  },
  {
    id: 'console-monitor',
    name: 'console-monitor',
    workspace: '@zeus/console-monitor',
    spawnGroup: 'console-monitor',
    deps: [],
    capabilities: ['fleet.consoleMonitor'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'arg-player-uno',
    name: 'arg-player-uno',
    workspace: null,
    spawnGroup: 'arg-player',
    deps: [],
    capabilities: ['fleet.argPlayer', 'game.delta'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Player-MCP lives in games-library; spawn via external cmd when wired'
  },
  {
    id: 'arg-player-dos',
    name: 'arg-player-dos',
    workspace: null,
    spawnGroup: 'arg-player',
    deps: [],
    capabilities: ['fleet.argPlayer', 'game.delta'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'pozo-player',
    name: 'pozo-player',
    workspace: null,
    spawnGroup: 'pozo-player',
    deps: [],
    capabilities: ['fleet.pozoPlayer', 'game.pozo'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'solve-player',
    name: 'solve-player',
    workspace: null,
    spawnGroup: 'solve-player',
    deps: [],
    capabilities: ['fleet.solvePlayer', 'game.solve'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp'
  },
  {
    id: 'launcher',
    name: 'mcp-launcher',
    workspace: '@zeus/mcp-launcher',
    spawnGroup: 'mcp-launcher',
    deps: [],
    capabilities: ['fleet.launcher', 'meta.actuator'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Actuator MCP itself; port launcher.disk (presets env). U234'
  },
  {
    id: 'socket-server',
    name: 'socket-server',
    kind: 'service',
    workspace: '@zeus/socket-server',
    spawnGroup: 'socket-server',
    deps: [],
    capabilities: ['fleet.socketServer', 'v1.zeus'],
    healthPath: '/health',
    mcpPath: '/',
    uiPort: 'scriptorium',
    notes: 'V1 Zeus substrate (Socket.IO+REST); no MCP surface. Port = ui.scriptorium (ZEUS_PORT_SCRIPTORIUM). U234'
  },
  {
    id: 'cache-browser',
    name: 'cache-browser',
    kind: 'service',
    workspace: '@zeus/cache-browser',
    spawnGroup: 'cache-browser',
    deps: [],
    capabilities: ['fleet.cacheBrowser', 'v1.zeus'],
    healthPath: '/health',
    mcpPath: '/',
    uiPort: 'view',
    notes: 'View UI over DISK_02/LINEAS; no MCP surface. Port = ui.view (ZEUS_PORT_VIEW). U234'
  },
  {
    id: 'firehose-browser',
    name: 'firehose-browser',
    kind: 'service',
    workspace: '@zeus/firehose-browser',
    spawnGroup: 'firehose-browser',
    deps: [],
    capabilities: ['fleet.firehoseBrowser', 'v1.zeus'],
    healthPath: '/health',
    mcpPath: '/',
    uiPort: 'firehose',
    notes: 'Firehose volume UI; no MCP surface. Port = ui.firehose (ZEUS_PORT_FIREHOSE). U234'
  }
];

/**
 * Map catalog id → port from resolveZeusMcpPorts().
 * @param {object} mcp
 */
function portsById(mcp) {
  return {
    'linea-espana': mcp.lineas.espana,
    'linea-wp-historia': mcp.lineas.wpHistoria,
    'linea-editor': mcp.lineaEditor?.disk ?? 4115,
    'solar-sun': mcp.solar.sun,
    'solar-moon': mcp.solar.moon,
    'solar-earth': mcp.solar.earth,
    forces: mcp.forces.disk,
    ssb: mcp.ssb.disk,
    firehose: mcp.firehose.disk,
    'console-monitor': mcp.playerDebug.monitor,
    'arg-player-uno': mcp.argPlayer.uno,
    'arg-player-dos': mcp.argPlayer.dos,
    'pozo-player': mcp.pozoPlayer.uno,
    'solve-player': mcp.solvePlayer.uno,
    launcher: mcp.launcher.disk
  };
}

function defaultRepoRoot() {
  // packages/mesh/mcp-launcher/src → monorepo root = ../../../..
  return new URL('../../../../', import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/, '$1')
    .replace(/\/$/, '')
    .replace(/\//g, process.platform === 'win32' ? '\\' : '/');
}

/** Monorepo root as resolved by this package (spawn cwd, orchestrator state). */
export function resolveRepoRoot() {
  return defaultRepoRoot();
}

/**
 * @param {{ seed?: typeof CATALOG_SEED, mcp?: object, ui?: object, host?: string }} [opts]
 * @returns {CatalogEntry[]}
 */
export function resolveCatalog(opts = {}) {
  const seed = opts.seed || CATALOG_SEED;
  const mcp = opts.mcp || syncEnvPorts();
  const ui = opts.ui || syncUiPorts();
  const host = opts.host || 'localhost';
  const ports = portsById(mcp);
  return seed.map((entry) => {
    const port = entry.uiPort ? ui[entry.uiPort]?.port : ports[entry.id];
    if (port == null) {
      throw new Error(`Catalog entry "${entry.id}" has no port mapping`);
    }
    return {
      ...entry,
      port,
      host,
      url: `http://${host}:${port}${entry.mcpPath || '/mcp'}`,
      healthUrl: `http://${host}:${port}${entry.healthPath || '/mcp/health'}`
    };
  });
}

/**
 * Live catalog using @zeus/presets-sdk/env when available.
 * @param {{ seed?: typeof CATALOG_SEED }} [opts]
 */
export async function resolveCatalogLive(opts = {}) {
  const env = await loadEnv();
  if (!env) return resolveCatalog(opts);
  return resolveCatalog({
    ...opts,
    mcp: env.resolveZeusMcpPorts(),
    ui: env.resolveZeusUiPorts(),
    host: env.resolveZeusHost()
  });
}

/**
 * @param {string} id
 * @param {CatalogEntry[]} [catalog]
 */
export function getCatalogEntry(id, catalog = resolveCatalog()) {
  const entry = catalog.find((e) => e.id === id);
  if (!entry) {
    throw new Error(
      `Unknown catalog id "${id}". Lifecycle tools only operate on the declared catalog.`
    );
  }
  return entry;
}

/**
 * Entries that share a spawnGroup (one child process).
 * @param {string} spawnGroup
 * @param {CatalogEntry[]} [catalog]
 */
export function entriesForSpawnGroup(spawnGroup, catalog = resolveCatalog()) {
  return catalog.filter((e) => e.spawnGroup === spawnGroup);
}

/**
 * Build spawn argv for a catalog entry.
 * Prefer explicit `spawnCommand`/`spawnArgs` (still catalog-declared — never from tool args).
 * Else npm workspace start.
 * @param {CatalogEntry & { spawnCommand?: string, spawnArgs?: string[] }} entry
 * @param {{ repoRoot?: string }} [opts]
 */
export function buildSpawnSpec(entry, opts = {}) {
  const repoRoot = opts.repoRoot || defaultRepoRoot();
  const spawnGroup = entry.spawnGroup || entry.id;

  if (entry.spawnCommand) {
    return {
      command: entry.spawnCommand,
      args: entry.spawnArgs || [],
      cwd: entry.cwd || repoRoot,
      spawnGroup,
      workspace: entry.workspace || null
    };
  }

  if (!entry.workspace) {
    throw new Error(
      `Catalog id "${entry.id}" has no workspace spawn (player-MCP / external). Cannot launch.`
    );
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return {
    command: npmCmd,
    args: ['run', 'start', '-w', entry.workspace],
    cwd: repoRoot,
    spawnGroup,
    workspace: entry.workspace
  };
}

/**
 * Port collision table derived from presets-sdk (documented for CA).
 * @param {object} [mcp]
 * @param {object} [ui]
 */
export function buildPortTable(mcp = syncEnvPorts(), ui = resolveZeusUiPorts()) {
  return {
    launcher: mcp.launcher.disk,
    firehose: mcp.firehose.disk,
    editorUi: ui.editor.port,
    consoleMonitor: mcp.playerDebug.monitor,
    solar: [mcp.solar.sun, mcp.solar.moon, mcp.solar.earth],
    lineas: [mcp.lineas.espana, mcp.lineas.wpHistoria],
    lineaEditor: mcp.lineaEditor?.disk ?? 4115,
    forces: mcp.forces.disk,
    ssb: mcp.ssb.disk,
    argPlayer: [mcp.argPlayer.uno, mcp.argPlayer.dos],
    pozoPlayer: mcp.pozoPlayer.uno,
    solvePlayer: mcp.solvePlayer.uno
  };
}

/** @deprecated Prefer buildPortTable(); kept as live snapshot for callers. */
export const PORT_TABLE = buildPortTable();
