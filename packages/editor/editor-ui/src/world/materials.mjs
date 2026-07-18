/**
 * Materials catalog for the world-A editor (scene / line / casos / cloaks).
 * Game-agnostic: no delta/pozo names in selectable ids beyond engine toys.
 */

import { vaivenDosNodos } from '@zeus/game-engine';

export const DEFAULT_GAME_ID = 'sketch';

export const DEFAULT_CASOS_MD = `# Playbook — sketch (mínimo)

## C-01 — smoke

- **Precondición**: start pack instalado; escena y línea presentes.
- **Pasos del agente (uno)**:
  1. \`sketch_smoke {"ok":true}\`
- **Qué observa el humano**: el pack carga escena, labelset, línea y este caso.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.
`;

/** @type {Record<string, { id: string, label: string, scene: object }>} */
export const SCENE_CATALOG = {
  'vaiven-dos-nodos': {
    id: 'vaiven-dos-nodos',
    label: 'Vaivén · dos nodos',
    scene: vaivenDosNodos
  }
};

/** @type {Record<string, { id: string, label: string, kind: string }>} */
export const LINE_CATALOG = {
  juguete: {
    id: 'juguete',
    label: 'Línea juguete (linea-kit starterkit)',
    kind: 'starterkit'
  }
};

/**
 * @returns {{
 *   gameId: string,
 *   version: string,
 *   sceneId: string,
 *   labelset: string[],
 *   lineId: string,
 *   casosMd: string,
 *   cloakIds: string[]
 * }}
 */
export function createDefaultDraft() {
  return {
    gameId: DEFAULT_GAME_ID,
    version: '0.1.0',
    sceneId: 'vaiven-dos-nodos',
    labelset: ['alpha', 'beta'],
    lineId: 'juguete',
    casosMd: DEFAULT_CASOS_MD,
    cloakIds: []
  };
}

/**
 * @param {object} draft
 * @returns {{ ok: true, draft: object } | { ok: false, error: string, rule: string }}
 */
export function validateDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return { ok: false, error: 'draft required', rule: 'world.draft.required' };
  }
  if (draft.gameId !== DEFAULT_GAME_ID) {
    return {
      ok: false,
      error: `gameId must be "${DEFAULT_GAME_ID}" (toy pack for CA)`,
      rule: 'world.draft.gameId'
    };
  }
  if (!SCENE_CATALOG[draft.sceneId]) {
    return {
      ok: false,
      error: `unknown sceneId "${draft.sceneId}"`,
      rule: 'world.draft.sceneId'
    };
  }
  if (!Array.isArray(draft.labelset) || draft.labelset.length === 0) {
    return {
      ok: false,
      error: 'labelset must be a non-empty string[]',
      rule: 'world.draft.labelset'
    };
  }
  if (!LINE_CATALOG[draft.lineId]) {
    return {
      ok: false,
      error: `unknown lineId "${draft.lineId}"`,
      rule: 'world.draft.lineId'
    };
  }
  if (typeof draft.casosMd !== 'string' || !draft.casosMd.includes('## C-')) {
    return {
      ok: false,
      error: 'casosMd must include at least one ## C- case heading',
      rule: 'world.draft.casos'
    };
  }
  return { ok: true, draft };
}

export function listMaterials() {
  return {
    scenes: Object.values(SCENE_CATALOG).map(({ id, label }) => ({ id, label })),
    lines: Object.values(LINE_CATALOG).map(({ id, label, kind }) => ({ id, label, kind })),
    games: [{ id: DEFAULT_GAME_ID, label: 'sketch (juguete parametrizado)', packageName: '@zeus/startpack-sketch' }]
  };
}
