import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { assetsDir, template, shellHeader } from '../src/index.mjs';

test('ui-kit exports and assetsDir', () => {
  assert.ok(existsSync(assetsDir), 'shared assets directory should exist');
  assert.equal(typeof template, 'function');
  assert.equal(typeof shellHeader, 'function');
});
