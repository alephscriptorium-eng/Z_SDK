/**
 * Shared app config factory for Zeus UI packages.
 *
 * `APP_DEFAULTS` is optional enrichment keyed by mesh/app id — not a closed
 * whitelist. Unknown `appId`s work with `extraDefaults` + `defaultPort`
 * (port from `resolveAppPort` when the id is in the UI mesh / APP_PORT_ENV).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEME } from '@zeus/ui-kit';
import {
  resolveDiscoverySources
} from '@zeus/presets-sdk/discovery';
import { resolveLineasBasePath } from '@zeus/presets-sdk/paths';
import {
  loadZeusEnv,
  resolveAppPort,
  resolveZeusHost,
  resolveZeusUiPorts,
  resolvePlayerDebugEndpoint,
  DEFAULT_ZEUS_UI_MESH,
  DEFAULT_ZEUS_MCP
} from '@zeus/presets-sdk/env';
import { resolveScriptoriumSecret } from '@zeus/rooms';

const VOLATILE_CONFIG_KEYS = [
  'server',
  'discovery',
  'player',
  'editor',
  'view',
  'debugMonitor',
  'scriptorium'
];

const APP_DEFAULTS = {
  editor: {
    port: DEFAULT_ZEUS_UI_MESH.editor.port,
    theme: DEFAULT_THEME,
    features: { worldEditor: true, cloakExplorer: true, themeSystem: true, mcpExplorer: true },
    presets: { dataDir: '../../../data', library: 'default', autoLoad: true },
    ui: { language: 'en', animations: true, darkMode: false },
    player: {
      host: DEFAULT_ZEUS_UI_MESH.player.host,
      port: DEFAULT_ZEUS_UI_MESH.player.port
    },
    view: { host: DEFAULT_ZEUS_UI_MESH.view.host, port: DEFAULT_ZEUS_UI_MESH.view.port },
    branding: { title: 'Zeus World Editor', tag: 'Scriptorium · Mundo A' },
    localNav: [
      { href: '/', emoji: '🗺️', text: 'World', pageKey: 'home' },
      { href: '/cloaks', emoji: '🧥', text: 'Cloaks', pageKey: 'mcp' },
      { href: '/docs', emoji: '📖', text: 'API', pageKey: 'api' },
      { href: '/settings', emoji: '⚙️', text: 'Settings', pageKey: 'settings' }
    ],
    debug: false
  },
  player: {
    port: DEFAULT_ZEUS_UI_MESH.player.port,
    theme: 'Scriptorium-Skins',
    presets: { dataDir: '../../../data', library: 'default', autoLoad: true },
    editor: {
      host: DEFAULT_ZEUS_UI_MESH.editor.host,
      port: DEFAULT_ZEUS_UI_MESH.editor.port
    },
    view: { host: DEFAULT_ZEUS_UI_MESH.view.host, port: DEFAULT_ZEUS_UI_MESH.view.port },
    deck: {
      defaultYear: 2010,
      troncoRange: { min: 450, max: 2026 },
      parteCues: [
        { id: 'I', year: 450 },
        { id: 'II', year: 1350 },
        { id: 'III', year: 1808 },
        { id: 'IV', year: 1978 }
      ],
      defaultFirehosePreset: 'aleph-firehose-browse',
      firehoseDefaultCorpus: 'candidate'
    },
    aleph: {
      defaultPresets: { A: 'aleph-tronco-puro', B: 'aleph-wp-cache', C: 'aleph-firehose-browse' },
      defaultCaso: 'aeo-p24-linea',
      casos: ['aeo-p24-linea', 'aeo-tronco-caso1', 'aeo-caso2-2026'],
      theme: 'Scriptorium-Skins',
      branding: { title: 'Tablero ALEPH', tag: 'Scriptorium · Zeus SDK' }
    },
    debug: false,
    debugMonitor: { enabled: true }
  },
  view: {
    port: DEFAULT_ZEUS_UI_MESH.view.port,
    theme: DEFAULT_THEME,
    lineas: { basePath: null },
    lineaServers: { espana: { tronco: 'linea-espana', satelite: 'linea-wp-historia' } },
    defaultLinea: 'espana',
    viewers: {
      handlers: [
        { match: 'basename', value: 'fetch-priority-viaje1.json', viewer: 'anchors-explorer' },
        { match: 'basename', value: 'wave-a-anchors.json', viewer: 'anchors-explorer' },
        { match: 'ext', value: '.json', viewer: 'object-explorer' },
        { match: 'ext', value: '.md', viewer: 'markdown-preview' },
        { match: 'ext', value: '.wikitext', viewer: 'text-plain' },
        { match: 'fallback', viewer: 'text-plain' }
      ]
    },
    player: {
      host: DEFAULT_ZEUS_UI_MESH.player.host,
      port: DEFAULT_ZEUS_UI_MESH.player.port
    },
    editor: {
      host: DEFAULT_ZEUS_UI_MESH.editor.host,
      port: DEFAULT_ZEUS_UI_MESH.editor.port
    },
    branding: { title: 'Cache Explorer', tag: 'Scriptorium · Zeus SDK' },
    debug: false
  },
  firehose: {
    port: DEFAULT_ZEUS_UI_MESH.firehose.port,
    theme: DEFAULT_THEME,
    defaultCorpus: 'candidate',
    branding: { title: 'Firehose Explorer', tag: 'Scriptorium · Zeus SDK' },
    debug: false
  },
  player3d: {
    port: DEFAULT_ZEUS_UI_MESH.player3d.port,
    theme: DEFAULT_THEME,
    viewer: { sessionId: 'default', scriptoriumUrl: null },
    branding: { title: 'Visor 3D', tag: 'Scriptorium · Zeus SDK' },
    debug: false
  },
  debug3d: {
    port: DEFAULT_ZEUS_UI_MESH.debug3d.port,
    theme: DEFAULT_THEME,
    viewer: { sessionId: 'default', scriptoriumUrl: null },
    branding: { title: '3D Monitor', tag: 'Scriptorium · Zeus SDK' },
    debug: true
  },
  debug: {
    port: DEFAULT_ZEUS_MCP.playerDebug.monitor,
    theme: DEFAULT_THEME,
    debug: true
  },
  argConsole: {
    port: DEFAULT_ZEUS_UI_MESH.argConsole.port,
    theme: DEFAULT_THEME,
    branding: { title: 'ARG Console', tag: 'Scriptorium · Zeus SDK' },
    scriptorium: {
      path: DEFAULT_ZEUS_UI_MESH.scriptorium.path
    },
    debug: false
  }
};

/**
 * Strip env-derived fields before persisting config.json to disk.
 * @param {object} config
 */
export function stripVolatileConfig(config) {
  const local = structuredClone(config);
  for (const key of VOLATILE_CONFIG_KEYS) {
    delete local[key];
  }
  return local;
}

/**
 * Merge .env-derived server, discovery and cross-app refs over file config.
 * @param {object} fileConfig
 * @param {object} ctx
 * @param {string} ctx.appId
 * @param {string} ctx.packageDir
 * @param {object} ctx.appBase
 * @param {number} [ctx.defaultPort]
 */
export function resolveRuntimeConfig(fileConfig, { appId, packageDir, appBase, defaultPort }) {
  loadZeusEnv();
  const host = resolveZeusHost();
  const uis = resolveZeusUiPorts();
  const runtime = structuredClone(fileConfig);

  runtime.server = {
    ...(fileConfig.server || {}),
    host,
    port: resolveAppPort(appId, defaultPort ?? appBase.port ?? fileConfig.server?.port ?? 3000)
  };

  runtime.discovery = {
    ...resolveDiscoverySources({
      dataDir: path.join(packageDir, fileConfig.presets?.dataDir || appBase.presets?.dataDir || '../../../data'),
      localDiscovery: fileConfig.discovery || {}
    })
  };

  if (fileConfig.player || appBase.player) {
    runtime.player = { ...(fileConfig.player || {}), host, port: uis.player.port };
  }
  if (fileConfig.editor || appBase.editor) {
    runtime.editor = { ...(fileConfig.editor || {}), host, port: uis.editor.port };
  }
  if (fileConfig.view || appBase.view) {
    runtime.view = { ...(fileConfig.view || {}), host, port: uis.view.port };
  }
  if (fileConfig.debugMonitor?.enabled || appBase.debugMonitor?.enabled) {
    const debugEndpoint = resolvePlayerDebugEndpoint();
    runtime.debugMonitor = {
      ...(fileConfig.debugMonitor || appBase.debugMonitor || {}),
      baseUrl: debugEndpoint.baseUrl
    };
  }

  if (fileConfig.scriptorium || appBase.scriptorium) {
    const scr = uis.scriptorium || DEFAULT_ZEUS_UI_MESH.scriptorium;
    runtime.scriptorium = {
      ...(appBase.scriptorium || {}),
      ...(fileConfig.scriptorium || {}),
      host: scr.host,
      port: scr.port,
      path: (fileConfig.scriptorium || appBase.scriptorium || {}).path || scr.path || '/runtime',
      secret: resolveScriptoriumSecret()
    };
  }

  return runtime;
}

/**
 * @param {object} options
 * @param {string} options.appId - mesh/app id (editor | player | view | firehose |
 *   player3d | debug3d | debug | argConsole | …). Not a closed whitelist:
 *   unknown ids work with extraDefaults + defaultPort.
 * @param {number} [options.defaultPort]
 * @param {object} [options.features]
 * @param {object} [options.extraDefaults]
 * @param {string} options.importMetaUrl - import.meta.url from the app config.mjs
 * @param {string} [options.configFileName='config.json']
 */
export function createAppConfig(options) {
  const {
    appId,
    defaultPort,
    features = {},
    extraDefaults = {},
    configFileName = 'config.json',
    importMetaUrl,
    skipConfigFile = false
  } = options;

  if (!importMetaUrl) {
    throw new Error('createAppConfig requires importMetaUrl (pass import.meta.url from app config.mjs)');
  }

  const callerDir = path.dirname(fileURLToPath(importMetaUrl));
  const packageDir = path.resolve(callerDir, '..');
  const configFilePath = path.join(callerDir, configFileName);

  const appBase = APP_DEFAULTS[appId] || {};
  const themeName = appBase.theme;
  const baseFeatures = appBase.features || {};
  const restApp = Object.fromEntries(
    Object.entries(appBase).filter(([key]) => !['port', 'theme', 'features'].includes(key))
  );

  const runtimeCtx = { appId, packageDir, appBase, defaultPort };
  const baseFileConfig = {
    theme: { current: themeName || DEFAULT_THEME },
    features: { ...baseFeatures, ...features },
    ...structuredClone(restApp),
    ...extraDefaults
  };

  const DEFAULT_CONFIG = resolveRuntimeConfig(baseFileConfig, runtimeCtx);

  if (!skipConfigFile && !fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, JSON.stringify(stripVolatileConfig(baseFileConfig), null, 2));
    console.log(`Default ${appId} config.json created`);
  }

  function readFileConfig() {
    if (skipConfigFile) {
      return structuredClone(baseFileConfig);
    }
    try {
      const configData = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error reading config:', error);
      throw error;
    }
  }

  function persistFileConfig(fileConfig) {
    if (skipConfigFile) return;
    fs.writeFileSync(configFilePath, JSON.stringify(stripVolatileConfig(fileConfig), null, 2));
  }

  function getAppConfig() {
    return resolveRuntimeConfig(readFileConfig(), runtimeCtx);
  }

  function updateConfig(newConfig) {
    const fileConfig = readFileConfig();
    const merged = { ...fileConfig, ...newConfig };
    persistFileConfig(merged);
    return resolveRuntimeConfig(merged, runtimeCtx);
  }

  function setTheme(themeName) {
    const fileConfig = readFileConfig();
    fileConfig.theme = fileConfig.theme || {};
    fileConfig.theme.current = themeName;
    if (fileConfig.aleph) fileConfig.aleph.theme = themeName;
    persistFileConfig(fileConfig);
    return resolveRuntimeConfig(fileConfig, runtimeCtx);
  }

  function updateSection(section, updates) {
    const fileConfig = readFileConfig();
    const known =
      Object.prototype.hasOwnProperty.call(fileConfig, section) ||
      Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, section);
    if (!known) {
      throw new Error(`Configuration section '${section}' does not exist`);
    }
    const base = fileConfig[section] ?? DEFAULT_CONFIG[section] ?? {};
    fileConfig[section] = {
      ...(typeof base === 'object' && base !== null && !Array.isArray(base) ? base : {}),
      ...updates
    };
    persistFileConfig(fileConfig);
    return resolveRuntimeConfig(fileConfig, runtimeCtx);
  }

  function getSectionDefaults(section) {
    return DEFAULT_CONFIG[section] || {};
  }

  function resolveDataDir(config = getAppConfig()) {
    const dataDir = config.presets?.dataDir || DEFAULT_CONFIG.presets?.dataDir || '../../../data';
    return path.resolve(packageDir, dataDir);
  }

  function resolveBasePath(config = getAppConfig()) {
    const override = config.lineas?.basePath;
    if (override) {
      return path.isAbsolute(override) ? override : path.resolve(packageDir, override);
    }
    return resolveLineasBasePath();
  }

  function getViewersConfig(config = getAppConfig()) {
    return config.viewers || DEFAULT_CONFIG.viewers || { handlers: [] };
  }

  function getDefaultTheme() {
    return appBase.theme || DEFAULT_THEME;
  }

  function getLocalNavEntries(config = getAppConfig()) {
    return config.localNav || appBase.localNav || [];
  }

  return {
    packageDir,
    getAppConfig,
    getConfig: getAppConfig,
    updateConfig,
    setTheme,
    updateSection,
    getSectionDefaults,
    resolveDataDir,
    resolveBasePath,
    getViewersConfig,
    getDefaultTheme,
    getLocalNavEntries
  };
}
