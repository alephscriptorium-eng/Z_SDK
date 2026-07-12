/**
 * e2e:domain:selection — G-D3 room path
 * selection:cast registro → ontologia.selections visible in room snapshot.
 */

import assert from 'node:assert/strict';
import {
  runDomainE2E,
  startStack,
  createRoomClient
} from './domain-helpers.mjs';

const ACTOR_ID = 'e2e-bot-selection';
const TARGET_ID = 4242;
const LABEL = 'E2E-Registro';

await runDomainE2E('e2e:domain:selection', async (ctx) => {
  await startStack(ctx);

  const client = createRoomClient('domain-selection', ctx.sockets);
  await client.connect();
  await client.waitForState(() => true, 'initial snapshot');

  const waited = client.waitForState(
    (d) => d.snapshot?.ontologia?.selections?.byActor?.[ACTOR_ID]?.targetId === TARGET_ID,
    'selection in ontologia'
  );
  client.emitRoom('selection:cast', {
    actorId: ACTOR_ID,
    kind: 'registro',
    deckId: 'B',
    targetId: TARGET_ID,
    label: LABEL
  });
  const snap = await waited;

  assert.equal(snap.snapshot.ontologia.selections.last.actorId, ACTOR_ID);
  assert.equal(snap.snapshot.ontologia.selections.byActor[ACTOR_ID].nodeId, 'nodo-b');
  assert.equal(snap.snapshot.ontologia.selections.byActor[ACTOR_ID].label, LABEL);
  console.log('   G-D3 OK: selection:cast reflected in ontologia.selections');
});
