/**
 * Local snapshot projection for player-3d HUD (session-protocol demolished WP-U31).
 * Map authority is gone; viewer shows local/empty map until a later WP recablea.
 */

export const SCENE_IDS = Object.freeze({ player3d: 'player-3d' });

/**
 * @param {object} snapshot
 * @param {string} [_sceneId]
 */
export function projectSlice(snapshot, _sceneId) {
  const decks = snapshot?.decks ?? {};
  return {
    playhead: snapshot?.playhead ?? null,
    deckBSelected: decks.B?.resolved?.selected ?? decks.B?.resolved?.wikitext ?? null,
    map: snapshot?.map ?? {
      sceneId: 'player-3d',
      tick: 0,
      actors: {},
      anchors: {}
    },
    decks
  };
}
