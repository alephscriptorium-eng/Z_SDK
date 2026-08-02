/**
 * Declarations for src/viaje/graph-source.mjs.
 * GraphSource contract — agnostic neighbor enumeration for path planning.
 */

export interface GraphNode {
  id: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  to: string;
  label?: string;
  meta?: Record<string, unknown>;
}

export interface GraphSource {
  kind: string;
  getNode: (id: string) => GraphNode | null | Promise<GraphNode | null>;
  neighbors: (id: string) => GraphEdge[] | Promise<GraphEdge[]>;
}

export interface GraphSourceOk {
  ok: true;
}

export interface GraphSourceRefusal {
  ok: false;
  error: string;
  rule: string;
}

/**
 * Structural check of a candidate source. Takes `unknown` because the whole
 * point is to be handed something unverified.
 */
export declare function assertGraphSource(
  source: unknown
): GraphSourceOk | GraphSourceRefusal;
