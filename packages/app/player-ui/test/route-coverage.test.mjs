import test from 'node:test';
import { setupSmokeVolumesEnv } from '@zeus/test-utils';
import { assertRoutesMounted } from '@zeus/http-contract';
import { PLAYER_ROUTES } from '../src/contract.mjs';

setupSmokeVolumesEnv(import.meta.url);

import { startPlayerRoomStack } from './helpers.mjs';

const { createPlayerServer } = await import('../src/server.mjs');

test('player routes mounted per contract', async (t) => {
  const stack = await startPlayerRoomStack(createPlayerServer, {
    playerPort: 0,
    discoveryTimeoutMs: 500
  });
  t.after(() => stack.close());
  assertRoutesMounted(stack.player.app, PLAYER_ROUTES);
});
