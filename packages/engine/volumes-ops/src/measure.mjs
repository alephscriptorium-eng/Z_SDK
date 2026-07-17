/**
 * Recursive disk measurement for VOLUMES (files + bytes).
 * Node-only. Does not mutate disk.
 */

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadVolumesConfig,
  resolveVolume,
  resolveVolumesRoot,
  listVolumes
} from '@zeus/presets-sdk/volumes';

/**
 * Walk a directory tree; count regular files and sum sizes.
 * @param {string} absPath
 * @returns {{ files: number, bytes: number, missing: boolean }}
 */
export function measurePath(absPath) {
  if (!absPath || !existsSync(absPath)) {
    return { files: 0, bytes: 0, missing: true };
  }
  let files = 0;
  let bytes = 0;

  /** @param {string} dir */
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile()) continue;
      files += 1;
      try {
        bytes += statSync(full).size;
      } catch {
        /* unreadable file: count as file with 0 bytes */
      }
    }
  }

  const st = statSync(absPath);
  if (st.isFile()) {
    return { files: 1, bytes: st.size, missing: false };
  }
  walk(absPath);
  return { files, bytes, missing: false };
}

/**
 * @param {string} volumeId
 * @param {{ linePath?: string }} [opts]
 */
export function measureVolume(volumeId, opts = {}) {
  const volume = resolveVolume(volumeId);
  const target = opts.linePath
    ? join(volume.absPath, opts.linePath.replace(/^[/\\]+/, ''))
    : volume.absPath;
  const measured = measurePath(target);
  const corpora = (volume.corpora || []).map((c) => {
    const corpusPath = join(volume.absPath, c.path || c.id);
    const m = measurePath(corpusPath);
    return {
      id: c.id,
      path: c.path || c.id,
      label: c.label || c.id,
      files: m.files,
      bytes: m.bytes,
      missing: m.missing
    };
  });
  return {
    volumeId,
    disk: volume.disk,
    label: volume.label,
    absPath: volume.absPath,
    linePath: opts.linePath || null,
    files: measured.files,
    bytes: measured.bytes,
    missing: measured.missing,
    corpora
  };
}

/**
 * @param {string} volumeId
 * @param {string} corpusId
 */
export function measureCorpus(volumeId, corpusId) {
  const volume = resolveVolume(volumeId);
  const entry = (volume.corpora || []).find((c) => c.id === corpusId);
  if (!entry) {
    return {
      ok: false,
      error: 'corpus_no_encontrado',
      volumeId,
      corpusId
    };
  }
  const corpusPath = join(volume.absPath, entry.path || entry.id);
  const measured = measurePath(corpusPath);
  return {
    ok: true,
    volumeId,
    corpusId,
    path: entry.path || entry.id,
    label: entry.label || corpusId,
    absPath: corpusPath,
    files: measured.files,
    bytes: measured.bytes,
    missing: measured.missing
  };
}

/**
 * Measure every volume under volumes.json.
 */
export function measureAllVolumes() {
  const root = resolveVolumesRoot();
  const ids = listVolumes();
  const volumes = ids.map((id) => measureVolume(id));
  const totals = volumes.reduce(
    (acc, v) => {
      acc.files += v.files;
      acc.bytes += v.bytes;
      return acc;
    },
    { files: 0, bytes: 0 }
  );
  return {
    volumesRoot: root,
    registryPresent: Boolean(loadVolumesConfig()),
    volumes,
    files: totals.files,
    bytes: totals.bytes
  };
}
