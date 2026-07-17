/**
 * Rewrite volumes.json counters from live measurement.
 * Node-only.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadVolumesConfig,
  resolveVolumesRoot,
  resetVolumesCache
} from '@zeus/presets-sdk/volumes';
import { measureVolume } from './measure.mjs';

/**
 * Update `files` (and optional `bytes`) on each corpus of a volume,
 * plus volume-level totals when present.
 *
 * @param {string} volumeId
 * @returns {{ volumeId: string, files: number, bytes: number, corpora: object[] }}
 */
export function syncVolumeCounters(volumeId) {
  const measured = measureVolume(volumeId);
  const root = resolveVolumesRoot();
  const configPath = join(root, 'volumes.json');
  const config = structuredClone(loadVolumesConfig());
  const entry = config.volumes?.[volumeId];
  if (!entry) {
    throw new Error(`Unknown volume id: ${volumeId}`);
  }

  if (Array.isArray(entry.corpora) && measured.corpora.length > 0) {
    const byId = new Map(measured.corpora.map((c) => [c.id, c]));
    entry.corpora = entry.corpora.map((c) => {
      const live = byId.get(c.id);
      if (!live) return c;
      return {
        ...c,
        files: live.files,
        bytes: live.bytes
      };
    });
  }

  entry.files = measured.files;
  entry.bytes = measured.bytes;

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  resetVolumesCache();

  return {
    volumeId,
    files: measured.files,
    bytes: measured.bytes,
    corpora: measured.corpora
  };
}
