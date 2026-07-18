/**
 * Live VOLUMES helpers for mesh linea tests (WP-U102 hermetic CI; tightened WP-U119).
 * DISK_02/LINEAS live corpus (`espana`) is gitignored / outside monorepo after U62.
 * The in-repo registry.yaml only lists the synthetic `demo` fixture — that is NOT
 * enough for startAll()/smoke (they require lineaId `espana`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveLineasBasePath } from '@zeus/presets-sdk';

/**
 * True when the host has a live `espana` line registered and present on disk.
 * @returns {boolean}
 */
export function hasLiveLineasRegistry() {
  try {
    const base = resolveLineasBasePath();
    const registryPath = join(base, 'registry.yaml');
    if (!existsSync(registryPath)) return false;
    const yaml = readFileSync(registryPath, 'utf8');
    // Require the live tronco id — demo-only fixture must not enable these tests.
    if (!/(?:^|\n)[ \t]*-[ \t]*id:[ \t]*espana[ \t]*(?:\r?\n|$)/.test(yaml)) {
      return false;
    }
    return existsSync(join(base, 'espana'));
  } catch {
    return false;
  }
}

/** node:test skip reason when live espana corpus is absent. */
export const SKIP_NO_LIVE_LINEAS =
  '⏳ VOLUMES/DISK_02/LINEAS live id:espana missing — corpus not in repo (CI/worktree; demo fixture alone is insufficient)';
