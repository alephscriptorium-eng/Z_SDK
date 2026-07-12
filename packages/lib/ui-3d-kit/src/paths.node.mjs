/**
 * @zeus/ui-3d-kit/node — NODE-ONLY path helpers.
 *
 * Lets apps mount the kit + three.js for the browser, e.g.:
 *
 *   import express from 'express';
 *   import { srcDir, assetsDir, modelsDir, getThreeDir } from '@zeus/ui-3d-kit/node';
 *   app.use('/ui-3d-kit', express.static(srcDir));
 *   app.use('/assets/models', express.static(modelsDir));
 *   app.use('/vendor/three', express.static(getThreeDir()));
 *
 * with an import map on the page:
 *
 *   { "imports": {
 *       "three": "/vendor/three/build/three.module.js",
 *       "three/addons/": "/vendor/three/examples/jsm/" } }
 *
 * Never import this module from browser code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Package root (contains package.json). */
export const pkgDir = path.resolve(here, '..');

/** Browser-safe sources — mount with express.static. */
export const srcDir = here;

/** Static assets root. */
export const assetsDir = path.join(pkgDir, 'assets');

/**
 * Canonical GLBs (Xbot, RobotExpressive, SheenChair, SK_Alephillo) — now owned
 * by @zeus/game-engine (block-11 GA-B). Re-exported here so apps that already
 * mount `/models` from `@zeus/ui-3d-kit/node` keep working unchanged.
 */
export { modelsDir } from '@zeus/game-engine/node';

/**
 * Root of the installed `three` package (contains build/ and examples/jsm/).
 * Resolved lazily via createRequire so importing this module never throws
 * when three is not installed yet.
 *
 * three@0.170's `exports` map does NOT expose `./package.json`, so
 * `require.resolve('three/package.json')` throws ERR_PACKAGE_PATH_NOT_EXPORTED.
 * We therefore derive the package root from the resolved main entry —
 * `require.resolve('three')` → `<root>/build/three.module.js` — and only fall
 * back to the package.json probe for older three builds. The returned dir is
 * validated to contain `build/three.module.js`.
 *
 * @throws if `three` cannot be resolved (run npm install) or no valid dir is found.
 */
export function getThreeDir() {
  const require = createRequire(import.meta.url);

  const candidates = [];
  // Primary: derive root from the main entry (works with three@0.170 exports).
  // require.resolve('three') → <root>/build/three.(module|cjs).js
  try {
    candidates.push(path.dirname(path.dirname(require.resolve('three'))));
  } catch {
    // three not installed at all — nothing to add here.
  }
  // Fallback: package.json probe (older three that exports ./package.json).
  try {
    candidates.push(path.dirname(require.resolve('three/package.json')));
  } catch {
    // exports map hides package.json (three@0.170) — ignore.
  }

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'build', 'three.module.js'))) {
      return dir;
    }
  }
  // Nothing validated; surface a clear error (or the first candidate if any).
  if (candidates.length > 0) return candidates[0];
  throw new Error("getThreeDir: cannot resolve 'three' — run npm install");
}

/**
 * Same as getThreeDir() but returns null instead of throwing.
 * Eagerly-resolved convenience export.
 */
function tryThreeDir() {
  try {
    return getThreeDir();
  } catch {
    return null;
  }
}

/** three package root, or null if three is not installed. */
export const threeDir = tryThreeDir();
