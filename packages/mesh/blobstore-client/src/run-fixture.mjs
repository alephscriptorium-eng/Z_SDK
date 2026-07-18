/**
 * WP-U101 fixture runner — HTTP control contract + LAN peer-card + live ⏳.
 * Headless: ZEUS_OPEN_BROWSER unused. Zero `blobs.*` / muxrpc.
 */

import { issuePeerCard } from '@zeus/authority-kit';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  buildOutboundManifest,
  createFixtureBlobstore,
  createBlobstoreClient,
  requireLanPeerCard,
  probeLiveBlobstore,
  validateVolumesCidFields,
  invariantsRunbook,
  SSB_BLOB_SOFT_MAX_BYTES
} from './index.mjs';

const ROOM = 'blobstore-outbound';
const ENDPOINT = process.env.ZEUS_SCRIPTORIUM_URL || 'http://127.0.0.1:0';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function runHttpFixture() {
  const fixture = createFixtureBlobstore();
  const { baseUrl } = await fixture.listen(0);
  const client = createBlobstoreClient({ baseUrl });

  const salud = await client.salud();
  assert(salud.ok, salud.error || 'salud failed');

  const small = buildOutboundManifest('zeus-u101-outbound-fixture');
  const put = await client.putObjeto(small);
  assert(put.ok, put.error || 'putObjeto failed');

  const vol = validateVolumesCidFields({
    path: 'DISK_04/SSB/manifest.json',
    cid: small.cid
  });
  assert(vol.ok, vol.error || 'volumes cid validation failed');

  const estado = await client.estado(small.cid);
  assert(estado.ok && estado.body?.estado === 'listo', 'estado listo expected');

  const want = await client.want(small.cid);
  assert(want.ok, want.error || 'want failed');

  // Chunk-as-blob path: softMax lowered for fixture (prod default remains 50 MiB).
  const softMax = 100;
  const bigPayload = Buffer.alloc(softMax + 40, 9);
  const chunked = buildOutboundManifest(bigPayload, {
    chunkBytes: 32,
    softMaxBytes: softMax
  });
  assert(chunked.manifestCid, 'manifestCid required above soft max');
  assert(
    chunked.size > softMax,
    'fixture payload must exceed soft max for chunk-as-blob'
  );
  const putBig = await client.putObjeto(chunked);
  assert(putBig.ok, putBig.error || 'put chunked failed');
  const estBig = await client.estado(chunked.manifestCid);
  assert(estBig.ok && estBig.body?.estado === 'listo', 'chunked estado');

  await fixture.close();
  return {
    ok: true,
    baseUrl,
    smallCid: small.cid,
    manifestCid: chunked.manifestCid,
    chunks: chunked.chunks.length,
    softMaxBytesProd: SSB_BLOB_SOFT_MAX_BYTES
  };
}

function runLanGate() {
  const good = issuePeerCard({
    roomId: ROOM,
    endpoint: ENDPOINT,
    role: 'player',
    sessionId: 'node-a'
  });
  const allow = requireLanPeerCard(good);
  assert(allow.ok, allow.error || 'LAN should allow');

  const deny = requireLanPeerCard(null);
  assert(!deny.ok, 'missing peer-card must reject');

  const expired = makePeerCard({
    roomId: ROOM,
    endpoint: ENDPOINT,
    token: 'x',
    scopes: [roleScope('player')],
    expiresAt: Date.now() - 1
  });
  const denyExp = requireLanPeerCard(expired);
  assert(!denyExp.ok, 'expired peer-card must reject');

  return {
    ok: true,
    allowRole: allow.role,
    rejectedMissing: deny.error,
    rejectedExpired: denyExp.error
  };
}

async function main() {
  console.log('=== WP-U101 volumes outbound ===');
  console.log('runbook:', JSON.stringify(invariantsRunbook()));

  const httpFx = await runHttpFixture();
  console.log('fixture HTTP control:', JSON.stringify(httpFx));

  const lan = runLanGate();
  console.log('LAN peer-card portero (U93):', JSON.stringify(lan));

  const live = await probeLiveBlobstore();
  console.log('live ops probe:', JSON.stringify(live));

  console.log(
    live.evidence === 'live'
      ? 'e2e:volumes-outbound OK — live /salud'
      : `e2e:volumes-outbound OK — live ${live.evidence} (${live.note})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
