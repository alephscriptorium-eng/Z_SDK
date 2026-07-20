/**
 * GraphSource contract — agnostic neighbor enumeration for path planning.
 *
 * @typedef {{ id: string, label?: string, meta?: object }} GraphNode
 * @typedef {{ id: string, to: string, label?: string, meta?: object }} GraphEdge
 * @typedef {{
 *   kind: string,
 *   getNode: (id: string) => GraphNode|null|Promise<GraphNode|null>,
 *   neighbors: (id: string) => GraphEdge[]|Promise<GraphEdge[]>
 * }} GraphSource
 */

/**
 * @param {unknown} source
 * @returns {{ ok: true }|{ ok: false, error: string, rule: string }}
 */
export function assertGraphSource(source) {
  if (!source || typeof source !== 'object') {
    return { ok: false, error: 'GraphSource required', rule: 'viaje.graph_source' };
  }
  if (typeof /** @type {GraphSource} */ (source).neighbors !== 'function') {
    return {
      ok: false,
      error: 'GraphSource.neighbors(id) is required',
      rule: 'viaje.graph_source.neighbors'
    };
  }
  if (typeof /** @type {GraphSource} */ (source).getNode !== 'function') {
    return {
      ok: false,
      error: 'GraphSource.getNode(id) is required',
      rule: 'viaje.graph_source.get_node'
    };
  }
  return { ok: true };
}
