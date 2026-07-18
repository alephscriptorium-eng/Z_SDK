/**
 * Feed item envelope shared by all families.
 */

import { curationStatusFromCorpus, normalizeCurationStatus } from '@zeus/linea-kit/curation';

/**
 * @typedef {object} FeedItem
 * @property {import('./families.mjs').FeedFamily} family
 * @property {string} kind
 * @property {string} uri
 * @property {number} [index]
 * @property {string} [corpus]
 * @property {string|null} [curation_status]
 * @property {string} [text]
 * @property {object} [meta]
 */

/**
 * @param {{
 *   family: import('./families.mjs').FeedFamily,
 *   kind: string,
 *   uri: string,
 *   index?: number,
 *   corpus?: string,
 *   curation_status?: string|null,
 *   text?: string,
 *   meta?: object
 * }} opts
 * @returns {FeedItem}
 */
export function makeFeedItem(opts) {
  const corpus = opts.corpus ?? null;
  const fromCorpus = corpus ? curationStatusFromCorpus(corpus) : null;
  const curation =
    normalizeCurationStatus(opts.curation_status) ?? fromCorpus ?? null;
  return {
    family: opts.family,
    kind: opts.kind,
    uri: opts.uri,
    ...(opts.index != null ? { index: opts.index } : {}),
    ...(corpus ? { corpus } : {}),
    curation_status: curation,
    ...(opts.text != null ? { text: opts.text } : {}),
    ...(opts.meta ? { meta: opts.meta } : {})
  };
}

/**
 * Wrap a feed handle so `nextDroplets` aliases `nextItems` (flow engines).
 * @param {object} feed
 */
export function withDropletAlias(feed) {
  if (typeof feed.nextItems !== 'function') return feed;
  if (typeof feed.nextDroplets === 'function') return feed;
  return {
    ...feed,
    nextDroplets(count = 1) {
      return feed.nextItems(count);
    }
  };
}
