/**
 * Linea GraphSource — trunk nodos as a sequential path graph.
 * Consumes loaded line data or an explicit nodo id list (starterkit-friendly).
 *
 * How this relates to linea:// refs (linea-system): those URIs are MCP resources
 * served by linea-system. Viaje does not re-implement them; a consumer can resolve
 * `linea://nodo/{year}` / `linea://info` via the mesh and feed nodo ids into
 * createLineaGraphSource({ nodoIds }). Mounting missing refs remains linea-system work.
 */

/**
 * @param {{
 *   nodoIds: string[],
 *   labels?: Record<string, string>,
 *   bidirectional?: boolean
 * }} options
 * @returns {import('../graph-source.mjs').GraphSource}
 */
export function createLineaGraphSource(options) {
  const ids = [...(options.nodoIds ?? [])];
  const labels = options.labels ?? {};
  const bidirectional = options.bidirectional !== false;

  /** @type {Map<string, import('../graph-source.mjs').GraphEdge[]>} */
  const adj = new Map();
  for (const id of ids) adj.set(id, []);

  for (let i = 0; i < ids.length - 1; i += 1) {
    const a = ids[i];
    const b = ids[i + 1];
    adj.get(a).push({ id: `${a}->${b}`, to: b, label: 'tronco-next' });
    if (bidirectional) {
      adj.get(b).push({ id: `${b}->${a}`, to: a, label: 'tronco-prev' });
    }
  }

  return {
    kind: 'linea',
    getNode(id) {
      if (!adj.has(id)) return null;
      return { id, label: labels[id] ?? id, meta: { source: 'linea-tronco' } };
    },
    neighbors(id) {
      return adj.get(id) ?? [];
    }
  };
}

/**
 * Build nodo id list from a trunk manifest ({ nodos: [{ id }] }) or linea loader data.
 * @param {object} trunkOrLoaded
 * @returns {string[]}
 */
export function nodoIdsFromTrunk(trunkOrLoaded) {
  if (Array.isArray(trunkOrLoaded?.nodos)) {
    return trunkOrLoaded.nodos
      .map((n) => (typeof n === 'string' ? n : n?.id))
      .filter(Boolean);
  }
  if (trunkOrLoaded?.nodos && typeof trunkOrLoaded.nodos === 'object') {
    return Object.keys(trunkOrLoaded.nodos);
  }
  if (trunkOrLoaded?.manifest?.nodos) {
    return nodoIdsFromTrunk(trunkOrLoaded.manifest);
  }
  return [];
}
