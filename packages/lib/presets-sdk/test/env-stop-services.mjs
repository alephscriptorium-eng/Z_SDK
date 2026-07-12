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
