import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { loadZeusEnv, MONOREPO_ROOT } from '../env/index.mjs';

let _configCache = null;

/**
 * Canonical resolver for the VOLUMES root (WP-U200 · consenso ◆5).
 * This is THE single resolver: every runtime path to the volumes root goes
 * through here (volumes-ops, feed-kit, ssb-system, paths/*). linea-kit
 * mirrors this exact contract in src/validate.mjs (it cannot declare this
 * package as a dependency in U200 — package.json frozen).
 *
 * ZEUS_VOLUMES_ROOT is MANDATORY:
 * - absent → honest failure («not operable»), same fail-closed pattern as
 *   the U199 manifest seal. NO default root, NO cwd walk, NO in-repo
 *   fallback as a product path.
 * - a root inside node_modules is REFUSED even when the env points there:
 *   a pack is an import source, never a live volumes root (cerco §10.8 —
 *   living-anchor ban).
 * - a relative value resolves against MONOREPO_ROOT, never against cwd:
 *   the result must not depend on where the process was launched.
 *
 * Dev/test convenience — explicit and env-driven only: loadZeusEnv() reads
 * the monorepo .env (e.g. `ZEUS_VOLUMES_ROOT=./VOLUMES`, see .env.example)
 * and test harnesses inject the env themselves (see
 * packages/engine/test-utils/src/smoke-env.mjs `setupSmokeVolumesEnv`).
 */
export function resolveVolumesRoot() {
  loadZeusEnv();
  const override = process.env.ZEUS_VOLUMES_ROOT;
  if (!override) {
    throw new Error(
      'ZEUS_VOLUMES_ROOT is not set — volumes root is not operable; set it explicitly (environment or .env). No default and no cwd walk (U200 · ◆5).'
    );
  }
  const root = isAbsolute(override) ? resolve(override) : resolve(MONOREPO_ROOT, override);
  if (root.split(/[\\/]+/).includes('node_modules')) {
    throw new Error(
      `ZEUS_VOLUMES_ROOT resolves inside node_modules (${root}) — a pack is an import source, never a live volumes root; refusing (cerco §10.8).`
    );
  }
  return root;
}

/**
 * Load and cache volumes.json from the VOLUMES root.
 */
export function loadVolumesConfig() {
  if (_configCache) return _configCache;

  const root = resolveVolumesRoot();
  const configPath = join(root, 'volumes.json');
  if (!existsSync(configPath)) {
    throw new Error(`volumes.json not found at ${configPath}`);
  }

  const raw = readFileSync(configPath, 'utf8');
  _configCache = JSON.parse(raw);
  return _configCache;
}

/**
 * Expand ${VAR} placeholders in a string using process.env with fallback.
 */
function expandEnvVar(value, fallback) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\$\{([A-Z0-9_]+)\}$/);
  if (!match) return value;
  const envKey = match[1];
  const envValue = process.env[envKey];
  if (envValue != null && envValue !== '') return envValue;
  if (fallback != null && fallback !== '') return fallback;
  return null;
}

/**
 * Resolve a relative path against a base directory.
 */
function resolveRelative(base, relative) {
  if (!relative) return base;
  if (isAbsolute(relative)) return relative;
  return resolve(base, relative);
}

/**
 * List all volume ids defined in volumes.json.
 */
export function listVolumes() {
  const config = loadVolumesConfig();
  return Object.keys(config.volumes);
}

/**
 * Resolve a volume by id, merging config and computing absPath.
 */
export function resolveVolume(id) {
  loadZeusEnv();
  const config = loadVolumesConfig();
  const entry = config.volumes[id];
  if (!entry) {
    throw new Error(`Unknown volume id: ${id}`);
  }

  const volumesRoot = resolveVolumesRoot();
  const monorepoRoot = MONOREPO_ROOT;

  let absPath;
  if (entry.pathOverride) {
    absPath = resolveRelative(monorepoRoot, entry.pathOverride);
  } else if (entry.path) {
    absPath = join(volumesRoot, entry.path);
  } else {
    throw new Error(`Volume "${id}" has no path or pathOverride`);
  }

  const resolved = {
    id,
    disk: entry.disk,
    path: entry.path || null,
    pathOverride: entry.pathOverride || null,
    absPath: resolve(absPath),
    readonly: entry.readonly ?? true,
    label: entry.label || id,
    deferred: entry.deferred ?? false,
    corpora: entry.corpora || [],
  };

  if (entry.source) {
    const defaultRemote = entry.source.defaultRemotePath
      ? resolveRelative(monorepoRoot, entry.source.defaultRemotePath)
      : null;
    const defaultSource = entry.source.defaultSourcePath
      ? resolveRelative(monorepoRoot, entry.source.defaultSourcePath)
      : null;
    const remotePath = expandEnvVar(entry.source.remotePath, defaultRemote);
    resolved.source = {
      ...entry.source,
      remotePath,
      defaultRemotePath: defaultRemote,
      sourcePath: expandEnvVar(entry.source.sourcePath, defaultSource),
      defaultSourcePath: defaultSource,
    };
    if (defaultSource || resolved.source.sourcePath) {
      resolved.sourceRoot = resolve(resolved.source.sourcePath || defaultSource);
    }
  }

  return resolved;
}

/**
 * Clear cached config (useful for tests).
 */
export function resetVolumesCache() {
  _configCache = null;
}
