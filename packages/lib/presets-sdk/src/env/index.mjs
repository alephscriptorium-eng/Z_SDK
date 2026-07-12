/**
 * Zeus environment: root .env loader + host/port resolution.
 * Defaults and their ZEUS_* override vars are declared inline below;
 * a new server or port change is a one-line edit here.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const MONOREPO_ROOT = join(__dirname, '../../../../..');

let _loaded = false;

/**
 * Load .env from the monorepo root once per process.
 * @param {string} [repoRoot] — override monorepo root (tests).
 */
export function loadZeusEnv(repoRoot = MONOREPO_ROOT) {
  if (_loaded) return;
  _loaded = true;
  const envPath = join(repoRoot, '.env');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

/** Reset loader state (tests only). */
export function resetZeusEnvLoader() {
  _loaded = false;
}

/** MCP default ports, `{ group: { key: port } }`. */
export const DEFAULT_ZEUS_MCP = {
  solar: { sun: 4101, moon: 4102, earth: 4103 },
  lineas: { espana: 4111, wpHistoria: 4112 },
  firehose: { disk: 3008 },
  playerDebug: { monitor: 3014 }
};

/** `group.key` → ZEUS_* override var. */
const MCP_PORT_ENV = {
  'solar.sun': 'ZEUS_MCP_SUN',
  'solar.moon': 'ZEUS_MCP_MOON',
  'solar.earth': 'ZEUS_MCP_EARTH',
  'lineas.espana': 'ZEUS_MCP_LINEA_ESPAN',
  'lineas.wpHistoria': 'ZEUS_MCP_LINEA_WP',
  'firehose.disk': 'ZEUS_MCP_FIREHOSE',
  'playerDebug.monitor': 'ZEUS_PORT_PLAYER_DEBUG'
};

/** UI mesh defaults. */
export const DEFAULT_ZEUS_UI_MESH = {
  editor: { host: 'localhost', port: 3012, path: '/', label: 'Editor', emoji: '🔧' },
  player: { host: 'localhost', port: 3013, path: '/', label: 'Tablero', emoji: '🎛️' },
  view: { host: 'localhost', port: 3015, path: '/', label: 'Cache', emoji: '📂' },
  firehose: { host: 'localhost', port: 3016, path: '/', label: 'Firehose', emoji: '🔥' },
  player3d: { host: 'localhost', port: 3018, path: '/', label: 'Visor 3D', emoji: '🧊' },
  debug3d: { host: 'localhost', port: 3019, path: '/', label: 'Debug 3D', emoji: '🛰️' },
  operator: { host: 'localhost', port: 3020, path: '/', label: 'Operador', emoji: '🎛️' },
  scriptorium: { host: 'localhost', port: 3017, path: '/runtime', label: 'Scriptorium', emoji: '📜' }
};

/** UI id → ZEUS_* override var. */
const UI_PORT_ENV = {
  editor: 'ZEUS_PORT_EDITOR',
  player: 'ZEUS_PORT_PLAYER',
  view: 'ZEUS_PORT_VIEW',
  firehose: 'ZEUS_PORT_FIREHOSE',
  player3d: 'ZEUS_PORT_PLAYER_3D',
  debug3d: 'ZEUS_PORT_DEBUG_3D',
  operator: 'ZEUS_PORT_OPERATOR_UI',
  scriptorium: 'ZEUS_PORT_SCRIPTORIUM'
};

/** App id → override var (UI slots plus the debug MCP HTTP port). */
const APP_PORT_ENV = { ...UI_PORT_ENV, debug: 'ZEUS_PORT_PLAYER_DEBUG' };

/** Spec tooling defaults (AsyncAPI Studio + VitePress docs + MCP Inspector). */
export const DEFAULT_SPEC_TOOL_PORTS = {
  studio: 3210,
  docs: 3230,
  inspector: 6274,
  inspectorProxy: 6277
};

const SPEC_TOOL_PORT_ENV = {
  studio: 'ZEUS_PORT_SPEC_STUDIO',
  docs: 'ZEUS_PORT_DOCS',
  inspector: 'ZEUS_PORT_INSPECTOR',
  inspectorProxy: 'ZEUS_PORT_INSPECTOR_PROXY'
};

/**
 * Contract validation mode env vars:
 * - ZEUS_VALIDATE — master default (`enforce`; also `off`, `warn`, `0`/`false`, `1`/`true`)
 * - ZEUS_HTTP_VALIDATE — REST override (falls back to ZEUS_VALIDATE)
 * - ZEUS_SOCKET_VALIDATE — Socket.IO session override (falls back to ZEUS_VALIDATE)
 */

const VALIDATE_MODE_ENV = {
  http: 'ZEUS_HTTP_VALIDATE',
  socket: 'ZEUS_SOCKET_VALIDATE'
};

/**
 * @param {string} [raw]
 * @returns {'off'|'warn'|'enforce'}
 */
function normalizeValidateMode(raw) {
  const mode = raw ?? 'enforce';
  if (mode === 'off' || mode === 'false' || mode === '0') return 'off';
  if (mode === 'enforce' || mode === 'true' || mode === '1') return 'enforce';
  return 'warn';
}

/**
 * Resolve contract validation mode for REST or Socket.IO session.
 * @param {'http'|'socket'} [scope]
 * @returns {'off'|'warn'|'enforce'}
 */
export function resolveValidateMode(scope) {
  loadZeusEnv();
  const master = process.env.ZEUS_VALIDATE;
  if (!scope) return normalizeValidateMode(master);
  const scoped = process.env[VALIDATE_MODE_ENV[scope]];
  return normalizeValidateMode(scoped ?? master);
}

/**
 * @param {string} name
 * @param {number} fallback
 */
export function readEnvPort(name, fallback) {
  loadZeusEnv();
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function resolveZeusHost(fallback = 'localhost') {
  loadZeusEnv();
  return process.env.ZEUS_HOST || fallback;
}

/**
 * Apply ZEUS_* port overrides to an MCP ports block.
 * @param {object} mcp — `{ group: { key: port } }`
 * @param {string} [host]
 */
export function applyEnvToMcp(mcp, host) {
  const out = structuredClone(mcp);
  for (const [mcpPath, envKey] of Object.entries(MCP_PORT_ENV)) {
    const [group, key] = mcpPath.split('.');
    if (out[group]?.[key] != null) {
      out[group][key] = readEnvPort(envKey, out[group][key]);
    }
  }
  return { host: resolveZeusHost(host || 'localhost'), mcp: out };
}

/**
 * Apply ZEUS_HOST + ZEUS_PORT_* overrides to a UI mesh record.
 * @param {object} uis
 * @param {string} [host]
 */
export function applyEnvToUis(uis, host) {
  const out = structuredClone(uis);
  const resolvedHost = resolveZeusHost(host || 'localhost');
  for (const [uiId, envKey] of Object.entries(UI_PORT_ENV)) {
    if (!out[uiId]) continue;
    out[uiId].host = resolvedHost;
    out[uiId].port = readEnvPort(envKey, out[uiId].port);
  }
  return out;
}

/**
 * @param {string} host
 * @param {object} mcp
 * @param {{ excludeGroups?: string[] }} [opts]
 */
export function mcpToUrls(host, mcp, opts = {}) {
  const exclude = new Set(opts.excludeGroups || []);
  const urls = [];
  for (const [group, ports] of Object.entries(mcp || {})) {
    if (exclude.has(group)) continue;
    for (const port of Object.values(ports)) {
      if (typeof port === 'number') urls.push(`http://${host}:${port}`);
    }
  }
  return urls.sort((a, b) => Number(a.split(':').pop()) - Number(b.split(':').pop()));
}

/** MCP catalog probe URLs — excludes infra-only groups (e.g. player-ui-debug monitor). */
export function mcpToDiscoveryUrls(host, mcp) {
  return mcpToUrls(host, mcp, { excludeGroups: ['playerDebug'] });
}

/**
 * @param {object} [baseMcp]
 */
export function resolveZeusMcpPorts(baseMcp = DEFAULT_ZEUS_MCP) {
  return applyEnvToMcp(baseMcp).mcp;
}

/**
 * @param {object} [baseUis]
 */
export function resolveZeusUiPorts(baseUis = DEFAULT_ZEUS_UI_MESH) {
  return applyEnvToUis(baseUis);
}

/**
 * @param {string} appId
 * @param {number} fallback
 */
export function resolveAppPort(appId, fallback) {
  const envKey = APP_PORT_ENV[appId];
  return envKey ? readEnvPort(envKey, fallback) : fallback;
}

/**
 * Player-ui host/port/baseUrl from ZEUS_* env.
 */
export function resolvePlayerUiEndpoint(fallbackPort = DEFAULT_ZEUS_UI_MESH.player.port) {
  const host = resolveZeusHost();
  const port = readEnvPort('ZEUS_PORT_PLAYER', fallbackPort);
  return { baseUrl: `http://${host}:${port}`, host, port };
}

/**
 * Player-ui base URL from ZEUS_HOST + ZEUS_PORT_PLAYER.
 */
export function resolvePlayerUiBaseUrl() {
  return resolvePlayerUiEndpoint().baseUrl;
}

/**
 * player-ui-debug MCP monitor host/port/baseUrl from ZEUS_* env.
 */
export function resolvePlayerDebugEndpoint(
  fallbackPort = DEFAULT_ZEUS_MCP.playerDebug.monitor
) {
  const host = resolveZeusHost();
  const port = readEnvPort('ZEUS_PORT_PLAYER_DEBUG', fallbackPort);
  return { baseUrl: `http://${host}:${port}`, host, port };
}

/**
 * Prensa API base URL from ZEUS_PRENSA_BASE_URL (optional).
 */
export function resolvePrensaBaseUrl(fallback = 'http://localhost:8080/prensa/caso') {
  loadZeusEnv();
  const raw = process.env.ZEUS_PRENSA_BASE_URL;
  if (raw == null || raw === '') return fallback;
  return String(raw).replace(/\/$/, '');
}

/**
 * Spec tooling ports from ZEUS_PORT_SPEC_STUDIO / ZEUS_PORT_DOCS / inspector env.
 * @param {object} [base]
 * @returns {{ studio: number, docs: number, inspector: number, inspectorProxy: number }}
 */
export function resolveSpecToolPorts(base = DEFAULT_SPEC_TOOL_PORTS) {
  return {
    studio: readEnvPort(SPEC_TOOL_PORT_ENV.studio, base.studio),
    docs: readEnvPort(SPEC_TOOL_PORT_ENV.docs, base.docs),
    inspector: readEnvPort(SPEC_TOOL_PORT_ENV.inspector, base.inspector),
    inspectorProxy: readEnvPort(SPEC_TOOL_PORT_ENV.inspectorProxy, base.inspectorProxy)
  };
}

/** Resolved spec tooling ports (AsyncAPI Studio + VitePress docs + MCP Inspector). */
export const SPEC_TOOL_PORTS = resolveSpecToolPorts();

/**
 * MCP Inspector UI + proxy ports and auth token from env.
 * @returns {{ host: string, uiPort: number, proxyPort: number, token: string }}
 */
export function resolveInspectorEndpoint() {
  loadZeusEnv();
  const { inspector, inspectorProxy } = resolveSpecToolPorts();
  return {
    host: resolveZeusHost(),
    uiPort: inspector,
    proxyPort: inspectorProxy,
    token: process.env.ZEUS_INSPECTOR_TOKEN || 'zeus-dev-inspector'
  };
}

/** Default human-approval token for MCP mutation prompts. */
export const DEFAULT_MCP_APPROVAL_TOKEN = 'APROBAR';

/**
 * Human-approval token for MCP mutation prompts (human-in-the-loop).
 * Override via ZEUS_MCP_APPROVAL_TOKEN in root .env.
 */
export function resolveMcpApprovalToken() {
  loadZeusEnv();
  const raw = process.env.ZEUS_MCP_APPROVAL_TOKEN;
  if (raw == null || raw === '') return DEFAULT_MCP_APPROVAL_TOKEN;
  return String(raw);
}

/**
 * Optional comma-separated extra MCP base URLs for catalog discovery
 * (merged after env defaults and data/zeus-discovery.json).
 * @returns {string[]}
 */
export function resolveExtraDiscoveryUrls() {
  loadZeusEnv();
  const raw = process.env.ZEUS_DISCOVERY_URLS;
  if (raw == null || raw === '') return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Deep-link URL for MCP Inspector UI connected to a Streamable HTTP MCP server.
 * @param {string} mcpUrl — full MCP endpoint (e.g. http://localhost:4101/mcp)
 */
export function buildInspectorUrl(mcpUrl) {
  const { host, uiPort, token } = resolveInspectorEndpoint();
  const params = new URLSearchParams({
    transport: 'streamable-http',
    serverUrl: mcpUrl,
    MCP_PROXY_AUTH_TOKEN: token
  });
  return `http://${host}:${uiPort}/?${params.toString()}`;
}

/**
 * Service ids for stop tooling (match VS Code Stop ■ task names).
 * @type {readonly string[]}
 */
export const ZEUS_STOP_SERVICES = [
  'solar-system',
  'lineas',
  'editor-ui',
  'player-ui',
  'console-monitor',
  'cache-browser',
  'firehose-mcp',
  'firehose-browser',
  'player-3d-ui',
  'player-debug-3d-ui',
  'operator-ui',
  'asyncapi-studio',
  'mcp-inspector',
  'zeus-docs',
  'socket-server'
];

/**
 * Resolve listening port(s) for a Zeus stop service id.
 * @param {string} serviceId
 * @returns {number[]}
 */
export function resolveStopServicePorts(serviceId) {
  if (serviceId === 'all') {
    return resolveStopTargets([...ZEUS_STOP_SERVICES]);
  }

  loadZeusEnv();
  const mcp = resolveZeusMcpPorts();
  const ui = resolveZeusUiPorts();
  const spec = resolveSpecToolPorts();

  switch (serviceId) {
    case 'solar-system':
      return Object.values(mcp.solar);
    case 'lineas':
      return Object.values(mcp.lineas);
    case 'firehose-mcp':
      return [mcp.firehose.disk];
    case 'console-monitor':
      return [mcp.playerDebug.monitor];
    case 'editor-ui':
      return [ui.editor.port];
    case 'player-ui':
      return [ui.player.port];
    case 'cache-browser':
      return [ui.view.port];
    case 'firehose-browser':
      return [ui.firehose.port];
    case 'player-3d-ui':
      return [ui.player3d.port];
    case 'player-debug-3d-ui':
      return [ui.debug3d.port];
    case 'operator-ui':
      return [ui.operator.port];
    case 'socket-server':
      return [ui.scriptorium.port];
    case 'asyncapi-studio':
      return [spec.studio];
    case 'mcp-inspector':
      return [spec.inspector, spec.inspectorProxy];
    case 'zeus-docs':
      return [spec.docs];
    default:
      throw new Error(`Unknown Zeus stop service: ${serviceId}`);
  }
}

/**
 * Resolve unique sorted ports for one or more stop service ids.
 * @param {string[]} serviceIds
 * @returns {number[]}
 */
export function resolveStopTargets(serviceIds) {
  const ports = new Set();
  for (const id of serviceIds) {
    for (const port of resolveStopServicePorts(id)) {
      ports.add(port);
    }
  }
  return [...ports].sort((a, b) => a - b);
}

export { openBrowser } from '../shared/open-browser.mjs';
