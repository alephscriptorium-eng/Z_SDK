/**
 * Dot-path navigation for session/snapshot JSON trees.
 * Convention: rootLabel (default "session") = root; "decks.B.resolved.items.2" = nested path.
 */

const DEFAULT_ROOT = 'session';

/**
 * @param {string|undefined|null} path
 * @param {string} [rootLabel]
 */
export function isRootPath(path, rootLabel = DEFAULT_ROOT) {
  return path == null || path === '' || path === rootLabel;
}

/**
 * @param {string|undefined|null} path
 * @param {string} [rootLabel]
 * @returns {string[]}
 */
export function parsePath(path, rootLabel = DEFAULT_ROOT) {
  if (isRootPath(path, rootLabel)) return [];
  return String(path).split('.').filter(Boolean);
}

/**
 * @param {string[]} segments
 * @param {string} [rootLabel]
 * @returns {string}
 */
export function formatPath(segments, rootLabel = DEFAULT_ROOT) {
  if (!segments || segments.length === 0) return rootLabel;
  return segments.join('.');
}

/**
 * @param {unknown} root
 * @param {string|string[]} path
 * @param {string} [rootLabel]
 * @returns {unknown}
 */
export function getAtPath(root, path, rootLabel = DEFAULT_ROOT) {
  const segments = Array.isArray(path) ? path : parsePath(path, rootLabel);
  let current = root;
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined;
    if (Array.isArray(current)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) return undefined;
      current = current[idx];
    } else {
      current = /** @type {Record<string, unknown>} */ (current)[seg];
    }
  }
  return current;
}

/**
 * @param {string|string[]} path
 * @param {string} [rootLabel]
 * @returns {string}
 */
export function getParentPath(path, rootLabel = DEFAULT_ROOT) {
  const segments = Array.isArray(path) ? [...path] : parsePath(path, rootLabel);
  if (segments.length === 0) return rootLabel;
  segments.pop();
  return formatPath(segments, rootLabel);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function typeOfValue(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * @param {unknown} value
 * @param {number} [maxLen]
 * @returns {string}
 */
export function previewValue(value, maxLen = 80) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    const s = value.length > maxLen ? `${value.slice(0, maxLen)}…` : value;
    return JSON.stringify(s);
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    const head = keys.slice(0, 3).join(', ');
    return `{${head}${keys.length > 3 ? ', …' : ''}}`;
  }
  return String(value);
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {{ maxArray?: number, maxChildren?: number, rootLabel?: string }} [opts]
 * @returns {Array<{ key: string, type: string, preview: string, childPath: string|null, index?: number }>}
 */
export function listChildren(value, path, opts = {}) {
  const rootLabel = opts.rootLabel ?? DEFAULT_ROOT;
  const maxArray = opts.maxArray ?? opts.maxChildren ?? 50;
  const segments = parsePath(path, rootLabel);
  /** @type {ReturnType<typeof listChildren>} */
  const children = [];

  if (value === null || value === undefined) return children;

  if (Array.isArray(value)) {
    const limit = Math.min(value.length, maxArray);
    for (let i = 0; i < limit; i++) {
      const child = value[i];
      children.push({
        key: String(i),
        type: typeOfValue(child),
        preview: previewValue(child),
        childPath: formatPath([...segments, String(i)], rootLabel),
        index: i
      });
    }
    if (value.length > maxArray) {
      children.push({
        key: '…',
        type: 'meta',
        preview: `${value.length - maxArray} more items`,
        childPath: null
      });
    }
    return children;
  }

  if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const child = /** @type {Record<string, unknown>} */ (value)[key];
      children.push({
        key,
        type: typeOfValue(child),
        preview: previewValue(child),
        childPath: formatPath([...segments, key], rootLabel)
      });
    }
  }
  return children;
}

/**
 * @param {string} path
 * @param {unknown} root
 * @param {string} [rootLabel]
 * @returns {{ prev: string|null, next: string|null }}
 */
export function getSiblingPaths(path, root, rootLabel = DEFAULT_ROOT) {
  const segments = parsePath(path, rootLabel);
  if (segments.length === 0) return { prev: null, next: null };

  const parentSegments = segments.slice(0, -1);
  const lastSeg = segments[segments.length - 1];
  const parent = parentSegments.length === 0 ? root : getAtPath(root, parentSegments, rootLabel);

  if (Array.isArray(parent)) {
    const idx = Number(lastSeg);
    if (!Number.isInteger(idx)) return { prev: null, next: null };
    return {
      prev: idx > 0 ? formatPath([...parentSegments, String(idx - 1)], rootLabel) : null,
      next: idx < parent.length - 1 ? formatPath([...parentSegments, String(idx + 1)], rootLabel) : null
    };
  }

  if (parent && typeof parent === 'object' && !Array.isArray(parent)) {
    const keys = Object.keys(parent);
    const keyIdx = keys.indexOf(lastSeg);
    if (keyIdx === -1) return { prev: null, next: null };
    return {
      prev: keyIdx > 0 ? formatPath([...parentSegments, keys[keyIdx - 1]], rootLabel) : null,
      next: keyIdx < keys.length - 1 ? formatPath([...parentSegments, keys[keyIdx + 1]], rootLabel) : null
    };
  }

  return { prev: null, next: null };
}

/**
 * Resolve path metadata for MCP REST / browser explorer.
 * @param {unknown} root
 * @param {string} [path]
 * @param {string} [rootLabel]
 */
export function inspectAtPath(root, path = DEFAULT_ROOT, rootLabel = DEFAULT_ROOT) {
  const normalized = path == null || path === '' ? rootLabel : path;
  const segments = parsePath(normalized, rootLabel);
  const value = segments.length === 0 ? root : getAtPath(root, normalized, rootLabel);
  return {
    path: normalized,
    value,
    parent: getParentPath(normalized, rootLabel),
    siblings: getSiblingPaths(normalized, root, rootLabel),
    children: listChildren(value, normalized, { rootLabel })
  };
}

/**
 * Export packet for AI / clipboard — focus value + navigation context.
 * @param {unknown} root
 * @param {string} [path]
 * @param {{ rootLabel?: string, maxValueChars?: number, maxChildren?: number }} [opts]
 */
export function buildFocusExport(root, path = DEFAULT_ROOT, opts = {}) {
  const rootLabel = opts.rootLabel ?? DEFAULT_ROOT;
  const maxValueChars = opts.maxValueChars ?? 50000;
  const maxChildren = opts.maxChildren ?? 50;
  const normalized = isRootPath(path, rootLabel) ? rootLabel : String(path);
  const inspected = inspectAtPath(root, normalized, rootLabel);
  let value = inspected.value;
  const t = typeOfValue(value);
  /** @type {{ truncated: boolean, originalLength?: number, type: string }} */
  let valueMeta = { truncated: false, type: t };

  if (typeof value === 'string' && value.length > maxValueChars) {
    valueMeta = { truncated: true, originalLength: value.length, type: 'string' };
    value = value.slice(0, maxValueChars) + '…';
  }

  const segments = parsePath(normalized, rootLabel);
  const atRoot = segments.length === 0;
  const childSummaries = listChildren(value, normalized, { rootLabel, maxChildren })
    .filter((c) => c.childPath != null)
    .map((c) => ({
      key: c.key,
      type: c.type,
      path: c.childPath,
      preview: c.preview
    }));

  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    rootLabel,
    focus: {
      path: normalized,
      type: t,
      value,
      valueMeta,
      parent: atRoot ? null : inspected.parent,
      navigation: {
        up: atRoot ? null : inspected.parent,
        prev: inspected.siblings.prev,
        next: inspected.siblings.next
      },
      breadcrumb: atRoot ? [rootLabel] : [rootLabel, ...segments],
      children: childSummaries
    }
  };
}

export { DEFAULT_ROOT };
