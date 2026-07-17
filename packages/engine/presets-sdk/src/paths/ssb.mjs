/**
 * Path resolution for the SSB volume (DISK_04/SSB).
 */

import { join } from 'node:path';
import { resolveVolume } from '../volumes/resolve.mjs';

export const SSB_VOLUME_ID = 'ssb';

/**
 * Primary base path for SSB loaders and MCP.
 * Derived from ZEUS_VOLUMES_ROOT + volumes.json path (DISK_04/SSB).
 */
export function resolveSsbBasePath() {
  return resolveVolume(SSB_VOLUME_ID).absPath;
}

/**
 * DISK_04/SSB absolute path (alias of resolveSsbBasePath).
 */
export function resolveSsbVolumeRoot() {
  return resolveSsbBasePath();
}

/**
 * Resolve a path relative to DISK_04/SSB.
 * @param {string} relPath
 */
export function resolveSsbVolumePath(relPath) {
  const normalized = String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  return normalized
    ? join(resolveSsbVolumeRoot(), normalized)
    : resolveSsbVolumeRoot();
}
