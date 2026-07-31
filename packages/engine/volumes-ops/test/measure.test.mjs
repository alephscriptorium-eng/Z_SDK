/**
 * Unit: measure walk + counters (U199: manifest sealed, state file).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  resetVolumesCache
} from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  measureCorpus,
  measurePath,
  measureVolume,
  syncVolumeCounters
} from '../src/index.mjs';

/**
 * @returns {{ root: string, restore: () => void }}
 */
function setupSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u82-measure-'));
  const volPath = path.join(root, 'DISK_99', 'SANDBOX');
  const rawDir = path.join(volPath, 'raw');
  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(path.join(rawDir, 'a.txt'), 'hello');
  fs.writeFileSync(path.join(rawDir, 'b.txt'), 'world!!');
  fs.writeFileSync(
    path.join(root, 'volumes.json'),
    JSON.stringify(
      {
        root: '.',
        volumes: {
          sandbox: {
            disk: 'DISK_99',
            path: 'DISK_99/SANDBOX',
            readonly: false,
            label: 'Sandbox',
            corpora: [
              { id: 'raw', path: 'raw', label: 'Raw' }
            ]
          }
        }
      },
      null,
      2
    ),
    'utf8'
  );

  const prev = process.env.ZEUS_VOLUMES_ROOT;
  process.env.ZEUS_VOLUMES_ROOT = root;
  resetZeusEnvLoader();
  resetVolumesCache();

  return {
    root,
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

test('measurePath counts files and bytes', () => {
  const { root, restore } = setupSandbox();
  try {
    const m = measurePath(path.join(root, 'DISK_99', 'SANDBOX', 'raw'));
    assert.equal(m.files, 2);
    assert.equal(m.bytes, 'hello'.length + 'world!!'.length);
    assert.equal(m.missing, false);
  } finally {
    restore();
  }
});

test('U199 seal: measuring never modifies volumes.json; counters land in volumes.state.json', () => {
  const { root, restore } = setupSandbox();
  try {
    const vol = measureVolume('sandbox');
    assert.equal(vol.volumeId, 'sandbox');
    assert.equal(vol.files, 2);
    assert.ok(vol.bytes > 0);
    assert.equal(vol.corpora[0].id, 'raw');
    assert.equal(vol.corpora[0].files, 2);

    const corpus = measureCorpus('sandbox', 'raw');
    assert.equal(corpus.ok, true);
    assert.equal(corpus.files, 2);

    const manifestPath = path.join(root, 'volumes.json');
    const bytesBefore = fs.readFileSync(manifestPath, 'utf8');
    const hashBefore = createHash('sha256').update(bytesBefore).digest('hex');
    const mtimeBefore = fs.statSync(manifestPath).mtimeMs;

    const synced = syncVolumeCounters('sandbox');
    assert.equal(synced.files, 2);
    assert.equal(synced.corpora[0].files, 2);

    // CA-1/CA-2: manifest CONTENT identical (the truth), hash stable; mtime
    // intact as a bonus — but nothing reconciles by mtime (U225).
    const bytesAfter = fs.readFileSync(manifestPath, 'utf8');
    assert.equal(bytesAfter, bytesBefore);
    assert.equal(createHash('sha256').update(bytesAfter).digest('hex'), hashBefore);
    assert.equal(fs.statSync(manifestPath).mtimeMs, mtimeBefore);
    assert.equal(synced.manifestSha256, hashBefore);

    // Counters live in the state file, never in the manifest.
    const cfg = JSON.parse(bytesAfter);
    assert.equal(cfg.volumes.sandbox.files, undefined);
    assert.equal(cfg.volumes.sandbox.corpora[0].files, undefined);

    const statePath = path.join(root, 'volumes.state.json');
    assert.ok(fs.existsSync(statePath));
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    assert.equal(state.version, 1);
    assert.equal(state.manifest.sha256, hashBefore);
    assert.equal(state.volumes.sandbox.files, 2);
    assert.equal(state.volumes.sandbox.corpora[0].id, 'raw');
    assert.equal(state.volumes.sandbox.corpora[0].files, 2);
    assert.equal(state.volumes.sandbox.corpora[0].bytes, synced.corpora[0].bytes);
    assert.ok(state.volumes.sandbox.measuredAt);

    // CA-4: the state file never enters the manifest hash — re-measuring
    // with volumes.state.json present yields the very same seal.
    const again = syncVolumeCounters('sandbox');
    assert.equal(again.manifestSha256, hashBefore);
    assert.equal(fs.readFileSync(manifestPath, 'utf8'), bytesBefore);
  } finally {
    restore();
  }
});

test('hostile: volume absent from manifest → abort, no state invented', () => {
  const { root, restore } = setupSandbox();
  try {
    assert.throws(() => syncVolumeCounters('fantasma'), /Unknown volume id: fantasma/);
    assert.ok(!fs.existsSync(path.join(root, 'volumes.state.json')));
  } finally {
    restore();
  }
});

test('hostile-omite: root without manifest → operation aborts, nothing written', () => {
  const { root, restore } = setupSandbox();
  try {
    fs.rmSync(path.join(root, 'volumes.json'));
    resetVolumesCache();
    assert.throws(() => syncVolumeCounters('sandbox'), /volumes\.json not found .* not operable/);
    // Neither a manifest nor a state file gets invented.
    assert.ok(!fs.existsSync(path.join(root, 'volumes.json')));
    assert.ok(!fs.existsSync(path.join(root, 'volumes.state.json')));
  } finally {
    restore();
  }
});
