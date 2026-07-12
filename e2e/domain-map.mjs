/**
 * e2e:domain:map — G-DM.3 / domain map sync
 * Two room clients: game:intent sit; both receive identical map.actors in snapshot.
 */

import assert from 'node:assert/strict';
import {
  runDomainE2E,
  startStack,
  createRoomClient,
  sleep
} from './domain-helpers.mjs';

await runDomainE2E('e2e:domain:map', async (ctx) => {
  await startStack(ctx);

  const clientA = createRoomClient('domain-map-a', ctx.sockets);
  const clientB = createRoomClient('domain-map-b', ctx.sockets);
  await Promise.all([clientA.connect(), clientB.connect()]);

  await Promise.all([
    clientA.waitForState(() => true, 'initial (A)'),
    clientB.waitForState(() => true, 'initial (B)')
  ]);

  const waitA = clientA.waitForState(
    (d) => d.snapshot?.map?.actors?.['walker-1']?.pose === 'sit',
    'actor sit (A)'
  );
  const waitB = clientB.waitForState(
    (d) => d.snapshot?.map?.actors?.['walker-1']?.pose === 'sit',
    'actor sit (B)'
  );

  clientA.emitRoom('game:intent', {
    actorId: 'walker-1',
    intent: 'sit',
    anchorId: 'ancla-a'
  });

  const [snapA, snapB] = await Promise.all([waitA, waitB]);
  assert.deepEqual(snapA.snapshot.map.actors['walker-1'], snapB.snapshot.map.actors['walker-1']);
  assert.equal(snapA.snapshot.map.actors['walker-1'].zone, 'nodo-a');

  const walkA = clientA.waitForState(
    (d) => d.snapshot?.map?.actors?.['walker-1']?.pose === 'walk',
    'actor walk (A)'
  );
  const walkB = clientB.waitForState(
    (d) => d.snapshot?.map?.actors?.['walker-1']?.pose === 'walk',
    'actor walk (B)'
  );
  clientA.emitRoom('game:intent', {
    actorId: 'walker-1',
    intent: 'walk',
    linkId: 'enlace-ab',
    direction: 'a-to-b'
  });
  const [walkSnapA, walkSnapB] = await Promise.all([walkA, walkB]);
  assert.deepEqual(walkSnapA.snapshot.map.actors['walker-1'], walkSnapB.snapshot.map.actors['walker-1']);

  await sleep(200);
  console.log('   G-DM.3 OK: two clients share identical map.actors after game:intent');
});
