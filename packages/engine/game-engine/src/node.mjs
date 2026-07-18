/**
 * @zeus/game-engine/node — NODE-ONLY path helpers.
 *
 * Lets apps mount the engine + its GLB assets for the browser, e.g.:
 *
 *   import express from 'express';
 *   import { srcDir, modelsDir } from '@zeus/game-engine/node';
 *   app.use('/game-engine', express.static(srcDir));
 *   app.use('/models', express.static(modelsDir));
 *
 * with an import map on the page:
 *
 *   { "imports": {
 *       "@zeus/game-engine": "/game-engine/index.mjs",
 *       "@zeus/game-engine/": "/game-engine/" } }
 *
 * Never import this module from browser code.
 */

import path from 'node:path';
import { nodeSrcDir } from '@zeus/protocol/node-src-dir';

const here = nodeSrcDir(import.meta.url);

/** Package root (contains package.json). */
export const pkgDir = path.resolve(here, '..');

/** Browser-safe sources — mount with express.static (served at /game-engine). */
export const srcDir = here;

/** Static assets root. */
export const assetsDir = path.join(pkgDir, 'assets');

/** Canonical GLBs (Xbot placeholder, RobotExpressive, SheenChair, SK_Alephillo). */
export const modelsDir = path.join(assetsDir, 'models');

/** Design/spec docs + canonical scene YAML (package-local; not game-specific). */
export const specDir = path.join(pkgDir, 'spec');
