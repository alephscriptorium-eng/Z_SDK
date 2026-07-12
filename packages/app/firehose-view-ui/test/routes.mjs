/**
 * Route coverage for @zeus/firehose-view-ui — corpora and browse without volume data.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url, { forceMinimal: true });

import assert from 'node:assert/strict';
const { createFirehoseServer } = await import('../src/server.mjs');

const TEST_PORT = 14026;

test('firehose corpora and browse routes', async (t) => {
  const handle = await createFirehoseServer({ port: TEST_PORT });

  t.after(async () => {
    await handle.close();
  });

  const corporaRes = await fetch(`http://localhost:${TEST_PORT}/api/corpora`);
  assert.equal(corporaRes.status, 200);
  const corporaBody = await corporaRes.json();
  assert.ok(Array.isArray(corporaBody.corpora));
  assert.ok(corporaBody.corpora.length >= 1);
  const candidate = corporaBody.corpora.find((c) => c.id === 'candidate');
  assert.ok(candidate, 'fixture should expose candidate corpus');
  assert.equal(candidate.empty, true, 'candidate corpus should be empty in smoke fixture');

  const browseRes = await fetch(`http://localhost:${TEST_PORT}/api/browse?corpus=candidate`);
  assert.equal(browseRes.status, 200);
  const browseBody = await browseRes.json();
  assert.equal(browseBody.entries.length, 0, 'empty volume returns zero entries');

  const missingCorpus = await fetch(`http://localhost:${TEST_PORT}/api/browse`);
  assert.equal(missingCorpus.status, 400);
  const missingBody = await missingCorpus.json();
  assert.ok(
    missingBody.code === 'VALIDATION_ERROR' || /corpus/i.test(String(missingBody.error)),
    'missing corpus returns validation or legacy error'
  );
});
