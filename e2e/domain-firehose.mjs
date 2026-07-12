/**
 * e2e:domain:firehose — G-DM.3 firehose slice sync
 * deck C load; two room clients project identical firehose slices from session manifest.
 */

import assert from 'node:assert/strict';
import { FIREHOSE_SERVER_NAME } from '@zeus/tablero-core';
import { projectSlice, SCENE_IDS } from '@zeus/session-protocol/projection';
import {
  runDomainE2E,
  startStack,
  createRoomClient
} from './domain-helpers.mjs';

await runDomainE2E('e2e:domain:firehose', async (ctx) => {
  await startStack(ctx);

  const clientA = createRoomClient('domain-firehose-a', ctx.sockets);
  const clientB = createRoomClient('domain-firehose-b', ctx.sockets);
  await Promise.all([clientA.connect(), clientB.connect()]);

  await Promise.all([
    clientA.waitForState(() => true, 'initial (A)'),
    clientB.waitForState(() => true, 'initial (B)')
  ]);

  const loadedA = clientA.waitForState(
    (d) => projectSlice(d.snapshot, SCENE_IDS.firehose).deckCResolved?.kind === 'firehose',
    'firehose slice ready (A)'
  );
  const loadedB = clientB.waitForState(
    (d) => projectSlice(d.snapshot, SCENE_IDS.firehose).deckCResolved?.kind === 'firehose',
    'firehose slice ready (B)'
  );
  clientA.emitRoom('domain:deck:load', {
    deckId: 'C',
    serverName: FIREHOSE_SERVER_NAME
  });

  const [snapA, snapB] = await Promise.all([loadedA, loadedB]);
  const sliceA = projectSlice(snapA.snapshot, SCENE_IDS.firehose);
  const sliceB = projectSlice(snapB.snapshot, SCENE_IDS.firehose);

  assert.equal(sliceA.deckCResolved.kind, 'firehose');
  assert.deepEqual(sliceA, sliceB);
  console.log('   G-DM.3 OK: two clients share identical firehose slice after deck C load');
});
