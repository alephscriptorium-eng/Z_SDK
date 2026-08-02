/**
 * Eje I — linea-system + satélite vía ProcessManager (tool-equivalent API).
 * Skip if live LINEAS registry missing (same gate as linea-system smoke).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { ProcessManager } from '../src/process-manager.mjs';
import { resolveCatalog, FALLBACK_MCP_PORTS } from '../src/catalog.mjs';
import { reservePorts } from './helpers/ports.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

function hasLiveLineas() {
  try {
    const volumesRoot =
      process.env.ZEUS_VOLUMES_ROOT || path.join(REPO_ROOT, 'VOLUMES');
    // linea-system requires lineaId "espana"; demo-only fixtures are not enough
    return existsSync(
      path.join(volumesRoot, 'DISK_02', 'LINEAS', 'espana', 'manifest.json')
    );
  } catch {
    return false;
  }
}

const SKIP =
  'No live LINEAS/espana (demo-only volume) — skip real linea-system launch; see tool-call-launch.test.mjs for eje I fixture';

// WP-U267: antes `TEST_PORTS = { espana: 14121, wp: 14122 }` fijos — los MISMOS
// que linea-system/test/resource-contract.test.mjs, es decir una colisión entre
// paquetes garantizada si ambas suites corrían a la vez.
const PREV = {
  e: process.env.ZEUS_MCP_LINEA_ESPAN,
  w: process.env.ZEUS_MCP_LINEA_WP
};

test(
  'eje I: launch linea-espana starts tronco+satelite health',
  {
    skip: hasLiveLineas() ? false : SKIP,
    timeout: 90_000
  },
  async (t) => {
    const [portEspana, portWp] = await reservePorts(2);
    process.env.ZEUS_MCP_LINEA_ESPAN = String(portEspana);
    process.env.ZEUS_MCP_LINEA_WP = String(portWp);

    const mcp = {
      ...FALLBACK_MCP_PORTS,
      lineas: { espana: portEspana, wpHistoria: portWp }
    };
    const live = resolveCatalog({ mcp }).filter((e) =>
      ['linea-espana', 'linea-wp-historia'].includes(e.id)
    );

    const manager = new ProcessManager({
      catalog: live,
      repoRoot: REPO_ROOT,
      healthTimeoutMs: 60_000,
      healthPollMs: 500
    });

    t.after(async () => {
      try {
        await manager.stop('linea-espana', { force: true });
      } catch {
        /* ignore */
      }
      if (PREV.e == null) delete process.env.ZEUS_MCP_LINEA_ESPAN;
      else process.env.ZEUS_MCP_LINEA_ESPAN = PREV.e;
      if (PREV.w == null) delete process.env.ZEUS_MCP_LINEA_WP;
      else process.env.ZEUS_MCP_LINEA_WP = PREV.w;
    });

    const launched = await manager.launch('linea-espana');
    assert.equal(launched.ok, true, JSON.stringify(launched));
    assert.ok(launched.serverIds.includes('linea-espana'));
    assert.ok(launched.serverIds.includes('linea-wp-historia'));
    assert.ok(
      launched.health.every((h) => h.ok),
      JSON.stringify(launched.health)
    );

    const health = await manager.health();
    const tronco = health.fleet.find((r) => r.id === 'linea-espana');
    const sat = health.fleet.find((r) => r.id === 'linea-wp-historia');
    assert.equal(tronco.status, 'running');
    assert.equal(sat.status, 'running');
    assert.equal(tronco.port, portEspana);
    assert.equal(sat.port, portWp);

    const stopped = await manager.stop('linea-espana');
    assert.equal(stopped.ok, true);
  }
);
