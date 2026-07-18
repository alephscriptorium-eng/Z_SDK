/**
 * Resolve Z_SDK-games-library root for Notario (WP-U70).
 * Prefer ZEUS_GAMES_LIBRARY_ROOT; else sibling directories next to the monorepo.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EDITOR_PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Candidate relative names (no absolute hardcodes). */
const SIBLING_NAMES = ['Z_SDK-games-library-u70', 'Z_SDK-games-library'];

/**
 * Walk up from start looking for a directory that contains scripts/notario-release.mjs.
 * @param {string} start
 * @param {number} [maxUp=8]
 * @returns {string|null}
 */
function findLibraryNear(start, maxUp = 8) {
  let dir = path.resolve(start);
  for (let i = 0; i < maxUp; i++) {
    for (const name of SIBLING_NAMES) {
      const candidate = path.join(dir, name);
      if (existsSync(path.join(candidate, 'scripts', 'notario-release.mjs'))) {
        return candidate;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * @param {{ libraryRoot?: string }} [opts]
 * @returns {string}
 */
export function resolveGamesLibraryRoot(opts = {}) {
  if (opts.libraryRoot) {
    const abs = path.resolve(opts.libraryRoot);
    if (!existsSync(path.join(abs, 'scripts', 'notario-release.mjs'))) {
      throw new Error(
        `ZEUS_GAMES_LIBRARY_ROOT invalid: missing scripts/notario-release.mjs under ${abs}`
      );
    }
    return abs;
  }
  const fromEnv = process.env.ZEUS_GAMES_LIBRARY_ROOT;
  if (fromEnv) {
    const abs = path.resolve(fromEnv);
    if (!existsSync(path.join(abs, 'scripts', 'notario-release.mjs'))) {
      throw new Error(
        `ZEUS_GAMES_LIBRARY_ROOT invalid: missing scripts/notario-release.mjs under ${abs}`
      );
    }
    return abs;
  }
  const found = findLibraryNear(EDITOR_PKG) || findLibraryNear(path.join(EDITOR_PKG, '../../..'));
  if (!found) {
    throw new Error(
      'Games library not found. Set ZEUS_GAMES_LIBRARY_ROOT to the Z_SDK-games-library checkout.'
    );
  }
  return found;
}

export function resolveNotarioScript(libraryRoot) {
  return path.join(libraryRoot, 'scripts', 'notario-release.mjs');
}

export function resolveStartpackDir(libraryRoot, game = 'sketch') {
  return path.join(libraryRoot, 'packages', `startpack-${game}`);
}
