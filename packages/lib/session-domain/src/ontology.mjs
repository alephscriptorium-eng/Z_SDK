import { nodeIdForDeck } from './bindings.mjs';

/**
 * @param {object} selections
 * @param {Record<string, object>} decks
 * @param {Record<string, object>} [patches]
 */
export function buildOntologia(selections, decks = {}, patches = {}) {
  /** @type {Record<string, object>} */
  const byNode = { ...patches };

  const bResolved = decks.B?.resolved;
  const selected = bResolved?.selected;
  if (selected?.oldid != null) {
    byNode['nodo-b'] = {
      ...byNode['nodo-b'],
      registro: {
        oldid: selected.oldid,
        label: selected.label ?? selected.title ?? undefined
      }
    };
  }

  const cResolved = decks.C?.resolved;
  if (cResolved?.kind === 'firehose' || cResolved?.selected) {
    const micropost = cResolved.selected?.handle ?? cResolved.selected?.file
      ? {
          file: cResolved.selected?.handle ?? cResolved.selected?.file,
          corpus: cResolved.corpus ?? undefined
        }
      : cResolved.path
        ? { file: cResolved.path, corpus: cResolved.corpus ?? undefined }
        : undefined;
    if (micropost) {
      byNode['nodo-b'] = { ...byNode['nodo-b'], micropost };
    }
  }

  return {
    selections: enhanceSelections(selections),
    byNode
  };
}

/**
 * @param {object|null|undefined} selections
 */
function enhanceSelections(selections) {
  const base = selections ?? { last: null, byActor: {}, log: [] };
  const withNode = (entry) => {
    if (!entry) return null;
    const nodeId = entry.nodeId ?? nodeIdForDeck(entry.deckId ?? 'B');
    return { ...entry, nodeId };
  };

  return {
    last: withNode(base.last),
    byActor: Object.fromEntries(
      Object.entries(base.byActor ?? {}).map(([id, entry]) => [id, withNode(entry)])
    ),
    log: (base.log ?? []).map((entry) => withNode(entry))
  };
}
