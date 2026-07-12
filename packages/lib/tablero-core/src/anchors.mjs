export function normalizeNodoId(nodoId) {
  const raw = String(nodoId).trim().toUpperCase();
  return raw.startsWith('P') ? raw : `P${raw}`;
}

/**
 * @param {object} anchors — REST /api/aleph/anchors payload or grid subtree
 * @param {string} nodoId
 */
export function findAnchorCell(anchors, nodoId) {
  const grid = anchors?.grid ?? anchors;
  const cells = grid?.cells;
  if (!Array.isArray(cells)) return null;
  const target = normalizeNodoId(nodoId);
  return cells.find((c) => normalizeNodoId(c.nodo_id) === target) ?? null;
}
