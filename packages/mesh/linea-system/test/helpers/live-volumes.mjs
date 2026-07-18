/**
 * Live VOLUMES helpers for mesh linea tests (WP-U102 hermetic CI).
 * DISK_02/LINEAS is gitignored — CI and clean worktrees have no corpus.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveLineasBasePath } from '@zeus/presets-sdk';

/**
 * True when the host has a readable lineas registry under VOLUMES.
 * @returns {boolean}
 */
export function hasLiveLineasRegistry() {
  try {
    return existsSync(join(resolveLineasBasePath(), 'registry.yaml'));
  } catch {
    return false;
  }
}

/** node:test skip reason when live DISK_02/LINEAS is absent. */
export const SKIP_NO_LIVE_LINEAS =
  '⏳ VOLUMES/DISK_02/LINEAS/registry.yaml missing — live corpus not in repo (CI/worktree)';
