import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { issuePeerCard } from '@zeus/authority-kit';
import { makePeerCard, roleScope } from '@zeus/protocol';
import {
  cidOf,
  buildBlobManifest,
  createBlobNode,
  putBlob,
  syncBlobByCid,
  hasBlob,
  assertLanBlobTransferAllowed,
  assertWanBlobTransferPendingSidecar,
  probeLiveBlobSync,
  verdictU101,
  BLOB_LANES
} from '../src/index.mjs';

describe('content-address', () => {
  it('cidOf is stable sha256 hex', () => {
    const a = cidOf('hello');
    const b = cidOf(Buffer.from('hello', 'utf8'));
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it('buildBlobManifest splits and addresses chunks', () => {
    const data = Buffer.alloc(150, 7);
    const m = buildBlobManifest(data, { chunkBytes: 64 });
    assert.equal(m.size, 150);
    assert.equal(m.chunks.length, 3);
    assert.equal(m.cid, cidOf(data));
    assert.equal(m.chunks[0].size, 64);
    assert.equal(m.chunks[2].size, 22);
  });
});

describe('two-node sync', () => {
  it('syncs root + chunks by cid', () => {
    const a = createBlobNode('a');
    const b = createBlobNode('b');
    const payload = Buffer.from('payload-' + 'z'.repeat(100));
    const m = putBlob(a, payload, { chunkBytes: 40 });
    const r = syncBlobByCid(a, b, m.cid);
    assert.equal(r.ok, true);
    assert.equal(hasBlob(b, m.cid), true);
    assert.equal(r.chunks, m.chunks.length);
  });

  it('fails when root missing on source', () => {
    const a = createBlobNode('a');
    const b = createBlobNode('b');
    const r = syncBlobByCid(a, b, 'deadbeef');
    assert.equal(r.ok, false);
  });
});

describe('LAN portero U93', () => {
  it('allows fresh issued peer-card', () => {
    const card = issuePeerCard({
      roomId: 'r',
      endpoint: 'http://127.0.0.1:0',
      role: 'player',
      sessionId: 'a'
    });
    const g = assertLanBlobTransferAllowed(card);
    assert.equal(g.ok, true);
    assert.equal(g.lane, BLOB_LANES.lan);
    assert.equal(g.role, 'player');
  });

  it('rejects expired / missing card', () => {
    const expired = makePeerCard({
      roomId: 'r',
      endpoint: 'http://127.0.0.1:0',
      token: 't',
      scopes: [roleScope('player')],
      expiresAt: Date.now() - 5
    });
    assert.equal(assertLanBlobTransferAllowed(expired).ok, false);
    assert.equal(assertLanBlobTransferAllowed(null).ok, false);
  });

  it('WAN stays pending sidecar (no product)', () => {
    const w = assertWanBlobTransferPendingSidecar();
    assert.equal(w.ok, false);
    assert.equal(w.pending, true);
    assert.equal(w.lane, BLOB_LANES.wan);
  });
});

describe('live probe + verdict', () => {
  it('⏳ when ops env unset', () => {
    const live = probeLiveBlobSync({});
    assert.equal(live.status, 'pending');
    assert.equal(live.evidence, '⏳');
    assert.ok(live.missing.includes('ZEUS_BLOB_SIDECAR_URL'));
  });

  it('ready when all live env set', () => {
    const live = probeLiveBlobSync({
      ZEUS_BLOB_SIDECAR_URL: 'http://sidecar.example',
      ZEUS_BLOB_SYNC_NODE_A: '@a.ed25519',
      ZEUS_BLOB_SYNC_NODE_B: '@b.ed25519'
    });
    assert.equal(live.status, 'ready');
    assert.equal(live.evidence, 'live');
  });

  it('no despeja without live evidence', () => {
    const v = verdictU101({
      live: probeLiveBlobSync({}),
      fixtureOk: true,
      lanOk: true
    });
    assert.equal(v.verdict, 'no despeja');
  });

  it('despeja when fixture+lan+live ready', () => {
    const v = verdictU101({
      live: {
        status: 'ready',
        evidence: 'live'
      },
      fixtureOk: true,
      lanOk: true
    });
    assert.equal(v.verdict, 'despeja');
  });
});
