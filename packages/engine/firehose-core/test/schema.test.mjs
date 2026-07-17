import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeFirehosePost, isJetstreamPost } from '../src/schema.mjs';

test('normalizeFirehosePost returns empty shape for non-objects', () => {
  assert.deepEqual(normalizeFirehosePost(null), {
    id: null,
    handle: null,
    text: '',
    isReply: false,
    uri: null,
    createdAt: null,
    kind: null,
    did: null,
    raw: null
  });
  assert.equal(normalizeFirehosePost(undefined).text, '');
  assert.equal(normalizeFirehosePost('x').raw, null);
});

test('normalizeFirehosePost maps jetstream commit fields', () => {
  const raw = {
    did: 'did:plc:alice',
    kind: 'commit',
    handle: 'alice.bsky.social',
    uri: 'at://did:plc:alice/app.bsky.feed.post/rkey1',
    commit: {
      collection: 'app.bsky.feed.post',
      rkey: 'rkey1',
      cid: 'bafyCID',
      record: {
        text: 'hola firehose',
        createdAt: '2026-01-02T03:04:05.000Z',
        reply: { parent: { uri: 'at://x' } }
      }
    }
  };

  const post = normalizeFirehosePost(raw);
  assert.equal(post.id, raw.uri);
  assert.equal(post.handle, 'alice.bsky.social');
  assert.equal(post.text, 'hola firehose');
  assert.equal(post.isReply, true);
  assert.equal(post.uri, raw.uri);
  assert.equal(post.createdAt, '2026-01-02T03:04:05.000Z');
  assert.equal(post.kind, 'commit');
  assert.equal(post.did, 'did:plc:alice');
  assert.equal(post.raw, raw);
});

test('normalizeFirehosePost falls back to commit.rkey when uri missing', () => {
  const post = normalizeFirehosePost({
    commit: { rkey: 'only-rkey', record: { text: 't' } }
  });
  assert.equal(post.id, 'only-rkey');
  assert.equal(post.text, 't');
  assert.equal(post.isReply, false);
});

test('isJetstreamPost detects collection and record.text', () => {
  assert.equal(
    isJetstreamPost({ commit: { collection: 'app.bsky.feed.post' } }),
    true
  );
  assert.equal(
    isJetstreamPost({ commit: { record: { text: 'hi' } } }),
    true
  );
  assert.equal(
    isJetstreamPost({ commit: { collection: 'app.bsky.feed.like' } }),
    false
  );
  assert.equal(isJetstreamPost({}), false);
  assert.equal(isJetstreamPost(null), false);
});
