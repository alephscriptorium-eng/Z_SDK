/**
 * WP-U100 spike runner — fixture 2-node sync + peer-card LAN gate + live probe.
 * Zero product sidecar. ZEUS_OPEN_BROWSER unused (headless).
 */

import { issuePeerCard } from '@zeus/authority-kit';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  createBlobNode,
  putBlob,
  syncBlobByCid,
  hasBlob
} from './two-node-sync.mjs';
import { assertLanBlobTransferAllowed } from './lan-gate.mjs';
import { probeLiveBlobSync } from './live-probe.mjs';
import { verdictU101 } from './verdict.mjs';

const ROOM = 'blob-sync-spike';
const ENDPOINT = process.env.ZEUS_SCRIPTORIUM_URL || 'http://127.0.0.1:0';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function runFixtureTwoNodeSync() {
  const nodeA = createBlobNode('node-a');
  const nodeB = createBlobNode('node-b');
  // Small chunk size so a multi-chunk path is exercised without 5 MiB fixtures.
  const payload = Buffer.from(
    'zeus-u100-blob-sync-fixture:' + 'x'.repeat(200),
    'utf8'
  );
  const manifest = putBlob(nodeA, payload, { chunkBytes: 64 });
  assert(manifest.chunks.length >= 2, 'expected multi-chunk manifest');
  assert(hasBlob(nodeA, manifest.cid), 'node-a missing root');
  assert(!hasBlob(nodeB, manifest.cid), 'node-b should start empty');

  const sync = syncBlobByCid(nodeA, nodeB, manifest.cid);
  assert(sync.ok, sync.error || 'sync failed');
  assert(hasBlob(nodeB, manifest.cid), 'node-b missing root after sync');
  for (const chunk of manifest.chunks) {
    assert(hasBlob(nodeB, chunk.cid), `node-b missing chunk ${chunk.cid}`);
  }

  return {
    ok: true,
    rootCid: manifest.cid,
    size: manifest.size,
    chunks: manifest.chunks.length,
    from: sync.from,
    to: sync.to
  };
}

function runLanGateChecks() {
  const good = issuePeerCard({
    roomId: ROOM,
    endpoint: ENDPOINT,
    role: 'player',
    sessionId: 'node-a'
  });
  const allow = assertLanBlobTransferAllowed(good);
  assert(allow.ok, allow.error || 'LAN gate should allow fresh card');

  const expired = makePeerCard({
    roomId: ROOM,
    endpoint: ENDPOINT,
    token: 'x',
    scopes: [roleScope('player')],
    expiresAt: Date.now() - 1
  });
  const denyExpired = assertLanBlobTransferAllowed(expired);
  assert(!denyExpired.ok, 'expired card must be rejected');

  const denyMissing = assertLanBlobTransferAllowed(null);
  assert(!denyMissing.ok, 'missing card must be rejected');

  return {
    ok: true,
    allowRole: allow.role,
    rejectedExpired: denyExpired.error,
    rejectedMissing: denyMissing.error
  };
}

async function main() {
  console.log('=== WP-U100 blob-sync spike ===');

  const fixture = runFixtureTwoNodeSync();
  console.log('fixture 2-node sync:', JSON.stringify(fixture));

  const lan = runLanGateChecks();
  console.log('LAN peer-card portero (U93):', JSON.stringify(lan));

  const live = probeLiveBlobSync();
  console.log('live ops probe:', JSON.stringify(live));

  const decision = verdictU101({
    live,
    fixtureOk: fixture.ok,
    lanOk: lan.ok
  });
  console.log('veredicto U101:', JSON.stringify(decision));

  console.log(
    decision.verdict === 'despeja'
      ? 'e2e:blob-sync-spike OK — despeja U101'
      : `e2e:blob-sync-spike OK — ${decision.verdict} U101 (${decision.reason})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
