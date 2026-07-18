/**
 * Materials catalog for the world-A editor (scene / line / casos / cloaks / actos).
 * Game-agnostic: sketch = toy preset; plaza = narrative toy (carpeta dialect).
 * Story-board dialects → STORY_BOARD_DIALECTS (WP-U114).
 */

import { vaivenDosNodos } from '@zeus/game-engine';
import {
  STORY_BOARD_DIALECTS,
  listStoryBoardDialectIds,
  validateStoryBoard
} from './story-board-dialects.mjs';

/** @typedef {'toy' | 'narrative'} GameKind */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   packageName: string,
 *   kind: GameKind,
 *   dialect?: string
 * }} GameCatalogEntry
 */

/** @type {Record<string, GameCatalogEntry>} */
export const GAME_CATALOG = {
  sketch: {
    id: 'sketch',
    label: 'sketch (juguete parametrizado)',
    packageName: '@zeus/startpack-sketch',
    kind: 'toy'
  },
  plaza: {
    id: 'plaza',
    label: 'plaza (narrativo · carpeta / actos)',
    packageName: '@zeus/startpack-plaza',
    kind: 'narrative',
    dialect: 'plantilla'
  }
};

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

export const DEFAULT_PLAZA_CASOS_MD = `# Playbook — plaza (narrativo mínimo)

## C-01 — story-board smoke

- **Precondición**: start pack plaza instalado; story-board con act-0.
- **Pasos del agente (uno)**:
  1. \`plaza_smoke {"ok":true}\`
- **Qué observa el humano**: actos (plantilla / solve-inline) + línea + casos.
- **Criterio de éxito**: \`ok:true\`.
- **Errores esperados**: ninguno.
`;

/** Default story-board (carpeta plantilla shape; dialect plantilla). */
export const DEFAULT_PLAZA_STORY_BOARD = {
  version: 1,
  dialect: 'plantilla',
  title: 'Plaza — story-board',
  slug: 'plaza',
  acts: [
    {
      id: 'act-0',
      blockchain: 0,
      title: 'Semilla',
      widgets: ['panel-seed', 'panel-reic'],
      agentchain: 'agentchain/block-0.md',
      status: 'ready'
    }
  ],
  uichain_specs: 'uichain/*.prompt.md',
  ayuda: 'readerapp/AYUDA.md'
};

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
 * @returns {object}
 */
export function createDefaultDraft() {
  return {
    gameId: DEFAULT_GAME_ID,
    version: '0.1.0',
    sceneId: 'vaiven-dos-nodos',
    labelset: ['alpha', 'beta'],
    lineId: 'juguete',
    casosMd: DEFAULT_CASOS_MD,
    cloakIds: [],
    storyBoard: null
  };
}

/**
 * Narrative default (plaza) — materiales carpeta / actos.
 * @returns {object}
 */
export function createPlazaDraft() {
  return {
    gameId: 'plaza',
    version: '0.1.0',
    sceneId: 'vaiven-dos-nodos',
    labelset: ['plaza', 'semilla'],
    lineId: 'juguete',
    casosMd: DEFAULT_PLAZA_CASOS_MD,
    cloakIds: [],
    storyBoard: structuredClone(DEFAULT_PLAZA_STORY_BOARD)
  };
}

/**
 * Normalize storyBoard from object or JSON string.
 * @param {unknown} raw
 * @param {{ dialect?: string | null }} [opts]
 * @returns {{ ok: true, board: object, dialect: string } | { ok: false, error: string, rule: string }}
 */
export function normalizeStoryBoard(raw, opts = {}) {
  if (raw == null || raw === '') {
    return { ok: false, error: 'storyBoard required for narrative games', rule: 'world.draft.storyBoard' };
  }
  let board = raw;
  if (typeof raw === 'string') {
    try {
      board = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'storyBoard must be valid JSON', rule: 'world.draft.storyBoard' };
    }
  }
  if (!board || typeof board !== 'object' || Array.isArray(board)) {
    return { ok: false, error: 'storyBoard must be an object', rule: 'world.draft.storyBoard' };
  }
  const checked = validateStoryBoard(board, { dialect: opts.dialect });
  if (!checked.ok) {
    return {
      ok: false,
      error: `storyBoard: ${checked.errors.join('; ')}`,
      rule: 'world.draft.storyBoard'
    };
  }
  return { ok: true, board, dialect: checked.dialect };
}

/**
 * @param {object} draft
 * @returns {{ ok: true, draft: object } | { ok: false, error: string, rule: string }}
 */
export function validateDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return { ok: false, error: 'draft required', rule: 'world.draft.required' };
  }

  const game = GAME_CATALOG[draft.gameId];
  if (!game) {
    const known = Object.keys(GAME_CATALOG).join(', ');
    return {
      ok: false,
      error: `unknown gameId "${draft.gameId}". Known: ${known}`,
      rule: 'world.draft.gameId'
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

  /** @type {object} */
  const next = { ...draft, cloakIds: Array.isArray(draft.cloakIds) ? draft.cloakIds : [] };

  if (game.kind === 'toy') {
    if (!SCENE_CATALOG[draft.sceneId]) {
      return {
        ok: false,
        error: `unknown sceneId "${draft.sceneId}"`,
        rule: 'world.draft.sceneId'
      };
    }
    next.storyBoard = draft.storyBoard ?? null;
    return { ok: true, draft: next };
  }

  // narrative: story-board vía registro de dialectos (tabla)
  const sb = normalizeStoryBoard(draft.storyBoard, { dialect: game.dialect });
  if (!sb.ok) return sb;
  next.storyBoard = sb.board;
  if (draft.sceneId && !SCENE_CATALOG[draft.sceneId]) {
    return {
      ok: false,
      error: `unknown sceneId "${draft.sceneId}"`,
      rule: 'world.draft.sceneId'
    };
  }
  return { ok: true, draft: next };
}

export function listMaterials() {
  return {
    scenes: Object.values(SCENE_CATALOG).map(({ id, label }) => ({ id, label })),
    lines: Object.values(LINE_CATALOG).map(({ id, label, kind }) => ({ id, label, kind })),
    games: Object.values(GAME_CATALOG).map(({ id, label, packageName, kind, dialect }) => ({
      id,
      label,
      packageName,
      kind,
      dialect: dialect || null
    })),
    dialects: Object.values(STORY_BOARD_DIALECTS).map(({ id, label }) => ({ id, label })),
    dialectIds: listStoryBoardDialectIds(),
    narrativeDefaults: {
      plaza: DEFAULT_PLAZA_STORY_BOARD
    }
  };
}
