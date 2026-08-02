/**
 * Launcher MCP server boots; tools listed; vscode config tool shape.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, resolveLauncherPort } from '../src/launcher-server.mjs';
import { ProcessManager } from '../src/process-manager.mjs';
import { resolveCatalog } from '../src/catalog.mjs';

// WP-U267: antes esto era `const PORT = 13050` y se ATABA. 13050 es además el
// OPERATOR_UI_PORT de e2e/dual-ui-demo.mjs, así que la colisión no era ni
// hipotética. Ahora el bind va por `port: 0` y sólo esta constante —que nadie
// ata— sirve al único contrato que sí es sobre un número: resolveLauncherPort()
// lee ZEUS_MCP_LAUNCHER. Resolución pura, cero sockets.
const ENV_PORT_CONTRACT = 13050;

test('launcher MCP listens and exposes actuator tools', async (t) => {
  const prev = process.env.ZEUS_MCP_LAUNCHER;
  process.env.ZEUS_MCP_LAUNCHER = String(ENV_PORT_CONTRACT);

  const catalog = resolveCatalog().slice(0, 2);
  const manager = new ProcessManager({ catalog });
  const bundle = createServer({
    port: 0,
    catalog,
    manager,
    refreshEditor: false
  });
  const handle = await bundle.start();

  t.after(async () => {
    await handle.close();
    if (prev == null) delete process.env.ZEUS_MCP_LAUNCHER;
    else process.env.ZEUS_MCP_LAUNCHER = prev;
  });

  // El puerto es el que el SO concedió, leído de vuelta por createMcpHttpStart
  // vía httpServer.address().port — no un número escrito a mano.
  assert.ok(handle.port > 0, `sin puerto atado: ${handle.port}`);
  const health = await fetch(`http://127.0.0.1:${handle.port}/mcp/health`);
  assert.equal(health.ok, true);
  const body = await health.json();
  assert.equal(body.server, 'mcp-launcher');
  assert.equal(body.role, 'actuator');

  // tools via MCP SDK introspection on server card / capabilities
  assert.ok(body.capabilities);
  // Contrato de resolución de env, independiente del bind de arriba.
  assert.equal(resolveLauncherPort(), ENV_PORT_CONTRACT);
});
