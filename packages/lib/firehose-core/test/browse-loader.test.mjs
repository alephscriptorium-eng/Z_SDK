import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadZeusEnv, resetZeusEnvLoader } from '@zeus/presets-sdk';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';

import {
  getCorpusConfig,
  listCorpora,
  browseCorpus,
  listPosts,
  getFirehoseStats,
  loadTriageManifest,
  loadPostFile
} from '../src/index.mjs';

const SAMPLE_POST = {
  did: 'did:plc:bob',
  kind: 'commit',
  handle: 'bob.bsky.social',
  uri: 'at://did:plc:bob/app.bsky.feed.post/abc',
  commit: {
    collection: 'app.bsky.feed.post',
    rkey: 'abc',
    record: {
      text: 'micropost de prueba',
      createdAt: '2026-03-01T12:00:00.000Z'
    }
  }
};

function writeFirehoseFixture(tempRoot) {
  const volumesRoot = path.join(tempRoot, 'VOLUMES');
  const firehoseRoot = path.join(volumesRoot, 'DISK_01', 'FIREHOSE');
  const candidateBatch = path.join(firehoseRoot, 'candidate', 'batch-a');
  fs.mkdirSync(candidateBatch, { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'raw'), { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'discarded'), { recursive: true });
  fs.mkdirSync(path.join(firehoseRoot, 'labeled'), { recursive: true });

  fs.writeFileSync(
    path.join(volumesRoot, 'volumes.json'),
    JSON.stringify({
      root: '.',
      volumes: {
        firehose: {
          disk: 'DISK_01',
          path: 'DISK_01/FIREHOSE',
          readonly: true,
          label: 'Firehose fixture',
          corpora: [
            { id: 'candidate', path: 'candidate', label: 'Candidatos', files: 1 },
            { id: 'raw', path: 'raw', label: 'Raw', files: 0 },
            { id: 'discarded', path: 'discarded', label: 'Descartados', files: 0 },
            { id: 'labeled', path: 'labeled', label: 'Etiquetados', files: 0 }
          ]
        }
      }
    }),
    'utf8'
  );

  fs.writeFileSync(
    path.join(firehoseRoot, 'triage-manifest.json'),
    JSON.stringify({ version: 1, batches: ['batch-a'] }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(candidateBatch, 'post-1.json'),
    JSON.stringify(SAMPLE_POST),
    'utf8'
  );

  return { volumesRoot, firehoseRoot };
}

async function withFirehoseFixture(fn) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-firehose-core-'));
  const prevVolumesRoot = process.env.ZEUS_VOLUMES_ROOT;

  try {
    const fixture = writeFirehoseFixture(tempRoot);
    process.env.ZEUS_VOLUMES_ROOT = fixture.volumesRoot;
    resetZeusEnvLoader();
    resetVolumesCache();
    loadZeusEnv(tempRoot);
    await fn(fixture);
  } finally {
    if (prevVolumesRoot == null) delete process.env.ZEUS_VOLUMES_ROOT;
    else process.env.ZEUS_VOLUMES_ROOT = prevVolumesRoot;
    resetZeusEnvLoader();
    resetVolumesCache();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

test('listCorpora maps volume corpora with empty flags', async () => {
  await withFirehoseFixture(async () => {
    const corpora = listCorpora();
    assert.equal(corpora.length, 4);
    const candidate = corpora.find((c) => c.id === 'candidate');
    assert.equal(candidate.label, 'Candidatos');
    assert.equal(candidate.files, 1);
    assert.equal(candidate.empty, false);
    const labeled = corpora.find((c) => c.id === 'labeled');
    assert.equal(labeled.empty, true);
  });
});

test('getCorpusConfig returns corpus or throws for unknown id', async () => {
  await withFirehoseFixture(async () => {
    const { corpus, volume } = getCorpusConfig('candidate');
    assert.equal(corpus.id, 'candidate');
    assert.equal(volume.id, 'firehose');
    assert.throws(() => getCorpusConfig('no-existe'), /Unknown corpus: no-existe/);
  });
});

test('browseCorpus lists directory entries under a corpus', async () => {
  await withFirehoseFixture(async () => {
    const root = await browseCorpus('candidate', '', { limit: 50, offset: 0 });
    assert.equal(root.corpus, 'candidate');
    assert.ok(root.entries.some((e) => e.name === 'batch-a' && e.type === 'directory'));

    const batch = await browseCorpus('candidate', 'batch-a', { limit: 50, offset: 0 });
    const post = batch.entries.find((e) => e.name === 'post-1.json');
    assert.ok(post);
    assert.equal(post.type, 'file');
    assert.equal(post.ext, '.json');
    assert.equal(post.path, 'batch-a/post-1.json');
  });
});

test('listPosts normalizes jetstream JSON under a corpus', async () => {
  await withFirehoseFixture(async () => {
    const empty = await listPosts('labeled');
    assert.equal(empty.empty, true);
    assert.deepEqual(empty.posts, []);

    const listed = await listPosts('candidate', '', { limit: 10, offset: 0 });
    assert.equal(listed.posts.length, 1);
    assert.equal(listed.posts[0].text, 'micropost de prueba');
    assert.equal(listed.posts[0].handle, 'bob.bsky.social');
    assert.equal(listed.posts[0].filePath, 'batch-a/post-1.json');
    assert.equal(listed.pagination.hasMore, false);
  });
});

test('getFirehoseStats aggregates corpora file counts', async () => {
  await withFirehoseFixture(async () => {
    const stats = getFirehoseStats();
    assert.equal(stats.volumeId, 'firehose');
    assert.equal(stats.label, 'Firehose fixture');
    assert.equal(stats.totals.candidate, 1);
    assert.equal(stats.totals.labeled, 0);
    assert.equal(stats.totals.all, 1);
    assert.equal(stats.corpora.length, 4);
  });
});

test('loadTriageManifest reads triage-manifest.json from the volume', async () => {
  await withFirehoseFixture(async () => {
    const manifest = await loadTriageManifest();
    assert.equal(manifest.version, 1);
    assert.deepEqual(manifest.batches, ['batch-a']);
  });
});

test('loadPostFile returns normalized post plus raw payload', async () => {
  await withFirehoseFixture(async () => {
    const file = await loadPostFile('candidate/batch-a/post-1.json');
    assert.match(file.path.replace(/\\/g, '/'), /candidate\/batch-a\/post-1\.json$/);
    assert.equal(file.post.text, 'micropost de prueba');
    assert.equal(file.post.handle, 'bob.bsky.social');
    assert.equal(file.raw.uri, SAMPLE_POST.uri);
    assert.ok(file.size > 0);
  });
});
