import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ZEUS_STOP_SERVICES,
  resolveStopServicePorts,
  resolveStopTargets,
  resetZeusEnvLoader
} from '../src/env/index.mjs';

test('resolveStopServicePorts uses canonical defaults', () => {
  resetZeusEnvLoader();
  const prev = {
    editor: process.env.ZEUS_PORT_EDITOR,
    sun: process.env.ZEUS_MCP_SUN,
    studio: process.env.ZEUS_PORT_SPEC_STUDIO,
    docs: process.env.ZEUS_PORT_DOCS,
    inspector: process.env.ZEUS_PORT_INSPECTOR,
    inspectorProxy: process.env.ZEUS_PORT_INSPECTOR_PROXY
  };

  try {
    delete process.env.ZEUS_PORT_EDITOR;
    delete process.env.ZEUS_MCP_SUN;
    delete process.env.ZEUS_PORT_SPEC_STUDIO;
    delete process.env.ZEUS_PORT_DOCS;
    delete process.env.ZEUS_PORT_INSPECTOR;
    delete process.env.ZEUS_PORT_INSPECTOR_PROXY;
    resetZeusEnvLoader();

    assert.deepEqual(resolveStopServicePorts('editor-ui'), [3012]);
    assert.deepEqual(resolveStopServicePorts('solar-system'), [4101, 4102, 4103]);
    assert.deepEqual(resolveStopServicePorts('asyncapi-studio'), [3210]);
    assert.deepEqual(resolveStopServicePorts('mcp-inspector'), [6274, 6277]);
    assert.deepEqual(resolveStopServicePorts('zeus-docs'), [3230]);
    assert.deepEqual(resolveStopServicePorts('operator-ui'), [3020]);
  } finally {
    for (const [key, val] of Object.entries(prev)) {
      const envKey =
        key === 'editor'
          ? 'ZEUS_PORT_EDITOR'
          : key === 'sun'
            ? 'ZEUS_MCP_SUN'
            : key === 'docs'
              ? 'ZEUS_PORT_DOCS'
              : key === 'inspector'
                ? 'ZEUS_PORT_INSPECTOR'
                : key === 'inspectorProxy'
                  ? 'ZEUS_PORT_INSPECTOR_PROXY'
                  : 'ZEUS_PORT_SPEC_STUDIO';
      if (val == null) delete process.env[envKey];
      else process.env[envKey] = val;
    }
    resetZeusEnvLoader();
  }
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
  resetZeusEnvLoader();
  const prev = process.env.ZEUS_PORT_DOCS;

  try {
    delete process.env.ZEUS_PORT_DOCS;
    resetZeusEnvLoader();
    const ports = resolveStopTargets(['all']);
    assert.ok(ports.includes(3230), 'expected zeus-docs port 3230 in all targets');
  } finally {
    if (prev == null) delete process.env.ZEUS_PORT_DOCS;
    else process.env.ZEUS_PORT_DOCS = prev;
    resetZeusEnvLoader();
  }
});

test('resolveStopTargets all deduplicates and sorts ports', () => {
  resetZeusEnvLoader();
  const ports = resolveStopTargets(['all']);
  assert.deepEqual(ports, resolveStopTargets([...ZEUS_STOP_SERVICES]));
  assert.equal(ports.length, new Set(ports).size);
  assert.deepEqual([...ports].sort((a, b) => a - b), ports);
});

test('resolveStopServicePorts rejects unknown service', () => {
  assert.throws(() => resolveStopServicePorts('unknown-service'), /Unknown Zeus stop service/);
});

test('los servicios de delta se resuelven a sus puertos', () => {
  resetZeusEnvLoader();
  const prev = { console: process.env.ZEUS_PORT_ARG_CONSOLE, uno: process.env.ZEUS_MCP_ARG_UNO, dos: process.env.ZEUS_MCP_ARG_DOS };
  try {
    delete process.env.ZEUS_PORT_ARG_CONSOLE;
    delete process.env.ZEUS_MCP_ARG_UNO;
    delete process.env.ZEUS_MCP_ARG_DOS;
    resetZeusEnvLoader();
    assert.deepEqual(resolveStopServicePorts('arg-console'), [3021]);
    assert.deepEqual(resolveStopServicePorts('arg-player-mcp'), [4121, 4122]);
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      const key = k === 'console' ? 'ZEUS_PORT_ARG_CONSOLE' : k === 'uno' ? 'ZEUS_MCP_ARG_UNO' : 'ZEUS_MCP_ARG_DOS';
      if (v == null) delete process.env[key];
      else process.env[key] = v;
    }
    resetZeusEnvLoader();
  }
});

/**
 * Regresión: `arg-console` tenía su `case` en el switch pero faltaba en
 * ZEUS_STOP_SERVICES, así que `stop:services all` no paraba la consola ARG y el
 * mensaje de ayuda no la listaba. Un id resoluble que no está en la lista es un
 * servicio invisible: este test lo impide para todos, no solo para ARG.
 */
test('todo id resoluble está en ZEUS_STOP_SERVICES (nada invisible para "all")', () => {
  resetZeusEnvLoader();
  const conocidos = ['arg-console', 'arg-player-mcp', ...ZEUS_STOP_SERVICES];
  for (const id of conocidos) {
    assert.ok(
      ZEUS_STOP_SERVICES.includes(id),
      `"${id}" se resuelve pero no está en ZEUS_STOP_SERVICES: "all" lo ignoraría`
    );
  }
  const todos = resolveStopTargets(['all']);
  assert.ok(todos.includes(3021), 'falta el puerto de arg-console (3021) en "all"');
  assert.ok(todos.includes(4121) && todos.includes(4122), 'faltan los MCP de jugador en "all"');
});
