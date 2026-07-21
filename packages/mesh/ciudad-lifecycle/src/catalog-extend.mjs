/**
 * Extend Z06 fleet catalog with tree fields + f1 city leaves (3 barrios).
 * Does not reimplement spawn — entries are consumed by ProcessManager.
 */

import { CATALOG_SEED, resolveCatalog } from '@zeus/mcp-launcher/catalog';

/** Seed maquinarias for the three f1 barrios (content; links to catalog ids). */
export const ARBOL_F1 = {
  barrios: {
    'state-machine': {
      distrito: 'runtime-mcp',
      estado: 'latente',
      edificios: [{ id: 'state-machine-server', tipo: 'local' }],
      maquinarias: {
        'state-machine-server': {
          catalogId: 'state-machine-server',
          cmd: 'fixture-or-external',
          puerto: 3004,
          health: '/mcp/health',
          autoRestart: true,
          deps: [],
          barrio: 'state-machine',
          edificio: 'state-machine-server'
        }
      }
    },
    'prolog-editor': {
      distrito: 'editores',
      estado: 'latente',
      edificios: [{ id: 'prolog-editor', tipo: 'local' }],
      maquinarias: {
        'prolog-ui': {
          catalogId: 'prolog-ui',
          cmd: 'external',
          puerto: 5001,
          health: '/',
          autoRestart: true,
          deps: ['prolog-backend'],
          barrio: 'prolog-editor',
          edificio: 'prolog-editor'
        },
        'prolog-backend': {
          catalogId: 'prolog-backend',
          cmd: 'external',
          puerto: 8000,
          health: '/health',
          autoRestart: true,
          deps: [],
          barrio: 'prolog-editor',
          edificio: 'prolog-editor'
        },
        'prolog-mcp': {
          catalogId: 'prolog-mcp',
          cmd: 'external',
          puerto: 3006,
          health: '/mcp/health',
          autoRestart: true,
          deps: ['prolog-backend'],
          barrio: 'prolog-editor',
          edificio: 'prolog-editor'
        }
      }
    },
    'aaia-gallery': {
      distrito: 'runtime-mcp',
      estado: 'latente',
      edificios: [{ id: 'aaia-editor', tipo: 'local' }],
      maquinarias: {
        'aaia-mcp-server': {
          catalogId: 'aaia-mcp-server',
          cmd: 'external',
          puerto: 3007,
          health: '/mcp/health',
          autoRestart: true,
          deps: ['aaia-backend'],
          barrio: 'aaia-gallery',
          edificio: 'aaia-editor'
        },
        'aaia-backend': {
          catalogId: 'aaia-backend',
          cmd: 'external',
          puerto: 8007,
          health: '/health',
          autoRestart: true,
          deps: [],
          barrio: 'aaia-gallery',
          edificio: 'aaia-editor'
        }
      }
    }
  }
};

/** Tree-extended catalog entries (actuator data + tree.* for Z12). */
export const CITY_LEAF_SEED = [
  {
    id: 'state-machine-server',
    name: 'state-machine-server',
    workspace: null,
    spawnGroup: 'state-machine-server',
    deps: [],
    capabilities: ['city.state-machine'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    notes: 'Barrio StateMachine — 1 maquinaria (e2e f1)',
    tree: {
      barrio: 'state-machine',
      edificio: 'state-machine-server',
      maquinaria: 'state-machine-server'
    },
    autoRestart: true,
    portHint: 3004
  },
  {
    id: 'prolog-backend',
    name: 'prolog-backend',
    workspace: null,
    spawnGroup: 'prolog-backend',
    deps: [],
    capabilities: ['city.prolog'],
    healthPath: '/health',
    mcpPath: '/',
    tree: {
      barrio: 'prolog-editor',
      edificio: 'prolog-editor',
      maquinaria: 'prolog-backend'
    },
    autoRestart: true,
    portHint: 8000
  },
  {
    id: 'prolog-ui',
    name: 'prolog-ui',
    workspace: null,
    spawnGroup: 'prolog-ui',
    deps: ['prolog-backend'],
    capabilities: ['city.prolog'],
    healthPath: '/',
    mcpPath: '/',
    tree: {
      barrio: 'prolog-editor',
      edificio: 'prolog-editor',
      maquinaria: 'prolog-ui'
    },
    autoRestart: true,
    portHint: 5001
  },
  {
    id: 'prolog-mcp',
    name: 'prolog-mcp',
    workspace: null,
    spawnGroup: 'prolog-mcp',
    deps: ['prolog-backend'],
    capabilities: ['city.prolog'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    tree: {
      barrio: 'prolog-editor',
      edificio: 'prolog-editor',
      maquinaria: 'prolog-mcp'
    },
    autoRestart: true,
    portHint: 3006
  },
  {
    id: 'aaia-backend',
    name: 'aaia-backend',
    workspace: null,
    spawnGroup: 'aaia-backend',
    deps: [],
    capabilities: ['city.aaia'],
    healthPath: '/health',
    mcpPath: '/',
    tree: {
      barrio: 'aaia-gallery',
      edificio: 'aaia-editor',
      maquinaria: 'aaia-backend'
    },
    autoRestart: true,
    portHint: 8007
  },
  {
    id: 'aaia-mcp-server',
    name: 'aaia-mcp-server',
    workspace: null,
    spawnGroup: 'aaia-mcp-server',
    deps: ['aaia-backend'],
    capabilities: ['city.aaia'],
    healthPath: '/mcp/health',
    mcpPath: '/mcp',
    tree: {
      barrio: 'aaia-gallery',
      edificio: 'aaia-editor',
      maquinaria: 'aaia-mcp-server'
    },
    autoRestart: true,
    portHint: 3007
  }
];

/**
 * Annotate fleet seed with tree where known; append city leaves.
 * Port mapping for city leaves uses portHint (not presets fleet map).
 */
export function extendCatalogSeed(fleetSeed = CATALOG_SEED) {
  const fleetWithTree = fleetSeed.map((e) => {
    if (e.id === 'linea-espana') {
      return {
        ...e,
        tree: { barrio: 'mcp-gallery', edificio: 'mcp-presets', maquinaria: e.id }
      };
    }
    return e;
  });
  return [...fleetWithTree, ...CITY_LEAF_SEED];
}

/**
 * Resolve a runnable catalog: fleet ports via launcher + city ports from portHint.
 * @param {{
 *   mcp?: object,
 *   host?: string,
 *   overlays?: Record<string, Partial<import('@zeus/mcp-launcher').CatalogEntry>>
 * }} [opts]
 */
export function resolveExtendedCatalog(opts = {}) {
  const host = opts.host || 'localhost';
  const fleet = resolveCatalog({
    seed: CATALOG_SEED,
    mcp: opts.mcp,
    host
  });

  const city = CITY_LEAF_SEED.map((entry) => {
    const port = entry.portHint;
    const overlay = opts.overlays?.[entry.id] || {};
    const healthPath = overlay.healthPath || entry.healthPath || '/mcp/health';
    const mcpPath = overlay.mcpPath || entry.mcpPath || '/mcp';
    return {
      ...entry,
      ...overlay,
      port,
      host,
      url: `http://${host}:${port}${mcpPath}`,
      healthUrl: `http://${host}:${port}${healthPath}`,
      tree: entry.tree
    };
  });

  return [...fleet, ...city];
}

/**
 * Catalog ids belonging to a barrio (tree.barrio).
 * @param {string} barrioId
 * @param {ReturnType<typeof resolveExtendedCatalog>} catalog
 */
export function catalogIdsForBarrio(barrioId, catalog) {
  return catalog.filter((e) => e.tree?.barrio === barrioId).map((e) => e.id);
}
