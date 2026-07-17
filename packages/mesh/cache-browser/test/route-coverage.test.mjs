import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';
import { assertRoutesMounted } from '@zeus/http-contract';
import { VIEW_ROUTES } from '../src/contract.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createViewServer } = await import('../src/server.mjs');

test('view routes mounted per contract', async (t) => {
  const handle = await createViewServer({ port: 0 });
  t.after(() => handle.close());
  assertRoutesMounted(handle.app, VIEW_ROUTES);
});
