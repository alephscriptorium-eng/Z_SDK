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
  syncJetstreamFixture,
  resolveFirehoseVolumeRoot,
  refreshFirehoseCorpusCounts
} from '../src/index.mjs';
import { isJetstreamPost } from '@zeus/firehose-core';
import { loadVolumesConfig, resetVolumesCache } from '@zeus/presets-sdk/volumes';

/**
 * Root SEMBRADO: el manifiesto declara el volumen (lo que hace el import,
 * U201/U204). WP-U204 demolió el escritor legado que lo inventaba desde el
 * sync — un sync vivo ya no crea topología de manifiesto.
 * @param {string} root
 */
function seedFirehoseManifest(root) {
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    `${JSON.stringify(
      {
        root: '.',
        volumes: {
          firehose: {
            disk: 'DISK_01',
            path: 'DISK_01/FIREHOSE',
            readonly: true,
            label: 'Firehose (fixture de test)',
            corpora: [
              { id: 'candidate', path: 'candidate', label: 'Candidatos', files: 0 },
              { id: 'raw', path: 'raw', label: 'Raw', files: 0 },
              { id: 'discarded', path: 'discarded', label: 'Descartados', files: 0 },
              { id: 'labeled', path: 'labeled', label: 'Etiquetados', files: 0 }
            ]
          }
        }
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  return root;
}

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
  const tmp = seedFirehoseManifest(fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-feed-jet-')));
  try {
    const sealBefore = fs.readFileSync(path.join(tmp, 'volumes.json'), 'utf8');
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

    // WP-U204: el sync vivo NO toca el manifiesto (byte a byte idéntico) y
    // deja `syncedAt` en el estado, no en volumes.json.
    assert.equal(fs.readFileSync(path.join(tmp, 'volumes.json'), 'utf8'), sealBefore);
    assert.ok(!sealBefore.includes('syncedAt'));
    const state = JSON.parse(fs.readFileSync(path.join(tmp, 'volumes.state.json'), 'utf8'));
    assert.equal(state.volumes.firehose.syncedAt, result.syncedAt);
    assert.match(result.syncedAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('WP-U204: sync sobre root sin volumen declarado ABORTA — no inventa manifiesto', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-feed-u204-'));
  try {
    // (a) root sin volumes.json: no operable.
    assert.throws(() => syncJetstreamFixture({ volumesRoot: tmp }), /no operable|volumes\.json/i);
    assert.ok(!fs.existsSync(path.join(tmp, 'volumes.json')));

    // (b) manifiesto sin la entrada `firehose`: aborta y no la añade.
    fs.writeFileSync(
      path.join(tmp, 'volumes.json'),
      `${JSON.stringify({ root: '.', volumes: {} }, null, 2)}\n`,
      'utf8'
    );
    const before = fs.readFileSync(path.join(tmp, 'volumes.json'), 'utf8');
    assert.throws(
      () => syncJetstreamFixture({ volumesRoot: tmp }),
      /no declara el volumen 'firehose'/
    );
    assert.equal(fs.readFileSync(path.join(tmp, 'volumes.json'), 'utf8'), before);
    assert.ok(!fs.existsSync(path.join(tmp, 'DISK_01', 'FIREHOSE', 'raw', 'jetstream')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('refreshFirehoseCorpusCounts counts any file type; manifest sealed, state recorded (U199)', () => {
  const tmp = seedFirehoseManifest(fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-feed-u97-')));
  const prev = process.env.ZEUS_VOLUMES_ROOT;
  try {
    resolveFirehoseVolumeRoot(tmp);
    const rawDir = path.join(tmp, 'DISK_01', 'FIREHOSE', 'raw', 'mixed');
    fs.mkdirSync(rawDir, { recursive: true });
    fs.writeFileSync(path.join(rawDir, 'a.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(rawDir, 'b.bin'), Buffer.alloc(8, 1));
    fs.writeFileSync(path.join(rawDir, 'c.txt'), 'note', 'utf8');

    const corpora = refreshFirehoseCorpusCounts(tmp);
    assert.ok(Array.isArray(corpora));
    const raw = corpora.find((c) => c.id === 'raw');
    assert.ok(raw);
    assert.equal(raw.files, 3);

    process.env.ZEUS_VOLUMES_ROOT = tmp;
    resetVolumesCache();
    // U199: the recount no longer rewrites the volumes.json manifest — the
    // live count lands in volumes.state.json; the manifest keeps what the
    // import scaffold declared (files: 0).
    const cfg = loadVolumesConfig();
    assert.equal(cfg.volumes.firehose.corpora.find((c) => c.id === 'raw').files, 0);
    const state = JSON.parse(
      fs.readFileSync(path.join(tmp, 'volumes.state.json'), 'utf8')
    );
    assert.equal(state.volumes.firehose.corpora.find((c) => c.id === 'raw').files, 3);
  } finally {
    if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prev;
    resetVolumesCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
