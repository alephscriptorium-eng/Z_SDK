/**
 * e2e:domain:manifest — G-D7
 * Master publishes SessionManifest v2 with map.sceneId and materiales.byNode; seq grows.
 */

import assert from 'node:assert/strict';
import {
  runDomainE2E,
  startStack,
  createRoomClient
} from './domain-helpers.mjs';

await runDomainE2E('e2e:domain:manifest', async (ctx) => {
  await startStack(ctx);

  const client = createRoomClient('domain-manifest', ctx.sockets);
  await client.connect();

  const initial = await client.waitForState(
    (d) => d.snapshot?.map?.sceneId && d.snapshot?.materiales?.byNode != null,
    'initial manifest v2'
  );

  assert.equal(initial.snapshot.map.sceneId, 'vaiven-dos-nodos');
  assert.ok(typeof initial.snapshot.materiales.byNode === 'object');
  assert.equal(initial.snapshot.version, '2.0.0');

  const seq0 = initial.seq;
  const pinned = client.waitForState(
    (d) => Array.isArray(d.snapshot?.materiales?.byNode?.['nodo-a'])
      && d.snapshot.materiales.byNode['nodo-a'].some((m) => m.slot === 'overlay'),
    'material pin in manifest'
  );
  client.emitRoom('material:pin', {
    nodeId: 'nodo-a',
    slot: 'overlay',
    serverName: 'linea-espana'
  });
  const after = await pinned;

  assert.ok(after.seq > seq0, 'seq should increase after domain mutation');
  console.log('   G-D7 OK: map.sceneId + materiales.byNode in server snapshot, seq', seq0, '→', after.seq);
});
