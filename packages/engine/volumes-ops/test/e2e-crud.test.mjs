/**
 * WP-U82 CA e2e:
 * fill synthetic corpus → measure via MCP resource → empty operator (ledger +
 * files gone) → reject same empty as player; volumes.json counters.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  projectRoutesToMcp,
  bindProjectedHttpReaders
} from '@zeus/http-contract';
import { createStandardMcpServer } from '@zeus/presets-sdk';
import { connectMcp } from '@zeus/test-utils';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  VOLUMES_OPS_ROUTES,
  createVolumesOpsServer,
  readOpsLedger
} from '../src/index.mjs';

function setupSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u82-e2e-'));
  const volPath = path.join(root, 'DISK_99', 'SANDBOX');
  const rawDir = path.join(volPath, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(path.join(rawDir, 'one.bin'), Buffer.alloc(32, 1));
  fs.writeFileSync(path.join(rawDir, 'two.bin'), Buffer.alloc(16, 2));
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    JSON.stringify(
      {
        root: '.',
        volumes: {
          sandbox: {
            disk: 'DISK_99',
            path: 'DISK_99/SANDBOX',
            readonly: false,
            label: 'Sandbox',
            corpora: [{ id: 'raw', path: 'raw', label: 'Raw', files: 0 }]
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();

  return {
    root,
    rawDir,
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

test('CA: fill → measure resource → empty operator → reject player; counters', async (t) => {
  const { root, rawDir, restore } = setupSandbox();
  t.after(restore);

  const http = await createVolumesOpsServer({ port: 0, host: '127.0.0.1' });
  t.after(() => http.close());

  // 1) Measure via HTTP
  const measureHttp = await fetch(`${http.url}/api/volumes/sandbox/measure`);
  assert.equal(measureHttp.status, 200);
  const measured = await measureHttp.json();
  assert.equal(measured.volumeId, 'sandbox');
  assert.equal(measured.files, 2);
  assert.equal(measured.bytes, 48);

  // 2) Measure via MCP resource-template (U40 projection)
  const projected = projectRoutesToMcp(VOLUMES_OPS_ROUTES);
  const tpl = projected.templates.find(
    (x) => x.uriTemplate === 'volumes://measure/{volumeId}'
  );
  assert.ok(tpl, 'expected volumes://measure/{volumeId} from RouteEntry');

  const { registry, templateRegistry } = bindProjectedHttpReaders(projected, {
    baseUrl: http.url
  });
  const mcp = createStandardMcpServer({
    name: 'volumes-ops-e2e',
    version: '0.0.0',
    port: 0,
    registry,
    templateRegistry,
    promptRegistry: [],
    serverCard: false
  });
  const handle = await mcp.start();
  t.after(() => handle.close());

  const client = await connectMcp(handle.url);
  t.after(() => client.close());

  const listed = await client.listResourceTemplates();
  assert.ok(
    (listed.resourceTemplates || []).some(
      (x) => x.uriTemplate === 'volumes://measure/{volumeId}'
    )
  );
  const read = await client.readResource({ uri: 'volumes://measure/sandbox' });
  const mcpPayload = JSON.parse(read.contents[0].text);
  assert.equal(mcpPayload.files, 2);
  assert.equal(mcpPayload.bytes, 48);

  // 3) Player hard empty → rejected; files remain
  const playerRes = await fetch(`${http.url}/api/volumes/sandbox/empty`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'player',
      actorId: 'player-1',
      corpusId: 'raw',
      intent: 'empty_volume'
    })
  });
  assert.equal(playerRes.status, 403);
  const playerBody = await playerRes.json();
  assert.equal(playerBody.ok, false);
  assert.equal(playerBody.error, 'rol_no_autorizado');
  assert.ok(fs.existsSync(path.join(rawDir, 'one.bin')));

  // 4) Operator empty → files gone + ledger + counters
  const opRes = await fetch(`${http.url}/api/volumes/sandbox/empty`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      role: 'operator',
      actorId: 'op-1',
      corpusId: 'raw',
      intent: 'empty_volume'
    })
  });
  assert.equal(opRes.status, 200);
  const opBody = await opRes.json();
  assert.equal(opBody.ok, true);
  assert.equal(opBody.purged, true);
  assert.ok(opBody.ledger?.seq >= 1);
  assert.ok(!fs.existsSync(path.join(rawDir, 'one.bin')));
  assert.ok(!fs.existsSync(path.join(rawDir, 'two.bin')));

  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
  assert.equal(cfg.volumes.sandbox.corpora[0].files, 0);
  assert.equal(cfg.volumes.sandbox.files, 0);

  const ledger = readOpsLedger({ volumesRoot: root });
  assert.ok(ledger.some((e) => e.kind === 'empty_volume' && e.role === 'operator'));

  // 5) Re-measure via resource → empty
  const after = await fetch(`${http.url}/api/volumes/sandbox/measure`);
  const afterBody = await after.json();
  assert.equal(afterBody.files, 0);
  assert.equal(afterBody.bytes, 0);
});
