import test from 'node:test';
import assert from 'node:assert/strict';
import { connectMcp, toolResultJson, setupSmokeVolumesEnv } from '../src/index.mjs';

test('test-utils exports are reachable', () => {
  assert.equal(typeof connectMcp, 'function');
  assert.equal(typeof toolResultJson, 'function');
  assert.equal(typeof setupSmokeVolumesEnv, 'function');
});
