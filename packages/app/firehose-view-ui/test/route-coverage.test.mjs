import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';
import { assertRoutesMounted } from '@zeus/http-contract';
import { FIREHOSE_ROUTES } from '../src/contract.mjs';

setupSmokeVolumesEnv(import.meta.url);

const { createFirehoseServer } = await import('../src/server.mjs');

test('firehose routes mounted per contract', async (t) => {
  const handle = await createFirehoseServer({ port: 0 });
  t.after(() => handle.close());
  assertRoutesMounted(handle.app, FIREHOSE_ROUTES);
});
