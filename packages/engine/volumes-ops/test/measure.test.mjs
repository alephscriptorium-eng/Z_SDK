/**
 * Unit: measure walk + counters.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
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
              { id: 'raw', path: 'raw', label: 'Raw', files: 0 }
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

test('measureVolume / measureCorpus + syncVolumeCounters write volumes.json', () => {
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

    const synced = syncVolumeCounters('sandbox');
    assert.equal(synced.files, 2);
    const cfg = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
    assert.equal(cfg.volumes.sandbox.files, 2);
    assert.equal(cfg.volumes.sandbox.corpora[0].files, 2);
    assert.equal(cfg.volumes.sandbox.corpora[0].bytes, synced.corpora[0].bytes);
  } finally {
    restore();
  }
});
