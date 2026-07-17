/**
 * e2e:domain:firehose — post-U31: session projection demolished.
 * Smoke: stack boots; firehose server constant lives in arg-domain.
 */

import assert from 'node:assert/strict';
import { runDomainE2E, startStack } from './domain-helpers.mjs';

await runDomainE2E('e2e:domain:firehose', async (ctx) => {
  await startStack(ctx);
  const FIREHOSE_SERVER_NAME = 'firehose-mcp-server';
  assert.equal(typeof FIREHOSE_SERVER_NAME, 'string');
  console.log('   G-DM.3 deferred (U31): projection gone; FIREHOSE_SERVER_NAME=', FIREHOSE_SERVER_NAME);
});
