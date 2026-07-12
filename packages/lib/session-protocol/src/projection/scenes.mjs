/**
 * Declared scene slices (L-session M3 / DM-B §5).
 * Viewers render only their slice — they do not reconstruct domain.
 */

/** @typedef {'tablero'|'player-3d'|'firehose'|'view-ui'|'operator'} SceneId */

export const SCENE_IDS = Object.freeze({
  tablero: 'tablero',
  player3d: 'player-3d',
  firehose: 'firehose',
  viewUi: 'view-ui',
  operator: 'operator'
});

/**
 * @type {Record<SceneId, { id: SceneId, label: string, fields: string[] }>}
 */
export const SCENE_DECLARATIONS = Object.freeze({
  [SCENE_IDS.tablero]: {
    id: SCENE_IDS.tablero,
    label: 'Tablero (player-ui)',
    fields: ['session']
  },
  [SCENE_IDS.player3d]: {
    id: SCENE_IDS.player3d,
    label: 'Visor 3D',
    fields: ['map', 'playhead', 'deckBSelected', 'nodes']
  },
  [SCENE_IDS.firehose]: {
    id: SCENE_IDS.firehose,
    label: 'Firehose view',
    fields: ['deckCResolved', 'corpus', 'path', 'selectedFilePath']
  },
  [SCENE_IDS.viewUi]: {
    id: SCENE_IDS.viewUi,
    label: 'View-ui cache',
    fields: ['registros', 'wikitext']
  },
  [SCENE_IDS.operator]: {
    id: SCENE_IDS.operator,
    label: 'Operador (operator-ui)',
    fields: ['phase', 'playhead', 'decks', 'selections']
  }
});

/**
 * @param {string} sceneId
 */
export function getSceneDeclaration(sceneId) {
  const decl = SCENE_DECLARATIONS[/** @type {SceneId} */ (sceneId)];
  if (!decl) {
    throw new Error(`Unknown sceneId: ${sceneId}`);
  }
  return decl;
}
