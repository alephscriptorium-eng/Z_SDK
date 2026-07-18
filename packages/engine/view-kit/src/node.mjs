/**
 * @zeus/view-kit/node — NODE-ONLY path helpers.
 *
 * Lets apps mount the kit for the browser, e.g.:
 *
 *   import { srcDir } from '@zeus/view-kit/node';
 *   app.use('/view-kit', express.static(srcDir));
 *
 * with an import map:
 *
 *   { "imports": { "@zeus/view-kit": "/view-kit/index.mjs", "@zeus/view-kit/": "/view-kit/" } }
 *
 * Never import this module from browser code.
 */

import path from 'node:path';
import { nodeSrcDir } from '@zeus/protocol/node-src-dir';

const here = nodeSrcDir(import.meta.url);

/** Package root (contains package.json). */
export const pkgDir = path.resolve(here, '..');

/** Browser-safe sources — mount with express.static. */
export const srcDir = here;
