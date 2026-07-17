/**
 * Thin facade: mesh defaults (presets paths) over @zeus/linea-kit force loader.
 */

import {
  loadZeusEnv,
  resolveForcesBasePath,
  resolveLineasBasePath
} from '@zeus/presets-sdk';
import {
  loadForcesData as loadForcesDataCore,
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene,
  classifyPairsWith
} from '@zeus/linea-kit/loader';

loadZeusEnv();

/**
 * Loads FORCES registry and corpora (read-only).
 * @param {string} [basePath]
 * @param {{ mountedLineaIds?: Iterable<string>, lineasBasePath?: string }} [options]
 */
export async function loadForcesData(basePath, options = {}) {
  const root = basePath ?? resolveForcesBasePath();
  const lineasBasePath =
    options.lineasBasePath ??
    (() => {
      try {
        return resolveLineasBasePath();
      } catch {
        return undefined;
      }
    })();
  return loadForcesDataCore(root, {
    ...options,
    lineasBasePath: options.mountedLineaIds != null ? undefined : lineasBasePath
  });
}

export {
  buildForcesRegistryView,
  resolveForce,
  resolveForceScene,
  classifyPairsWith
};
