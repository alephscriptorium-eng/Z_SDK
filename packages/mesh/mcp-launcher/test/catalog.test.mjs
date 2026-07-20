/**
 * Unit tests: catalog, vscode config, capability map, catalog gate.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCatalog,
  getCatalogEntry,
  PORT_TABLE,
  CATALOG_SEED
} from '../src/catalog.mjs';
import {
  generateVscodeMcpConfig,
  isValidVscodeMcpConfig
} from '../src/vscode-config.mjs';
import { resolveCapability } from '../src/capability-map.mjs';
import { ProcessManager } from '../src/process-manager.mjs';

test('catalog includes linea tronco + satelite same spawnGroup', () => {
  const catalog = resolveCatalog();
  const tronco = catalog.find((e) => e.id === 'linea-espana');
  const sat = catalog.find((e) => e.id === 'linea-wp-historia');
  assert.ok(tronco);
  assert.ok(sat);
  assert.equal(tronco.spawnGroup, 'linea-system');
  assert.equal(sat.spawnGroup, 'linea-system');
  assert.equal(tronco.port, 4111);
  assert.equal(sat.port, 4112);
  assert.ok(sat.capabilities.includes('linea.satelite'));
});

test('port table documents firehose 3008 vs editor 3012', () => {
  assert.equal(PORT_TABLE.firehose, 3008);
  assert.equal(PORT_TABLE.editorUi, 3012);
  assert.equal(PORT_TABLE.launcher, 3050);
  assert.notEqual(PORT_TABLE.firehose, PORT_TABLE.editorUi);
});

test('generate_vscode_config is valid', () => {
  const config = generateVscodeMcpConfig(resolveCatalog());
  assert.equal(isValidVscodeMcpConfig(config), true);
  assert.ok(config.servers['linea-espana'].url.includes(':4111'));
  assert.ok(config.servers['linea-wp-historia'].url.includes(':4112'));
});

test('resolve_capability maps satelite', () => {
  const r = resolveCapability('linea.satelite');
  assert.equal(r.ok, true);
  assert.equal(r.serverId, 'linea-wp-historia');
});

test('catalog gate rejects unknown id', async () => {
  const manager = new ProcessManager({ catalog: resolveCatalog() });
  await assert.rejects(() => manager.launch('not-a-real-server'), /Unknown catalog id/);
});

test('CATALOG_SEED has no xstate / child supervision fields required', () => {
  for (const e of CATALOG_SEED) {
    assert.equal(e.autoRestart, undefined);
    // tree reserved optional — seed leaves it unset for Z12
    assert.equal(e.tree, undefined);
  }
});
