import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ZEUS_STOP_SERVICES,
  resolveStopServicePorts,
  resolveStopTargets,
  resetZeusEnvLoader
} from '../src/env/index.mjs';

/** Env keys that affect stop-port resolution — cleared for hermetic defaults. */
const STOP_PORT_ENV_KEYS = [
  'ZEUS_PORT_EDITOR',
  'ZEUS_PORT_PLAYER',
  'ZEUS_PORT_VIEW',
  'ZEUS_PORT_FIREHOSE',
  'ZEUS_PORT_PLAYER_3D',
  'ZEUS_PORT_DEBUG_3D',
  'ZEUS_PORT_OPERATOR_UI',
  'ZEUS_PORT_ARG_CONSOLE',
  'ZEUS_PORT_WEBRTC_VIEWER',
  'ZEUS_PORT_OASIS_WEBRTC',
  'ZEUS_PORT_SCRIPTORIUM',
  'ZEUS_PORT_PLAYER_DEBUG',
  'ZEUS_PORT_SPEC_STUDIO',
  'ZEUS_PORT_DOCS',
  'ZEUS_PORT_INSPECTOR',
  'ZEUS_PORT_INSPECTOR_PROXY',
  'ZEUS_MCP_SUN',
  'ZEUS_MCP_MOON',
  'ZEUS_MCP_EARTH',
  'ZEUS_MCP_LINEA_ESPAN',
  'ZEUS_MCP_LINEA_WP',
  'ZEUS_MCP_FIREHOSE',
  'ZEUS_MCP_ARG_UNO',
  'ZEUS_MCP_ARG_DOS'
];

function withCleanStopPortEnv(fn) {
  resetZeusEnvLoader();
  const prev = Object.fromEntries(STOP_PORT_ENV_KEYS.map((k) => [k, process.env[k]]));
  try {
    for (const k of STOP_PORT_ENV_KEYS) delete process.env[k];
    resetZeusEnvLoader();
    return fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v == null) delete process.env[k];
      else process.env[k] = v;
    }
    resetZeusEnvLoader();
  }
}

test('resolveStopServicePorts uses canonical defaults', () => {
  withCleanStopPortEnv(() => {
    assert.deepEqual(resolveStopServicePorts('editor-ui'), [3012]);
    assert.deepEqual(resolveStopServicePorts('solar-system'), [4101, 4102, 4103]);
    assert.deepEqual(resolveStopServicePorts('asyncapi-studio'), [3210]);
    assert.deepEqual(resolveStopServicePorts('mcp-inspector'), [6274, 6277]);
    assert.deepEqual(resolveStopServicePorts('zeus-docs'), [3230]);
    assert.deepEqual(resolveStopServicePorts('operator-ui'), [3020]);
    assert.deepEqual(resolveStopServicePorts('webrtc-viewer'), [3023]);
  });
});

test('resolveStopServicePorts respects .env overrides', () => {
  resetZeusEnvLoader();
  const prev = process.env.ZEUS_PORT_EDITOR;

  try {
    process.env.ZEUS_PORT_EDITOR = '4012';
    resetZeusEnvLoader();
    assert.deepEqual(resolveStopServicePorts('editor-ui'), [4012]);
  } finally {
    if (prev == null) delete process.env.ZEUS_PORT_EDITOR;
    else process.env.ZEUS_PORT_EDITOR = prev;
    resetZeusEnvLoader();
  }
});

test('resolveStopTargets all includes zeus-docs port', () => {
  withCleanStopPortEnv(() => {
    const ports = resolveStopTargets(['all']);
    assert.ok(ports.includes(3230), 'expected zeus-docs port 3230 in all targets');
    assert.ok(ports.includes(3023), 'expected webrtc-viewer port 3023 in all targets');
  });
});

test('resolveStopTargets all deduplicates and sorts ports', () => {
  withCleanStopPortEnv(() => {
    const ports = resolveStopTargets(['all']);
    assert.deepEqual(ports, resolveStopTargets([...ZEUS_STOP_SERVICES]));
    assert.equal(ports.length, new Set(ports).size);
    assert.deepEqual([...ports].sort((a, b) => a - b), ports);
  });
});

test('resolveStopServicePorts rejects unknown service', () => {
  assert.throws(() => resolveStopServicePorts('unknown-service'), /Unknown Zeus stop service/);
});

test('los servicios de delta se resuelven a sus puertos', () => {
  withCleanStopPortEnv(() => {
    assert.deepEqual(resolveStopServicePorts('arg-console'), [3021]);
    assert.deepEqual(resolveStopServicePorts('arg-player-mcp'), [4121, 4122]);
  });
});

/**
 * Regresión: `arg-console` tenía su `case` en el switch pero faltaba en
 * ZEUS_STOP_SERVICES, así que `stop:services all` no paraba la consola ARG y el
 * mensaje de ayuda no la listaba. Un id resoluble que no está en la lista es un
 * servicio invisible: este test lo impide para todos, no solo para ARG.
 */
test('todo id resoluble está en ZEUS_STOP_SERVICES (nada invisible para "all")', () => {
  withCleanStopPortEnv(() => {
    const conocidos = ['arg-console', 'arg-player-mcp', 'webrtc-viewer', ...ZEUS_STOP_SERVICES];
    for (const id of conocidos) {
      assert.ok(
        ZEUS_STOP_SERVICES.includes(id),
        `"${id}" se resuelve pero no está en ZEUS_STOP_SERVICES: "all" lo ignoraría`
      );
      // Every listed id must resolve (no missing switch cases).
      assert.ok(resolveStopServicePorts(id).length > 0, `"${id}" no resolvió puertos`);
    }
    const todos = resolveStopTargets(['all']);
    assert.ok(todos.includes(3021), 'falta el puerto de arg-console (3021) en "all"');
    assert.ok(todos.includes(4121) && todos.includes(4122), 'faltan los MCP de jugador en "all"');
    assert.ok(todos.includes(3023), 'falta el puerto de webrtc-viewer (3023) en "all"');
  });
});
