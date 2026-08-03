/** Types for `@zeus/feed-kit` (prioridad H · feeds). */

export { FEED_FAMILIES, FEED_FAMILY_META, isFeedFamily } from './families.d.ts';
export type { FeedFamily, FeedFamilyMeta } from './families.d.ts';

export { makeFeedItem, withDropletAlias } from './item.d.ts';
export type { FeedItem, MakeFeedItemOpts } from './item.d.ts';

export {
  createRng,
  createSyntheticStreamFeed,
  createSyntheticGossipFeed,
  createSyntheticStaticFeed,
  createSyntheticFeedBag
} from './synthetic.d.ts';
export type { Rng, SyntheticFeed, SyntheticFeedBag } from './synthetic.d.ts';

export {
  parseToolJson,
  callToolJson,
  probeFeedMcpHealth,
  createFeedMcpClients
} from './mcp.d.ts';
export type {
  FeedMcpPorts,
  FeedRequireFamily,
  FeedMcpClients
} from './mcp.d.ts';

export { resolveRuntimeFeeds } from './resolve.d.ts';
export type { FeedMode, ResolvedFeedBag } from './resolve.d.ts';

export {
  DEFAULT_JETSTREAM_URL,
  FIREHOSE_VOLUME_ID,
  resolveFirehoseVolumeRoot,
  recordFirehoseSync,
  writeJetstreamPost,
  refreshFirehoseCorpusCounts,
  syncJetstreamFixture,
  syncJetstreamLive,
  runJetstreamSync,
  SAMPLE_POSTS
} from './jetstream.d.ts';
export type {
  FirehoseVolumeRoot,
  WriteJetstreamPostResult,
  JetstreamSyncResult
} from './jetstream.d.ts';

/** Re-exported from `@zeus/linea-kit/curation` at runtime — typed there. */
export {
  CURATION_STATUSES,
  normalizeCurationStatus,
  curationStatusFromCorpus,
  readCurationStatus
} from '@zeus/linea-kit/curation';
