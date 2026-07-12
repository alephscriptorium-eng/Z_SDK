/**
 * Prepare ZEUS_VOLUMES_ROOT for app smoke tests (CI-safe when VOLUMES/ is absent).
 */

import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const MINIMAL_VOLUMES = {
  root: '.',
  volumes: {
    firehose: {
      disk: 'DISK_01',
      path: 'DISK_01/FIREHOSE',
      readonly: true,
      label: 'Firehose (smoke fixture)',
      corpora: [
        { id: 'candidate', path: 'candidate', label: 'Candidatos', files: 0 }
      ]
    },
    lineas: {
      disk: 'DISK_02',
      path: 'DISK_02/LINEAS',
      readonly: true,
      label: 'Lineas (smoke fixture)'
    }
  }
};

/**
 * Set ZEUS_VOLUMES_ROOT before importing app servers.
 * Uses repo VOLUMES/ when present; otherwise a temp fixture for CI.
 * @param {string} [importMetaUrl] - import.meta.url from the smoke test file
 * @param {{ forceMinimal?: boolean }} [options] - force temp fixture (route tests with empty corpora)
 * @returns {string} volumes root path in use
 */
export function setupSmokeVolumesEnv(importMetaUrl, options = {}) {
  const smokeDir = dirname(fileURLToPath(importMetaUrl));
  const monorepoRoot = join(smokeDir, '../../../..');
  const localVolumes = join(monorepoRoot, 'VOLUMES');

  if (
    !options.forceMinimal &&
    existsSync(join(localVolumes, 'volumes.json'))
  ) {
    process.env.ZEUS_VOLUMES_ROOT = localVolumes;
    return localVolumes;
  }

  const tempRoot = mkdtempSync(join(tmpdir(), 'zeus-volumes-smoke-'));
  writeFileSync(join(tempRoot, 'volumes.json'), JSON.stringify(MINIMAL_VOLUMES, null, 2));
  // Materialize empty volume + corpus directories so browse endpoints resolve
  // to an existing (but empty) directory and return 200 with zero entries,
  // instead of ENOENT → 400. Keeps route tests CI-safe without real data.
  for (const vol of Object.values(MINIMAL_VOLUMES.volumes)) {
    const volDir = join(tempRoot, String(vol.path).replace(/\//g, sep));
    mkdirSync(volDir, { recursive: true });
    for (const corpus of vol.corpora ?? []) {
      mkdirSync(join(volDir, String(corpus.path).replace(/\//g, sep)), { recursive: true });
    }
  }
  process.env.ZEUS_VOLUMES_ROOT = tempRoot;
  return tempRoot;
}
