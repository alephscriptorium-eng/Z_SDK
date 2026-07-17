import { ServerRegistry } from './registry.mjs';
import { PresetStore } from './store.mjs';
import { createCatalogService } from './catalog-service.mjs';
import { syncDiscoveredServers } from '../discovery/sync.mjs';

/**
 * In-process preset runtime without HTTP: registry, store, catalog, discovery.
 *
 * @param {{
 *   dataDir: string,
 *   sources?: object | (() => object),
 *   registerMode?: 'strict' | 'safe',
 *   pruneStale?: boolean
 * }} options
 */
export function createPresetRuntime({
  dataDir,
  sources = {},
  registerMode = 'safe',
  pruneStale = false
} = {}) {
  const registry = new ServerRegistry();
  const store = new PresetStore({ dataDir });
  const catalog = createCatalogService({ registry });
  let ready = false;

  function resolveSources() {
    return typeof sources === 'function' ? sources() : sources;
  }

  async function refreshDiscovery() {
    const result = await syncDiscoveredServers(registry, resolveSources(), {
      catalog,
      pruneStale,
      registerMode
    });
    ready = true;
    return result;
  }

  function isReady() {
    return ready;
  }

  async function close() {
    await registry.close();
  }

  return {
    registry,
    store,
    catalog,
    refreshDiscovery,
    isReady,
    close
  };
}
