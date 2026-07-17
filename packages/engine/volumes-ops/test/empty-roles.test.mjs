/**
 * Unit: operator empty + ledger; player reject.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resetVolumesCache } from '@zeus/presets-sdk/volumes';
import { resetZeusEnvLoader } from '@zeus/presets-sdk/env';
import {
  emptyVolume,
  measureCorpus,
  readOpsLedger
} from '../src/index.mjs';

function setupSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u82-empty-'));
  const volPath = path.join(root, 'DISK_99', 'SANDBOX');
  const rawDir = path.join(volPath, 'raw');
  const curatedDir = path.join(volPath, 'curated');
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(curatedDir, { recursive: true });
  fs.writeFileSync(path.join(rawDir, 'junk.txt'), 'purge-me');
  fs.writeFileSync(path.join(curatedDir, 'keep.txt'), 'precious');
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
              { id: 'raw', path: 'raw', label: 'Raw', files: 1 },
              { id: 'curated', path: 'curated', label: 'Curated', files: 1 }
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
    rawDir,
    curatedDir,
    restore() {
      if (prev == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prev;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

test('player hard empty → rol_no_autorizado; files remain', () => {
  const { root, rawDir, restore } = setupSandbox();
  try {
    const rejected = emptyVolume({
      volumeId: 'sandbox',
      corpusId: 'raw',
      role: 'player',
      actorId: 'p1',
      intent: 'empty_volume'
    });
    assert.equal(rejected.ok, false);
    assert.equal(rejected.error, 'rol_no_autorizado');
    assert.ok(fs.existsSync(path.join(rawDir, 'junk.txt')));
    assert.equal(readOpsLedger({ volumesRoot: root }).length, 0);
  } finally {
    restore();
  }
});

test('operator empty raw → files gone + ledger + counters', () => {
  const { root, rawDir, curatedDir, restore } = setupSandbox();
  try {
    const result = emptyVolume({
      volumeId: 'sandbox',
      corpusId: 'raw',
      role: 'operator',
      actorId: 'op1',
      intent: 'empty_volume'
    });
    assert.equal(result.ok, true);
    assert.equal(result.purged, true);
    assert.ok(result.ledger?.seq >= 1);
    assert.ok(!fs.existsSync(path.join(rawDir, 'junk.txt')));
    assert.ok(fs.existsSync(path.join(curatedDir, 'keep.txt')));

    const after = measureCorpus('sandbox', 'raw');
    assert.equal(after.files, 0);

    const cfg = JSON.parse(fs.readFileSync(path.join(root, 'volumes.json'), 'utf8'));
    assert.equal(cfg.volumes.sandbox.corpora.find((c) => c.id === 'raw').files, 0);

    const ledger = readOpsLedger({ volumesRoot: root });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].kind, 'empty_volume');
    assert.equal(ledger[0].role, 'operator');
  } finally {
    restore();
  }
});

test('empty_playable seats ledger without deleting', () => {
  const { root, rawDir, restore } = setupSandbox();
  try {
    const result = emptyVolume({
      volumeId: 'sandbox',
      corpusId: 'raw',
      role: 'player',
      actorId: 'p1',
      intent: 'empty_playable'
    });
    assert.equal(result.ok, true);
    assert.equal(result.purged, false);
    assert.equal(result.playable, true);
    assert.ok(fs.existsSync(path.join(rawDir, 'junk.txt')));
    const ledger = readOpsLedger({ volumesRoot: root });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].kind, 'empty_playable');
  } finally {
    restore();
  }
});
