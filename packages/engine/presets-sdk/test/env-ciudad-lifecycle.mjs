/**
 * WP-U227 · hallazgo U179: el puerto de ciudad-lifecycle se resolvía fuera
 * de la fuente única. Este test fija el slot en presets-sdk/env:
 * default 3051 + override ZEUS_MCP_CIUDAD_LIFECYCLE (mismo nombre que ya
 * lee packages/mesh/ciudad-lifecycle/src/server.mjs).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ZEUS_MCP,
  MCP_PORT_ENV,
  resolveZeusMcpPorts,
  mcpToDiscoveryUrls,
  loadZeusEnv,
  resetZeusEnvLoader
} from '../src/env/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('ciudad-lifecycle slot: default 3051 en la fuente única', () => {
  assert.equal(DEFAULT_ZEUS_MCP.ciudadLifecycle.disk, 3051);
  assert.equal(MCP_PORT_ENV['ciudadLifecycle.disk'], 'ZEUS_MCP_CIUDAD_LIFECYCLE');
});

test('ciudad-lifecycle slot: override por ZEUS_MCP_CIUDAD_LIFECYCLE', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-env-ciudad-'));
  const prev = process.env.ZEUS_MCP_CIUDAD_LIFECYCLE;
  resetZeusEnvLoader();
  loadZeusEnv(tempRoot); // sin .env: solo process.env manda
  try {
    delete process.env.ZEUS_MCP_CIUDAD_LIFECYCLE;
    assert.equal(resolveZeusMcpPorts().ciudadLifecycle.disk, 3051);

    process.env.ZEUS_MCP_CIUDAD_LIFECYCLE = '3099';
    assert.equal(resolveZeusMcpPorts().ciudadLifecycle.disk, 3099);

    // WP-U266 cambio este contrato a proposito: hasta entonces un valor no
    // numerico caia al defecto en silencio (aqui se afirmaba `=== 3051`), y
    // eso es la misma clase de falso verde que el `ZEUS_PORT_EDITOR=0` de la
    // ficha: el operador cree haber movido el puerto y el servidor levanta en
    // otro. Ahora aborta al resolver. Ver `test/env-puerto-mal-formado.mjs`.
    process.env.ZEUS_MCP_CIUDAD_LIFECYCLE = 'no-numerico';
    assert.throws(() => resolveZeusMcpPorts(), { code: 'ZEUS_PUERTO_MAL_FORMADO' });

    // La clave vacia si sigue siendo "sin configurar" -> defecto.
    process.env.ZEUS_MCP_CIUDAD_LIFECYCLE = '';
    assert.equal(resolveZeusMcpPorts().ciudadLifecycle.disk, 3051);
  } finally {
    if (prev == null) delete process.env.ZEUS_MCP_CIUDAD_LIFECYCLE;
    else process.env.ZEUS_MCP_CIUDAD_LIFECYCLE = prev;
    resetZeusEnvLoader();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('ciudad-lifecycle participa en discovery como launcher (composición)', () => {
  const urls = mcpToDiscoveryUrls('localhost', DEFAULT_ZEUS_MCP);
  assert.ok(urls.includes('http://localhost:3051'));
});
