/**
 * Wiki GraphSource — article link graph + fetchSnapshot materialization.
 * Callers supply link adjacency and offline wikitext; the kit gate
 * (`approve`) is mandatory for disk writes.
 */

import { fetchSnapshot } from '../../tools/fetch.mjs';

/**
 * @param {{
 *   links: Record<string, string[]>,
 *   titles?: Record<string, string>,
 *   satDir?: string,
 *   wikitextByNode?: Record<string, { oldid: number, wikitext: string, title?: string }>,
 *   approve?: boolean,
 *   approvalToken?: string,
 *   expectedToken?: string
 * }} options
 */
export function createWikiGraphSource(options) {
  const links = options.links ?? {};
  const titles = options.titles ?? {};
  const wikitextByNode = options.wikitextByNode ?? {};
  const satDir = options.satDir;

  return {
    kind: 'wiki',
    getNode(id) {
      if (!(id in links) && !(id in wikitextByNode) && !(id in titles)) {
        // Still allow destination-only leaves that appear only as edge targets.
        const isTarget = Object.values(links).some((arr) => arr.includes(id));
        if (!isTarget) return null;
      }
      return {
        id,
        label: titles[id] ?? id,
        meta: { source: 'wiki-links' }
      };
    },
    neighbors(id) {
      const outs = links[id] ?? [];
      return outs.map((to) => ({
        id: `${id}->${to}`,
        to,
        label: 'wiki-link'
      }));
    },
    /**
     * Materialize a node snapshot via kit fetchSnapshot (approval gate).
     * @param {string} nodeId
     */
    materializeNode(nodeId) {
      if (!satDir) {
        return {
          ok: false,
          error: 'satDir required for wiki materializeNode',
          rule: 'viaje.wiki.sat_dir'
        };
      }
      const payload = wikitextByNode[nodeId];
      if (!payload) {
        return {
          ok: false,
          error: `No offline wikitext for node ${nodeId}`,
          rule: 'viaje.wiki.wikitext'
        };
      }
      const result = fetchSnapshot({
        satDir,
        oldid: payload.oldid,
        wikitext: payload.wikitext,
        title: payload.title ?? titles[nodeId] ?? nodeId,
        approve: options.approve === true,
        approvalToken: options.approvalToken,
        expectedToken: options.expectedToken
      });
      if (!result.ok) return result;
      return {
        ok: true,
        node_id: nodeId,
        oldid: result.oldid,
        wikitext_path: result.wikitextPath,
        meta_path: result.metaPath,
        fetched_at: result.fetched_at
      };
    }
  };
}
