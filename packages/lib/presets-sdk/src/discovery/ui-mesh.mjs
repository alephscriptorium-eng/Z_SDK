import { applyEnvToUis, DEFAULT_ZEUS_UI_MESH } from '../env/index.mjs';
import { loadSharedDiscoveryFile } from './config-file.mjs';

const GLOBAL_NAV_ORDER = ['editor', 'player', 'view', 'firehose', 'player3d', 'debug3d', 'operator', 'scriptorium'];

export function mergeUiRecord(base = {}, override = {}) {
  const merged = { ...base };
  for (const [id, entry] of Object.entries(override)) {
    if (!entry || typeof entry !== 'object') continue;
    merged[id] = { ...merged[id], ...entry };
  }
  return merged;
}

export function localConfigToUiMesh(localConfig = {}) {
  const out = { ...(localConfig.uiMesh || {}) };
  for (const id of ['editor', 'player', 'view', 'firehose', 'player3d', 'debug3d', 'operator']) {
    const block = localConfig[id];
    if (block && (block.host || block.port || block.path || block.url)) {
      out[id] = { ...(out[id] || {}), ...block };
    }
  }
  return out;
}

/**
 * @param {object} entry
 */
export function buildUiHref(entry) {
  if (entry.url) {
    const base = String(entry.url).replace(/\/$/, '');
    const p = entry.path || '/';
    return p === '/' ? `${base}/` : `${base}${p.startsWith('/') ? p : `/${p}`}`;
  }
  const host = entry.host || 'localhost';
  const port = entry.port;
  const p = entry.path || '/';
  return `http://${host}:${port}${p === '/' ? '/' : p}`;
}

/**
 * @param {object} entry
 * @param {string|null} selfUiId
 */
export function resolveNavHref(entry, selfUiId) {
  if (entry.id === selfUiId) {
    return entry.path || '/';
  }
  return buildUiHref(entry);
}

/**
 * @param {string|null} selfUiId
 * @param {string} entryId
 */
export function isNavExternal(selfUiId, entryId) {
  return entryId !== selfUiId;
}

/**
 * Resolve UI mesh from layered config.
 * @param {{ dataDir?: string, localConfig?: object, selfUiId?: string|null }} opts
 */
export function resolveUiMesh({ dataDir, localConfig = {}, selfUiId = null } = {}) {
  const shared = loadSharedDiscoveryFile(dataDir);
  let uis = mergeUiRecord(DEFAULT_ZEUS_UI_MESH, shared.uis || {});
  uis = applyEnvToUis(uis, shared.host);
  uis = mergeUiRecord(uis, localConfigToUiMesh(localConfig));

  const entries = GLOBAL_NAV_ORDER.filter((id) => uis[id]).map((id) => {
    const raw = { id, ...uis[id] };
    return {
      id,
      href: resolveNavHref(raw, selfUiId),
      label: raw.label || id,
      emoji: raw.emoji || '',
      external: isNavExternal(selfUiId, id),
      pageKey: id
    };
  });

  return { uis, entries, selfUiId };
}
