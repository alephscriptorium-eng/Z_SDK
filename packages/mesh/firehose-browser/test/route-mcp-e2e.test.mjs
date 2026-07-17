/**
 * WP-U40 CA: firehose-browser RouteEntry → MCP resource-template and responds.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { setupSmokeVolumesEnv, connectMcp } from '@zeus/test-utils';
import {
  projectRoutesToMcp,
  bindProjectedHttpReaders
} from '@zeus/http-contract';
import { createStandardMcpServer } from '@zeus/presets-sdk';
import { FIREHOSE_ROUTES } from '../src/contract.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createFirehoseServer } = await import('../src/server.mjs');

test('firehose corpora.get projects as MCP resource-template and responds', async (t) => {
  const http = await createFirehoseServer({ port: 0, host: '127.0.0.1' });
  t.after(() => http.close());
  const httpPort = http.server.address().port;
  const baseUrl = `http://127.0.0.1:${httpPort}`;

  const projected = projectRoutesToMcp(FIREHOSE_ROUTES);
  const corpusTpl = projected.templates.find(
    (tpl) => tpl.uriTemplate === 'firehose://corpus/{corpusId}'
  );
  assert.ok(corpusTpl, 'expected firehose://corpus/{corpusId} template from RouteEntry');
  assert.equal(corpusTpl.routeId, 'corpora.get');
  assert.equal(corpusTpl.path, '/api/corpora/:corpusId');

  // Prove HTTP side responds before MCP wiring.
  const direct = await fetch(`${baseUrl}/api/corpora/candidate`);
  assert.equal(direct.status, 200);
  const directBody = await direct.json();
  assert.equal(directBody.id, 'candidate');

  const { registry, templateRegistry } = bindProjectedHttpReaders(projected, { baseUrl });

  const mcp = createStandardMcpServer({
    name: 'firehose-route-mcp-e2e',
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
  const templates = listed.resourceTemplates || [];
  assert.ok(
    templates.some((tpl) => tpl.uriTemplate === 'firehose://corpus/{corpusId}'),
    `expected template in MCP list, got ${templates.map((t) => t.uriTemplate).join(', ')}`
  );

  const read = await client.readResource({ uri: 'firehose://corpus/candidate' });
  assert.ok(read.contents?.[0]?.text, 'expected resource contents');
  const payload = JSON.parse(read.contents[0].text);
  assert.equal(payload.id, 'candidate');
  assert.ok(!payload.error, `unexpected error payload: ${JSON.stringify(payload)}`);
});
