/**
 * Local stub — @zeus/session-protocol demolished (WP-U31).
 * Operator rewire completo = WP-U32.
 */

export const SCENE_IDS = {
  player3d: 'player-3d',
  operator: 'operator',
  firehose: 'firehose'
};

export type OperatorSlice = {
  selectionLast?: unknown;
  [key: string]: unknown;
};

export function projectSlice(snapshot: unknown, _sceneId?: string): OperatorSlice {
  const snap = (snapshot ?? {}) as Record<string, unknown>;
  return {
    selectionLast: (snap.selections as { last?: unknown } | undefined)?.last ?? null,
    ...snap
  };
}
