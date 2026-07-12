import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';
import { assertRoutesMounted } from '@zeus/http-contract';
import { EDITOR_ROUTES } from '../src/contract.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createEditorServer } = await import('../src/server.mjs');

test('editor routes mounted per contract', async (t) => {
  const handle = await createEditorServer({ port: 0 });
  t.after(() => handle.close());
  assertRoutesMounted(handle.app, EDITOR_ROUTES);
});
