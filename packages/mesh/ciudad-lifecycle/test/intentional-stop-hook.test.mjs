/**
 * Hook contract: CityLifecycleRuntime reads intentionalStop from actuator.
 * No MCP server / fleet required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { CityLifecycleRuntime } from '../src/runtime.mjs';

test('runtime.isIntentionalStop reads actuator (not only leaf context)', () => {
  const marks = new Set();
  const manager = {
    isIntentionalStop: (id) => marks.has(id),
    launch: async () => ({ ok: true }),
    stop: async () => ({ ok: true }),
    isManaged: () => false
  };
  const runtime = new CityLifecycleRuntime({
    manager,
    barrioIds: [],
    catalog: []
  });

  assert.equal(runtime.isIntentionalStop('leaf-a'), false);
  marks.add('leaf-a');
  assert.equal(runtime.isIntentionalStop('leaf-a'), true);
  runtime.dispose();
});
