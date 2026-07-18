/**
 * Entradas node-only de @zeus/protocol (no importar desde navegador).
 * srcDir se sirve estático en arg-console para resolver el import map.
 */

import { nodeSrcDir } from './node-src-dir.mjs';

export { nodeSrcDir };

export const srcDir = nodeSrcDir(import.meta.url);
