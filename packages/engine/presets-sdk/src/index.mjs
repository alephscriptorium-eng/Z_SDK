/**
 * Root barrel — preset/catalog, link recipes, workspace registry helpers.
 * Prefer family subpaths for env, discovery, paths, volumes, and MCP runtime:
 * `@zeus/presets-sdk/{env,discovery,paths,volumes,mcp}`.
 */

// Preset & catalog
export { MCPToolsExtractor } from './presets/extractor.mjs';
export { ServerRegistry } from './presets/registry.mjs';
export { PresetStore, validateSelectedItems, countPresetItems } from './presets/store.mjs';
export {
  sanitizeSlug,
  buildManifest,
  buildReadme,
  exportPresetBundle
} from './presets/export-bundle.mjs';
export { createPresetRoutes } from './presets/routes.mjs';
export { createPresetRuntime } from './presets/runtime.mjs';
export { createCatalogService, categorizeByName } from './presets/catalog-service.mjs';
export { applyPresetFilter } from './presets/filter.mjs';
export {
  parsePath,
  formatPath,
  getAtPath,
  getParentPath,
  listChildren,
  getSiblingPaths,
  inspectAtPath,
  buildFocusExport,
  previewValue,
  typeOfValue,
  isRootPath
} from './shared/json-path.mjs';

// Shared helpers
export { readJson } from './shared/fs-json.mjs';

// Root barrel also re-exports family subpaths (prefer @zeus/presets-sdk/{env,discovery,…})
export {
  discoverServers,
  syncDiscoveredServers,
  DEFAULT_ZEUS_DISCOVERY,
  DEFAULT_ZEUS_UI_MESH,
  resolveDiscoverySources,
  resolveUiMesh,
  buildUiHref
} from './discovery/index.mjs';
export {
  loadZeusEnv,
  resetZeusEnvLoader,
  MONOREPO_ROOT,
  resolveZeusHost,
  resolveZeusMcpPorts,
  resolveZeusUiPorts,
  resolveAppPort,
  resolvePlayerUiBaseUrl,
  resolvePlayerUiEndpoint,
  resolvePlayerDebugEndpoint,
  resolvePrensaBaseUrl,
  readEnvPort,
  resolveValidateMode,
  DEFAULT_MCP_APPROVAL_TOKEN,
  resolveMcpApprovalToken
} from './env/index.mjs';
export {
  DEFAULT_SATELITE_WP,
  normalizeSatRel,
  wikitextPath,
  nodoMetaPath,
  registroMdPath,
  registrosBrowsePath,
  buildViewDeepLink,
  toViewLinkItem,
  FIREHOSE_VOLUME_ID,
  TRIAGE_MANIFEST_PATH,
  corpusRelPath,
  buildFirehoseDeepLink,
  toFirehoseLinkItem,
  LINEAS_VOLUME_ID,
  isLineasCachePath,
  resolveLineasBasePath,
  resolveLineasVolumeRoot,
  resolveLineasVolumePath,
  resolveLineasLineFilePath,
  resolveLineasSatCacheDir,
  MEDIDOR_ETIQUETADOS_REL,
  resolveMedidorCasosPath
} from './paths/index.mjs';
export {
  loadVolumesConfig,
  resolveVolumesRoot,
  resolveVolume,
  listVolumes,
  resetVolumesCache,
  sanitizeRelativePath,
  resolveVolumePath,
  browseVolume,
  readVolumeFile
} from './volumes/index.mjs';
export {
  mountMCPRoute,
  createMcpHttpStart,
  createMcpApp,
  createStandardMcpServer,
  mountHealthRoute,
  registerCommonMCP,
  jsonContent,
  renderPromptText,
  promptMessages,
  mcpApprovalGateLine,
  getMcpCapabilities,
  buildServerCard,
  createServerCardResource,
  updateServerCard,
  SERVER_CARD_URI,
  isMainModule,
  healthUrlFor,
  runMcpMain
} from './mcp/index.mjs';
