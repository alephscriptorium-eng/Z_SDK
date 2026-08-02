/**
 * Unit tests: catalog, vscode config, capability map, catalog gate.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCatalog,
  getCatalogEntry,
  PORT_TABLE,
  buildPortTable,
  CATALOG_SEED,
  FALLBACK_MCP_PORTS,
  FALLBACK_UI_PORTS
} from '../src/catalog.mjs';
import {
  DEFAULT_ZEUS_MCP,
  DEFAULT_ZEUS_UI_MESH,
  resolveZeusUiPorts
} from '@zeus/presets-sdk/env';
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

test('U234: launcher + v1-zeus service entries resolve ports from env single source', () => {
  const catalog = resolveCatalog();
  const launcher = catalog.find((e) => e.id === 'launcher');
  assert.ok(launcher);
  assert.equal(launcher.port, 3050); // DEFAULT_ZEUS_MCP.launcher.disk
  assert.equal(launcher.workspace, '@zeus/mcp-launcher');

  const ss = catalog.find((e) => e.id === 'socket-server');
  assert.equal(ss.kind, 'service');
  assert.equal(ss.port, 3017); // DEFAULT_ZEUS_UI_MESH.scriptorium
  assert.ok(ss.healthUrl.endsWith(':3017/health'));

  assert.equal(catalog.find((e) => e.id === 'cache-browser').port, 3015); // ui.view
  assert.equal(catalog.find((e) => e.id === 'firehose-browser').port, 3016); // ui.firehose
});

test('U180: ola 1 (socket-server + ciudad-lifecycle) toma el puerto de presets-sdk/env', () => {
  const catalog = resolveCatalog();

  const ciudad = catalog.find((e) => e.id === 'ciudad-lifecycle');
  assert.ok(ciudad, 'ciudad-lifecycle debe existir en el catálogo');
  assert.equal(ciudad.workspace, '@zeus/ciudad-lifecycle');
  assert.equal(ciudad.kind, undefined); // MCP (default), no kind:service
  assert.equal(ciudad.port, DEFAULT_ZEUS_MCP.ciudadLifecycle.disk);
  assert.equal(ciudad.healthUrl, `http://localhost:${ciudad.port}/mcp/health`);
  assert.equal(ciudad.url, `http://localhost:${ciudad.port}/mcp`);

  const ss = catalog.find((e) => e.id === 'socket-server');
  assert.ok(ss, 'socket-server debe existir en el catálogo');
  assert.equal(ss.workspace, '@zeus/socket-server');
  assert.equal(ss.kind, 'service');
  assert.equal(ss.port, DEFAULT_ZEUS_UI_MESH.scriptorium.port);
  assert.equal(ss.healthUrl, `http://localhost:${ss.port}/health`);
});

test('U180: mover el puerto en la fuente única mueve la entrada (cero literales)', () => {
  const mcp = {
    ...FALLBACK_MCP_PORTS,
    ciudadLifecycle: { disk: 14051 }
  };
  const ui = {
    ...FALLBACK_UI_PORTS,
    scriptorium: { ...FALLBACK_UI_PORTS.scriptorium, port: 14017 }
  };
  const catalog = resolveCatalog({ mcp, ui });
  const ciudad = catalog.find((e) => e.id === 'ciudad-lifecycle');
  const ss = catalog.find((e) => e.id === 'socket-server');
  assert.equal(ciudad.port, 14051);
  assert.equal(ciudad.healthUrl, 'http://localhost:14051/mcp/health');
  assert.equal(ss.port, 14017);
  assert.equal(ss.healthUrl, 'http://localhost:14017/health');
});

/** U181 · las seis interfaces del motor y su slot en el UI mesh. */
const U181_UIS = [
  ['editor-ui', 'editor', '@zeus/editor-ui'],
  ['player-ui', 'player', '@zeus/player-ui'],
  ['player-3d-ui', 'player3d', '@zeus/player-3d-ui'],
  ['3d-monitor', 'debug3d', '@zeus/3d-monitor'],
  ['cache-browser', 'view', '@zeus/cache-browser'],
  ['firehose-browser', 'firehose', '@zeus/firehose-browser']
];

test('U181: las seis UIs arrancan desde catálogo con puerto de presets-sdk/env', () => {
  const catalog = resolveCatalog();
  // Contra la RESOLUCIÓN, no contra el defecto crudo: con un ZEUS_PORT_* puesto
  // en el entorno (justo lo que pide la reproducción del reporte) el defecto ya
  // no es el valor vigente, y comparar contra él pondría el test rojo sin que
  // nada esté mal.
  const ui = resolveZeusUiPorts();
  for (const [id, uiKey, workspace] of U181_UIS) {
    const entry = catalog.find((e) => e.id === id);
    assert.ok(entry, `${id} debe existir en el catálogo`);
    assert.equal(entry.workspace, workspace);
    assert.equal(entry.kind, 'service'); // UI HTTP, sin superficie MCP
    assert.equal(entry.uiPort, uiKey);
    assert.equal(entry.port, ui[uiKey].port);
    assert.equal(entry.healthUrl, `http://localhost:${entry.port}/health`);
  }
});

test('U181: mover el puerto en la fuente única mueve las seis (cero literales)', () => {
  // Puertos raros: si alguna entrada llevara un literal propio, no se movería.
  const raros = {
    editor: 14012,
    player: 14013,
    view: 14015,
    firehose: 14016,
    player3d: 14018,
    debug3d: 14019
  };
  const ui = structuredClone(FALLBACK_UI_PORTS);
  for (const [k, port] of Object.entries(raros)) ui[k] = { ...ui[k], port };

  const catalog = resolveCatalog({ mcp: FALLBACK_MCP_PORTS, ui });
  for (const [id, uiKey] of U181_UIS) {
    const entry = catalog.find((e) => e.id === id);
    assert.equal(entry.port, raros[uiKey], `${id} no siguió a la fuente única`);
    assert.equal(entry.healthUrl, `http://localhost:${raros[uiKey]}/health`);
  }
});

test('U181: las seis UIs no colisionan de puerto entre sí ni con el resto', () => {
  const catalog = resolveCatalog();
  const porPuerto = new Map();
  for (const e of catalog) {
    // spawnGroup compartido = un proceso sirve varios puertos; el choque real
    // es entre entradas de grupos distintos.
    const grupo = e.spawnGroup || e.id;
    const previo = porPuerto.get(e.port);
    assert.ok(
      !previo || previo === grupo,
      `puerto ${e.port} compartido por grupos distintos: ${previo} y ${grupo}`
    );
    porPuerto.set(e.port, grupo);
  }
  // buildPortTable() se recalcula aquí; PORT_TABLE es una instantánea
  // congelada en el import (catalog.mjs, @deprecated) y no serviría.
  const table = buildPortTable();
  const ui = resolveZeusUiPorts();
  assert.equal(table.playerUi, ui.player.port);
  assert.equal(table.player3dUi, ui.player3d.port);
  assert.equal(table.monitor3dUi, ui.debug3d.port);
  assert.equal(table.cacheBrowserUi, ui.view.port);
  assert.equal(table.firehoseBrowserUi, ui.firehose.port);
  // El MCP firehose y la UI firehose son piezas distintas con puertos distintos
  // (3008 vs 3016) y variables distintas: ZEUS_MCP_FIREHOSE mueve el MCP,
  // ZEUS_PORT_FIREHOSE mueve la UI. Confundirlas movería otro servicio, así que
  // este assert cierra esa confusión, no adorna.
  assert.notEqual(table.firehose, table.firehoseBrowserUi);
});

test('U234: vscode config excludes kind:service, includes launcher MCP', () => {
  const config = generateVscodeMcpConfig(resolveCatalog());
  assert.equal(isValidVscodeMcpConfig(config), true);
  assert.ok(config.servers.launcher);
  assert.ok(config.servers['ciudad-lifecycle']); // U180: MCP, sí entra
  assert.equal(config.servers['socket-server'], undefined);
  assert.equal(config.servers['cache-browser'], undefined);
  assert.equal(config.servers['firehose-browser'], undefined);
  // U181: las cuatro nuevas son kind:'service' — tampoco entran en mcp.json
  assert.equal(config.servers['editor-ui'], undefined);
  assert.equal(config.servers['player-ui'], undefined);
  assert.equal(config.servers['player-3d-ui'], undefined);
  assert.equal(config.servers['3d-monitor'], undefined);
});
