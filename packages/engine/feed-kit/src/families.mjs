/**
 * Three feed families (DATOS.md §3). Browser-safe constants.
 */

/** @typedef {'static'|'stream'|'gossip'} FeedFamily */

/** @type {readonly FeedFamily[]} */
export const FEED_FAMILIES = Object.freeze(['static', 'stream', 'gossip']);

/** @type {Readonly<Record<FeedFamily, { nature: string, volumeHint: string, uriScheme: string }>>} */
export const FEED_FAMILY_META = Object.freeze({
  static: {
    nature: 'authority-snapshots',
    volumeHint: 'DISK_02/LINEAS',
    uriScheme: 'linea'
  },
  stream: {
    nature: 'continuous-firehose',
    volumeHint: 'DISK_01/FIREHOSE',
    uriScheme: 'firehose'
  },
  gossip: {
    nature: 'append-only-peers',
    volumeHint: 'DISK_04/SSB',
    uriScheme: 'ssb'
  }
});

/**
 * @param {unknown} value
 * @returns {value is FeedFamily}
 */
export function isFeedFamily(value) {
  return FEED_FAMILIES.includes(/** @type {FeedFamily} */ (value));
}
