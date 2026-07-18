/**
 * Smoke test for @zeus/linea-firehose MCP server.
 * Uses an in-temp VOLUMES fixture — hermetic for CI (no host DISK_01).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { connectMcp, toolResultJson } from '@zeus/test-utils';
import {
  resolveMcpApprovalToken,
  loadZeusEnv,
  resetZeusEnvLoader
} from '@zeus/presets-sdk';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { browseCorpus, getFirehoseStats } from '@zeus/firehose-core';
import { startFirehoseMcp } from '../src/start.mjs';

const TEST_PORT = 13008;

const SAMPLE_POST = {
  did: 'did:plc:bob',
  kind: 'commit',
  handle: 'bob.bsky.social',
  uri: 'at://did:plc:bob/app.bsky.feed.post/abc',
  commit: {
    collection: 'app.bsky.feed.post',
    rkey: 'abc',
    record: {
      text: 'micropost de prueba',
      createdAt: '2026-03-01T12:00:00.000Z'
    }
  }
};

function writeFirehoseFixture(tempRoot) {
  const volumesRoot = path.join(tempRoot, 'VOLUMES');
  const firehoseRoot = path.join(volumesRoot, 'DISK_01', 'FIREHOSE');
  const candidateBatch = path.join(firehoseRoot, 'candidate', 'batch-a');
  fs.mkdirSync(candidateBatch, { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'raw'), { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'discarded'), { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'labeled'), { recursive: true });

  fs.writeFileSync(
    path.join(volumesRoot, 'volumes.json'),
    JSON.stringify({
      root: '.',
      volumes: {
        firehose: {
          disk: 'DISK_01',
          path: 'DISK_01/FIREHOSE',
          readonly: true,
          label: 'Firehose fixture',
          corpora: [
            { id: 'candidate', path: 'candidate', label: 'Candidatos', files: 1 },
            { id: 'raw', path: 'raw', label: 'Raw', files: 0 },
            { id: 'discarded', path: 'discarded', label: 'Descartados', files: 0 },
            { id: 'labeled', path: 'labeled', label: 'Etiquetados', files: 0 }
          ]
        }
      }
    }),
    'utf8'
  );

  fs.writeFileSync(
    path.join(firehoseRoot, 'triage-manifest.json'),
    JSON.stringify({ version: 1, batches: ['batch-a'] }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(candidateBatch, 'post-1.json'),
    JSON.stringify(SAMPLE_POST),
    'utf8'
  );

  return volumesRoot;
}

test('linea-firehose smoke', async (t) => {
  let handle = null;
  const clients = [];
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-linea-firehose-'));
  const prevVolumesRoot = process.env.ZEUS_VOLUMES_ROOT;
  const prevMcpPort = process.env.ZEUS_MCP_FIREHOSE;

  t.after(async () => {
    await Promise.allSettled(clients.map((c) => c.close()));
    if (handle) await handle.close();
    if (prevVolumesRoot == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prevVolumesRoot;
    if (prevMcpPort == null) delete process.env.ZEUS_MCP_FIREHOSE;
    else process.env.ZEUS_MCP_FIREHOSE = prevMcpPort;
    resetZeusEnvLoader();
    resetVolumesCache();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  const volumesRoot = writeFirehoseFixture(tempRoot);
  process.env.ZEUS_VOLUMES_ROOT = volumesRoot;
  process.env.ZEUS_MCP_FIREHOSE = String(TEST_PORT);
  resetZeusEnvLoader();
  resetVolumesCache();
  loadZeusEnv(tempRoot);

  const stats = getFirehoseStats();
  assert(stats.totals.candidate > 0, 'expected candidate files on disk');

  const browse = await browseCorpus('candidate', '', { limit: 5 });
  assert(browse.entries.length > 0, 'candidate root browse empty');

  handle = await startFirehoseMcp({ port: TEST_PORT });

  const healthRes = await fetch(`http://localhost:${TEST_PORT}/mcp/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.server, 'firehose-mcp-server');
  assert(health.capabilities?.tools > 0, 'expected tools in capabilities');
  assert.equal(health.capabilities?.prompts, 5, 'expected 5 prompts in capabilities');

  const client = await connectMcp(TEST_PORT);
  clients.push(client);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name);
  assert(toolNames.includes('firehose_browse'), 'missing firehose_browse');
  assert(toolNames.includes('firehose_list_posts'), 'missing firehose_list_posts');
  assert(toolNames.includes('firehose_get_post'), 'missing firehose_get_post');

  const prompts = await client.listPrompts();
  assert.equal(prompts.prompts.length, 5, `expected 5 prompts, got ${prompts.prompts.length}`);
  const promptNames = prompts.prompts.map((p) => p.name).sort();
  assert.deepEqual(promptNames, [
    'browse-corpus',
    'explore-firehose',
    'read-post',
    'self-check',
    'triage-report'
  ]);
  console.log('Prompt catalog OK: 5 prompts');

  const bridgePrompts = toolResultJson(await client.callTool({ name: 'getPrompts', arguments: {} }));
  assert.equal(bridgePrompts.prompts.length, 5);

  const card = toolResultJson(
    await client.callTool({ name: 'getResourceByUri', arguments: { uri: 'server://card' } })
  );
  assert.equal(card.examples?.approvalToken, resolveMcpApprovalToken());
  assert.ok(card.examples?.goldenPath?.toolSample, 'firehose goldenPath.toolSample missing');
  console.log('Server card OK: examples block');

  const browsePrompt = toolResultJson(
    await client.callTool({
      name: 'getPrompt',
      arguments: { name: 'browse-corpus', arguments: { corpus: 'candidate' } }
    })
  );
  assert.match(browsePrompt.text, /limit.*offset/s);
  console.log('Prompt OK: browse-corpus pagination');

  const selfCheckPrompt = toolResultJson(
    await client.callTool({ name: 'getPrompt', arguments: { name: 'self-check' } })
  );
  assert.match(selfCheckPrompt.text, /sampleResolve/);
  console.log('Prompt OK: self-check');

  const browseResult = toolResultJson(
    await client.callTool({ name: 'firehose_browse', arguments: { corpus: 'candidate', limit: 5 } })
  );
  assert(browseResult.entries?.length > 0, 'firehose_browse returned no entries');

  const resources = await client.listResources();
  const uris = resources.resources.map((r) => r.uri);
  assert(uris.includes('firehose://stats'), 'missing firehose://stats resource');
});
