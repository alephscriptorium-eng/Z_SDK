/**
 * CA e2e (offline): fixture log → DISK_04/SSB → U80 validate → MCP resources.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import { validateVolumesTree } from '@zeus/linea-kit/validate';
import { resetVolumesCache } from '@zeus/presets-sdk';
import { exportSsbLogFile } from '../src/export.mjs';
import { startAll } from '../src/start.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, '../fixtures/ssb-log.json');
const TEST_PORT = 14114;

const PREV = {
  ssb: process.env.ZEUS_MCP_SSB,
  volumes: process.env.ZEUS_VOLUMES_ROOT
};

test('ssb-system e2e: fixture export → volume → MCP', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-ssb-e2e-'));
  process.env.ZEUS_VOLUMES_ROOT = root;
  process.env.ZEUS_MCP_SSB = String(TEST_PORT);
  resetVolumesCache();

  t.after(async () => {
    if (PREV.ssb == null) delete process.env.ZEUS_MCP_SSB;
    else process.env.ZEUS_MCP_SSB = PREV.ssb;
    if (PREV.volumes == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = PREV.volumes;
    resetVolumesCache();
    fs.rmSync(root, { recursive: true, force: true });
  });

  const exported = exportSsbLogFile({
    logPath: FIXTURE,
    volumesRoot: root,
    provenance: { fixture: true, note: 'WP-U84 offline CA' }
  });
  assert.equal(exported.ok, true);
  assert.ok(exported.counts.tribes + exported.counts.parliament + exported.counts.votes > 0);

  const tree = validateVolumesTree({ volumesRoot: root });
  assert.equal(tree.ok, true, JSON.stringify(tree.results.filter((r) => !r.ok)));
  console.log(
    `U80 validate OK: volumesRoot=${root}; checked=${tree.results.length}; skipped=${JSON.stringify(tree.skipped)}`
  );

  const ssbRoot = path.join(root, 'DISK_04', 'SSB');
  const handles = await startAll(ssbRoot);
  t.after(async () => {
    await Promise.allSettled((handles ?? []).map((h) => h.close()));
  });

  const healthRes = await fetch(`http://localhost:${TEST_PORT}/mcp/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.server, 'ssb-system');
  console.log('Health OK:', JSON.stringify(health));

  const client = await connectMcp(TEST_PORT);
  t.after(async () => {
    await client.close();
  });

  const statsRes = await client.readResource({ uri: 'ssb://stats' });
  const stats = JSON.parse(statsRes.contents[0].text);
  assert.ok(stats.corpora?.length >= 3);
  assert.ok(stats.files > 0);
  console.log('Resource OK: ssb://stats files=', stats.files);

  const manifestRes = await client.readResource({ uri: 'ssb://manifest' });
  const manifest = JSON.parse(manifestRes.contents[0].text);
  assert.equal(manifest.schema, 'ssb-manifest');
  assert.equal(manifest.disk, 'DISK_04');
  console.log('Resource OK: ssb://manifest syncedAt=', manifest.syncedAt);

  const corpusRes = await client.readResource({ uri: 'ssb://corpus/tribes' });
  const corpus = JSON.parse(corpusRes.contents[0].text);
  assert.equal(corpus.id, 'tribes');
  assert.ok(corpus.files >= 1);

  const browse = toolResultJson(
    await client.callTool({
      name: 'ssb_browse',
      arguments: { corpus: 'parliament', limit: 10 }
    })
  );
  assert.ok(browse.entries?.length > 0, 'parliament browse empty');
  const sampleKey = browse.entries.find((e) => e.key)?.key;
  assert.ok(sampleKey);

  const msg = toolResultJson(
    await client.callTool({
      name: 'ssb_get_message',
      arguments: { key: sampleKey }
    })
  );
  assert.equal(msg.key, sampleKey);
  assert.equal(msg.corpus, 'parliament');
  console.log('Tool OK: ssb_get_message type=', msg.type);

  const resources = await client.listResources();
  const uris = resources.resources.map((r) => r.uri);
  assert.ok(uris.includes('ssb://stats'));
  assert.ok(uris.includes('ssb://manifest'));
  console.log('SMOKE/E2E PASSED');
});
