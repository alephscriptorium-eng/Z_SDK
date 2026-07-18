import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { issuePeerCard } from '@zeus/authority-kit';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  cidOf,
  isSsbBlobCid,
  assertSsbBlobCid,
  buildOutboundManifest,
  validateOutboundManifest,
  validateVolumesCidFields,
  createFixtureBlobstore,
  createBlobstoreClient,
  requireLanPeerCard,
  probeLiveBlobstoreEnv,
  probeLiveBlobstore,
  checkInvariantCidStable,
  checkInvariantBlobSize,
  checkInvariantRoomNoBytes,
  checkInvariantFollowsOps,
  SSB_BLOB_SOFT_MAX_BYTES,
  BLOB_LANES
} from '../src/index.mjs';

describe('cid SSB blob ref', () => {
  it('cidOf returns &base64.sha256 and is stable', () => {
    const a = cidOf('hello');
    const b = cidOf(Buffer.from('hello', 'utf8'));
    assert.equal(a, b);
    assert.equal(isSsbBlobCid(a), true);
    assert.match(a, /^&[A-Za-z0-9+/]+=*\.sha256$/);
  });

  it('rejects non-SSB cid shapes', () => {
    assert.equal(assertSsbBlobCid('abc').ok, false);
    assert.equal(assertSsbBlobCid('deadbeef'.repeat(8)).ok, false);
  });
});

describe('outbound manifest', () => {
  it('small object: cid canonical, no manifestCid', () => {
    const m = buildOutboundManifest('small');
    assert.equal(m.cid, cidOf('small'));
    assert.equal(m.manifestCid, undefined);
    const v = validateOutboundManifest(m);
    assert.equal(v.ok, true);
    assert.equal(v.canonicalCid, m.cid);
  });

  it('above soft max: manifestCid canonical + multi-chunk', () => {
    const softMax = 80;
    const data = Buffer.alloc(softMax + 50, 3);
    const m = buildOutboundManifest(data, { chunkBytes: 40, softMaxBytes: softMax });
    assert.ok(m.manifestCid);
    assert.ok(m.chunks.length >= 2);
    const v = validateOutboundManifest(m, { softMaxBytes: softMax });
    assert.equal(v.ok, true);
    assert.equal(v.canonicalCid, m.manifestCid);
  });

  it('rejects chunk over production soft max', () => {
    const v = validateOutboundManifest({
      cid: cidOf('x'),
      size: 10,
      chunks: [{ index: 0, size: SSB_BLOB_SOFT_MAX_BYTES + 1, cid: cidOf('y') }]
    });
    assert.equal(v.ok, false);
  });
});

describe('VOLUMES cid validation', () => {
  it('accepts optional cid on path-style record', () => {
    const r = validateVolumesCidFields({
      path: 'DISK_01/x.json',
      cid: cidOf('payload')
    });
    assert.equal(r.ok, true);
  });

  it('rejects room message with bytes (invariant i)', () => {
    const r = validateVolumesCidFields({
      cid: cidOf('x'),
      bytes: Buffer.from('nope')
    });
    assert.equal(r.ok, false);
    assert.match(r.error, /invariant i/);
  });
});

describe('HTTP control fixture', () => {
  it('salud / put / estado / deseos round-trip', async () => {
    const fx = createFixtureBlobstore();
    const { baseUrl } = await fx.listen(0);
    const client = createBlobstoreClient({ baseUrl });

    const salud = await client.salud();
    assert.equal(salud.ok, true);

    const m = buildOutboundManifest('fixture-obj');
    const put = await client.putObjeto(m);
    assert.equal(put.ok, true);

    const est = await client.estado(m.cid);
    assert.equal(est.ok, true);
    assert.equal(est.body.estado, 'listo');

    const want = await client.want(m.cid);
    assert.equal(want.ok, true);

    const listed = await client.listDeseos();
    assert.equal(listed.ok, true);
    assert.ok(listed.body.deseos.includes(m.cid));

    await fx.close();
  });

  it('optional token auth', async () => {
    const fx = createFixtureBlobstore({ token: 'secret' });
    const { baseUrl } = await fx.listen(0);
    const anon = createBlobstoreClient({ baseUrl });
    const denied = await anon.salud();
    assert.equal(denied.ok, false);
    assert.equal(denied.status, 401);

    const authed = createBlobstoreClient({ baseUrl, token: 'secret' });
    const ok = await authed.salud();
    assert.equal(ok.ok, true);
    await fx.close();
  });
});

describe('LAN peer-card portero', () => {
  it('rejects without peer-card', () => {
    const g = requireLanPeerCard(null);
    assert.equal(g.ok, false);
    assert.equal(g.lane, BLOB_LANES.lan);
  });

  it('allows fresh issued card', () => {
    const card = issuePeerCard({
      roomId: 'r',
      endpoint: 'http://127.0.0.1:0',
      role: 'player',
      sessionId: 'a'
    });
    const g = requireLanPeerCard(card);
    assert.equal(g.ok, true);
  });

  it('rejects expired card', () => {
    const expired = makePeerCard({
      roomId: 'r',
      endpoint: 'http://127.0.0.1:0',
      token: 't',
      scopes: [roleScope('player')],
      expiresAt: Date.now() - 5
    });
    assert.equal(requireLanPeerCard(expired).ok, false);
  });
});

describe('live probe', () => {
  it('⏳ when ZEUS_BLOB_* unset', async () => {
    const live = await probeLiveBlobstore({});
    assert.equal(live.evidence, '⏳');
    assert.equal(live.status, 'pending');
  });

  it('env-ready when all keys set (no dial)', () => {
    const env = probeLiveBlobstoreEnv({
      ZEUS_BLOB_SIDECAR_URL: 'http://127.0.0.1:9/x/blobstore/v0',
      ZEUS_BLOB_SYNC_NODE_A: '@a.ed25519',
      ZEUS_BLOB_SYNC_NODE_B: '@b.ed25519'
    });
    assert.equal(env.status, 'ready');
    assert.equal(env.evidence, 'live-env');
  });

  it('dials /salud when env + fixture', async () => {
    const fx = createFixtureBlobstore();
    const { baseUrl } = await fx.listen(0);
    const live = await probeLiveBlobstore({
      ZEUS_BLOB_SIDECAR_URL: baseUrl,
      ZEUS_BLOB_SYNC_NODE_A: '@a.ed25519',
      ZEUS_BLOB_SYNC_NODE_B: '@b.ed25519'
    });
    assert.equal(live.evidence, 'live');
    assert.equal(live.status, 'live');
    await fx.close();
  });
});

describe('invariants', () => {
  it('(iii) same content ⇒ same cid', () => {
    const r = checkInvariantCidStable('same', 'same');
    assert.equal(r.ok, true);
  });

  it('(ii) rejects oversize single blob', () => {
    assert.equal(checkInvariantBlobSize(SSB_BLOB_SOFT_MAX_BYTES + 1).ok, false);
    assert.equal(checkInvariantBlobSize(10).ok, true);
  });

  it('(i) room no bytes', () => {
    assert.equal(checkInvariantRoomNoBytes({ cid: cidOf('a') }).ok, true);
    assert.equal(checkInvariantRoomNoBytes({ payload: 'x' }).ok, false);
  });

  it('(iv) follows = ops note', () => {
    const r = checkInvariantFollowsOps();
    assert.equal(r.ok, true);
    assert.equal(r.pendingOps, true);
  });
});
