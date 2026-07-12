/**
 * Route coverage for @zeus/view-ui — browse API with empty/missing base.
 */

import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';

setupSmokeVolumesEnv(import.meta.url);

import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
const { createViewServer } = await import('../src/server.mjs');

const TEST_PORT = 14025;

test('view browse routes with empty base', async (t) => {
  const emptyBase = path.join(os.tmpdir(), `zeus-view-empty-${Date.now()}`);
  const handle = await createViewServer({ port: TEST_PORT, basePath: emptyBase });

  t.after(async () => {
    await handle.close();
  });

  const missingLinea = await fetch(`http://localhost:${TEST_PORT}/api/browse`);
  assert.equal(missingLinea.status, 400);
  const missingBody = await missingLinea.json();
  assert.ok(
    missingBody.code === 'VALIDATION_ERROR' || /linea/i.test(String(missingBody.error)),
    'missing linea returns validation or legacy error'
  );

  const badBase = await fetch(`http://localhost:${TEST_PORT}/api/browse?linea=espana`);
  // Base has no registry.yaml → ensureLineaData fails at the FS layer (not an
  // "unknown linea"), so browse returns 400 with a controlled error body.
  assert.equal(badBase.status, 400);
  const badBody = await badBase.json();
  assert.ok(badBody.error, 'browse with empty base returns controlled error');

  const lineas = await fetch(`http://localhost:${TEST_PORT}/api/lineas`);
  assert.equal(lineas.status, 404);
  const lineasBody = await lineas.json();
  assert.ok(lineasBody.error);
});
