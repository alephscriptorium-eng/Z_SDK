/**
 * Path resolution for the forces volume (DISK_03/FORCES).
 */

import { join } from 'node:path';
import { resolveVolume } from '../volumes/resolve.mjs';

export const FORCES_VOLUME_ID = 'forces';

/**
 * Primary base path for force loaders and MCP.
 * Derived from ZEUS_VOLUMES_ROOT + volumes.json path (DISK_03/FORCES).
 */
export function resolveForcesBasePath() {
  return resolveVolume(FORCES_VOLUME_ID).absPath;
}

/**
 * DISK_03/FORCES absolute path (alias of resolveForcesBasePath).
 */
export function resolveForcesVolumeRoot() {
  return resolveForcesBasePath();
}

/**
 * Resolve a path relative to DISK_03/FORCES.
 * @param {string} relPath
 */
export function resolveForcesVolumePath(relPath) {
  const normalized = String(relPath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  return normalized
    ? join(resolveForcesVolumeRoot(), normalized)
    : resolveForcesVolumeRoot();
}
