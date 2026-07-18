import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  FEED_FAMILIES,
  createSyntheticFeedBag,
  createSyntheticStreamFeed,
  makeFeedItem,
  resolveRuntimeFeeds,
  probeFeedMcpHealth,
  syncJetstreamFixture
} from '../src/index.mjs';
import { isJetstreamPost } from '@zeus/firehose-core';

test('FEED_FAMILIES has static/stream/gossip', () => {
  assert.deepEqual([...FEED_FAMILIES], ['static', 'stream', 'gossip']);
});

test('makeFeedItem applies curation from corpus', () => {
  const item = makeFeedItem({
    family: 'stream',
    kind: 'micropost',
    uri: 'firehose://post/raw/a/b.json',
    corpus: 'raw'
  });
  assert.equal(item.curation_status, 'raw');
  assert.equal(item.family, 'stream');
});

test('synthetic stream is deterministic and aliases nextDroplets', () => {
  const a = createSyntheticStreamFeed({ seed: 9 });
  const b = createSyntheticStreamFeed({ seed: 9 });
  const [ia] = a.nextItems(1);
  const [ib] = b.nextDroplets(1);
  assert.equal(ia.uri, ib.uri);
  assert.match(ia.uri, /^firehose:\/\/synthetic\/9\//);
  assert.equal(ia.family, 'stream');
});

test('createSyntheticFeedBag covers three families', () => {
  const bag = createSyntheticFeedBag({ seed: 2 });
  assert.equal(bag.mode, 'synthetic');
  for (const family of FEED_FAMILIES) {
    const feed = bag.families[family];
    assert.equal(feed.family, family);
    const [item] = feed.nextItems(1);
    assert.equal(item.family, family);
    assert.ok(item.uri);
  }
});

test('probeFeedMcpHealth: false when ports unreachable', async () => {
  const ok = await probeFeedMcpHealth(
    {
      firehose: { disk: 59998 },
      lineas: { espana: 59999, wpHistoria: 59997 },
      ssb: { disk: 59996 }
    },
    { timeoutMs: 300, require: ['stream', 'static'] }
  );
  assert.equal(ok, false);
});

test('resolveRuntimeFeeds synthetic passthrough', async () => {
  const bag = await resolveRuntimeFeeds({ mode: 'synthetic', seed: 3 });
  assert.equal(bag.mode, 'synthetic');
  assert.equal(bag.families.stream.kind, 'synthetic');
  const [drop] = bag.families.stream.nextItems(1);
  assert.match(drop.uri, /firehose:\/\/synthetic\//);
});

test('resolveRuntimeFeeds auto degrades without MCP', async () => {
  const warnings = [];
  const bag = await resolveRuntimeFeeds({
    mode: 'auto',
    seed: 2,
    mcpPorts: {
      firehose: { disk: 59996 },
      lineas: { espana: 59995, wpHistoria: 59994 }
    },
    logger: { warn: (msg) => warnings.push(msg) }
  });
  assert.equal(bag.mode, 'synthetic');
  assert.ok(warnings.some((w) => /sintético/i.test(w)));
});

test('syncJetstreamFixture writes DISK_01 posts', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-feed-jet-'));
  try {
    const result = syncJetstreamFixture({ volumesRoot: tmp });
    assert.equal(result.ok, true);
    assert.equal(result.mode, 'fixture');
    assert.ok(result.written >= 2);
    const postPath = path.join(tmp, 'DISK_01', 'FIREHOSE', 'raw', 'jetstream');
    assert.ok(fs.existsSync(postPath));
    const files = fs.readdirSync(postPath).filter((f) => f.endsWith('.json'));
    assert.ok(files.length >= 2);
    const raw = JSON.parse(fs.readFileSync(path.join(postPath, files[0]), 'utf8'));
    assert.equal(isJetstreamPost(raw), true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
