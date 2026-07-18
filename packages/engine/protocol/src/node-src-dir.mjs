/**
 * Shared node-only path helper for package `./node` entry points.
 * Pass `import.meta.url` from the calling module — never from a re-export.
 * Do not import from browser code.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @param {string | URL} metaUrl `import.meta.url` of the calling module
 * @returns {string} absolute directory containing that module
 */
export function nodeSrcDir(metaUrl) {
  return path.dirname(fileURLToPath(metaUrl));
}
