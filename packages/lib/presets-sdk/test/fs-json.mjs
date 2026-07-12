import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readJson } from '../src/shared/fs-json.mjs';

test('readJson onError modes', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-json-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const goodPath = path.join(dir, 'good.json');
  fs.writeFileSync(goodPath, JSON.stringify({ ok: true }), 'utf8');

  assert.deepEqual(readJson(goodPath), { ok: true });
  assert.deepEqual(readJson(goodPath, { onError: 'error-field' }), { ok: true });

  const missing = path.join(dir, 'missing.json');
  assert.deepEqual(readJson(missing), {});
  assert.deepEqual(readJson(missing, { onError: 'error-field' }), {
    error: `file not found: ${missing}`
  });

  const badPath = path.join(dir, 'bad.json');
  fs.writeFileSync(badPath, '{not json', 'utf8');
  assert.deepEqual(readJson(badPath), {});
  const errResult = readJson(badPath, { onError: 'error-field' });
  assert.ok(typeof errResult.error === 'string');
});
