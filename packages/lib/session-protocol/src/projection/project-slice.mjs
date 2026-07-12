import { SCENE_IDS, getSceneDeclaration } from './scenes.mjs';

/**
 * SessionManifest v2 (or compat snapshot with top-level mirrors).
 * @typedef {object} SessionSnapshot
 */

/**
 * @param {SessionSnapshot} session
 */
function readPlayhead(session) {
  return session.session?.playhead ?? session.playhead ?? { year: null, playing: false };
}

/**
 * Domain nodes view: map actors grouped by zone + ontologia.byNode overlays.
 * @param {SessionSnapshot} session
 */
export function buildDomainNodes(session) {
  const map = session.map ?? {};
  const byNode = session.ontologia?.byNode ?? {};
  const nodeIds = new Set([
    ...Object.keys(byNode),
    ...Object.values(map.actors ?? {}).map((a) => a.zone).filter(Boolean)
  ]);

  /** @type {Record<string, object>} */
  const nodes = {};
  for (const nodeId of nodeIds) {
    const actors = Object.fromEntries(
      Object.entries(map.actors ?? {}).filter(([, actor]) => actor.zone === nodeId)
    );
    nodes[nodeId] = {
      ...(byNode[nodeId] ?? {}),
      actors
    };
  }
  return nodes;
}

/**
 * @param {SessionSnapshot} session
 */
function projectTablero(session) {
  return {
    phase: session.session?.phase ?? session.phase,
    playhead: readPlayhead(session),
    sync: session.session?.sync ?? session.sync,
    activeCaso: session.session?.activeCaso ?? session.activeCaso,
    decks: session.decks ?? {},
    map: session.map ?? null,
    materiales: session.materiales ?? null,
    ontologia: session.ontologia ?? null,
    selections: session.ontologia?.selections ?? session.selections ?? null
  };
}

/**
 * Visor 3D slice: map (authoritative poses), playhead, deck B selection.
 * @param {SessionSnapshot} session
 */
function projectPlayer3d(session) {
  const map = session.map ?? {
    sceneId: null,
    tick: 0,
    actors: {},
    anchors: {}
  };
  const deckB = session.decks?.B;
  const deckBSelected =
    deckB?.resolved?.selected ??
    session.ontologia?.byNode?.['nodo-b']?.registro ??
    null;

  return {
    map,
    playhead: readPlayhead(session),
    deckBSelected,
    nodes: buildDomainNodes(session)
  };
}

/**
 * Firehose slice: deck C resolved payload + corpus/path context.
 * @param {SessionSnapshot} session
 */
function projectFirehose(session) {
  const deckC = session.decks?.C;
  const material = session.materiales?.byNode?.['nodo-b']?.find((m) => m.slot === 'firehose');
  const resolved = deckC?.resolved ?? material?.resolved ?? null;
  const corpus =
    resolved?.corpus ??
    session.ontologia?.byNode?.['nodo-b']?.micropost?.corpus ??
    'candidate';
  const selected = resolved?.selected;
  const selectedFilePath =
    selected?.handle ??
    selected?.file ??
    resolved?.path ??
    session.ontologia?.byNode?.['nodo-b']?.micropost?.file ??
    null;

  return {
    deckCResolved: resolved,
    resolved,
    corpus,
    path: resolved?.path ?? '',
    selectedFilePath,
    phase: deckC?.phase ?? material?.phase ?? 'empty'
  };
}

/**
 * View-ui slice: registros + wikitext cache surfaces.
 * @param {SessionSnapshot} session
 */
function projectViewUi(session) {
  const registros = session.ontologia?.byNode?.['nodo-b']?.registro ?? null;
  const deckA = session.decks?.A;
  const wikitext = deckA?.resolved?.wikitext ?? deckA?.resolved?.cached ?? null;
  return { registros, wikitext };
}

/**
 * Operator HUD slice: playhead, deck phases, attributed selections — no domain reconstruction.
 * @param {SessionSnapshot} session
 */
function projectOperator(session) {
  const decks = session.decks ?? {};
  const selections =
    session.ontologia?.selections ?? session.selections ?? { last: null, byActor: {}, log: [] };

  return {
    phase: session.session?.phase ?? session.phase ?? null,
    playhead: readPlayhead(session),
    decks: {
      A: decks.A?.phase ?? null,
      B: decks.B?.phase ?? null,
      C: decks.C?.phase ?? null
    },
    selections,
    selectionLast: selections.last ?? null
  };
}

/**
 * Project SessionManifest v2 into a scene-specific model.
 * @param {SessionSnapshot} session
 * @param {string} sceneId
 */
export function projectSlice(session, sceneId) {
  const decl = getSceneDeclaration(sceneId);

  switch (sceneId) {
    case SCENE_IDS.tablero:
      return { sceneId, declaration: decl, ...projectTablero(session) };
    case SCENE_IDS.player3d:
      return { sceneId, declaration: decl, ...projectPlayer3d(session) };
    case SCENE_IDS.firehose:
      return { sceneId, declaration: decl, ...projectFirehose(session) };
    case SCENE_IDS.viewUi:
      return { sceneId, declaration: decl, ...projectViewUi(session) };
    case SCENE_IDS.operator:
      return { sceneId, declaration: decl, ...projectOperator(session) };
    default:
      throw new Error(`Unknown sceneId: ${sceneId}`);
  }
}

/**
 * Deck context for firehose deep links (HTTP bridge).
 * @param {SessionSnapshot} session
 */
export function firehoseDeckContextFromSession(session) {
  const slice = projectFirehose(session);
  return {
    corpus: slice.corpus,
    path: slice.path || undefined,
    selectedFilePath: slice.selectedFilePath || undefined
  };
}
