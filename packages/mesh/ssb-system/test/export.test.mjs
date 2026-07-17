/**
 * Unit + partition behaviour for SSB export (no network).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, validateVolumesTree } from '@zeus/linea-kit/validate';
import {
  classifyMessage,
  exportSsbLogFile,
  partitionExportable
} from '../src/export.mjs';
import { corpusForContent } from '../src/types.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.resolve(__dirname, '../fixtures/ssb-log.json');

test('corpusForContent maps tribe*/parliament*/votes* via table', () => {
  assert.equal(corpusForContent({ type: 'tribe' }), 'tribes');
  assert.equal(corpusForContent({ type: 'parliamentProposal' }), 'parliament');
  assert.equal(corpusForContent({ type: 'votesVote' }), 'votes');
  assert.equal(corpusForContent({ type: 'post' }), null);
});

test('partitionExportable skips unrelated types', () => {
  const log = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const { byCorpus, skipped, total } = partitionExportable(log);
  assert.equal(total, 10);
  assert.equal(skipped, 1);
  assert.equal(byCorpus.tribes.length, 2);
  assert.equal(byCorpus.parliament.length, 5);
  assert.equal(byCorpus.votes.length, 2);
  assert.equal(classifyMessage(log[9]), null);
});

test('export fixture → DISK_04/SSB validates U80 volumes + ssb-manifest', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-ssb-export-'));
  try {
    const result = exportSsbLogFile({
      logPath: FIXTURE,
      volumesRoot: root,
      provenance: { fixture: true, pubUrl: null }
    });
    assert.equal(result.ok, true);
    assert.equal(result.counts.tribes, 2);
    assert.equal(result.counts.parliament, 5);
    assert.equal(result.counts.votes, 2);
    assert.equal(result.skipped, 1);

    const manifestPath = path.join(root, 'DISK_04', 'SSB', 'manifest.json');
    assert.ok(fs.existsSync(manifestPath));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const schema = validate('ssb-manifest', manifest);
    assert.equal(schema.ok, true, JSON.stringify(schema.errors));

    const tree = validateVolumesTree({ volumesRoot: root });
    assert.equal(tree.ok, true, JSON.stringify(tree.results.filter((r) => !r.ok)));
    const ssb = tree.results.find((r) => r.schemaId === 'ssb-manifest');
    assert.ok(ssb?.ok, 'expected ssb-manifest in validateVolumesTree');

    const volumes = JSON.parse(
      fs.readFileSync(path.join(root, 'volumes.json'), 'utf8')
    );
    assert.equal(volumes.volumes.ssb.disk, 'DISK_04');
    assert.equal(volumes.volumes.ssb.path, 'DISK_04/SSB');
    assert.equal(volumes.volumes.ssb.readonly, true);
    console.log(
      `Export OK: ssbRoot=${result.ssbRoot}; counts=${JSON.stringify(result.counts)}`
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
