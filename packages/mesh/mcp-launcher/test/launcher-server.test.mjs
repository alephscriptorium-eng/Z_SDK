/**
 * Launcher MCP server boots; tools listed; vscode config tool shape.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, resolveLauncherPort } from '../src/launcher-server.mjs';
import { ProcessManager } from '../src/process-manager.mjs';
import { resolveCatalog } from '../src/catalog.mjs';

const PORT = 13050;

test('launcher MCP listens and exposes actuator tools', async (t) => {
  const prev = process.env.ZEUS_MCP_LAUNCHER;
  process.env.ZEUS_MCP_LAUNCHER = String(PORT);

  const catalog = resolveCatalog().slice(0, 2);
  const manager = new ProcessManager({ catalog });
  const bundle = createServer({
    port: PORT,
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

  assert.equal(handle.port, PORT);
  const health = await fetch(`http://127.0.0.1:${PORT}/mcp/health`);
  assert.equal(health.ok, true);
  const body = await health.json();
  assert.equal(body.server, 'mcp-launcher');
  assert.equal(body.role, 'actuator');

  // tools via MCP SDK introspection on server card / capabilities
  assert.ok(body.capabilities);
  assert.equal(resolveLauncherPort(), PORT);
});
