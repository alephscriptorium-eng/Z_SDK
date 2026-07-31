/**
 * Live counters sync — measurement is recorded in volumes.state.json.
 *
 * WP-U199 (D-45) demolition note: this module used to REWRITE volumes.json
 * counters from live measurement. That mutation is gone. The manifest
 * (volumes.json) is sealed — runtime read-only, hashed over its exact
 * bytes (manifest.mjs) — and measuring NEVER modifies it. All measured
 * counters live in volumes.state.json (state.mjs), which never enters the
 * manifest hash.
 *
 * Hostile-omit gate: a volume absent from the manifest, or a root without
 * a manifest, ABORTS the operation — no entry is invented, no state is
 * written.
 * Node-only.
 */

import { loadVolumesConfig } from '@zeus/presets-sdk/volumes';
import { measureVolume } from './measure.mjs';
import { hashManifest } from './manifest.mjs';
import { recordVolumeState } from './state.mjs';

/**
 * Measure a volume and record `files`/`bytes` (volume + corpora) in
 * volumes.state.json. The volumes.json manifest is not touched.
 *
 * @param {string} volumeId
 * @returns {{ volumeId: string, files: number, bytes: number, corpora: object[], statePath: string, manifestSha256: string }}
 */
export function syncVolumeCounters(volumeId) {
  // Seal first: aborts when the root has no manifest (never invent one).
  const manifest = hashManifest();
  const config = loadVolumesConfig();
  if (!config.volumes?.[volumeId]) {
    // Volume not declared by the manifest: abort, record nothing.
    throw new Error(`Unknown volume id: ${volumeId}`);
  }

  const measured = measureVolume(volumeId);
  const { statePath } = recordVolumeState(volumeId, measured, {
    manifestSha256: manifest.sha256
  });

  return {
    volumeId,
    files: measured.files,
    bytes: measured.bytes,
    corpora: measured.corpora,
    statePath,
    manifestSha256: manifest.sha256
  };
}
