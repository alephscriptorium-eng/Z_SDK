import type { FeedFamily } from './families.d.ts';

/**
 * Feed item envelope shared by all families.
 * `meta` stays open: the runtime copies the caller object without validating keys.
 */
export interface FeedItem {
  family: FeedFamily;
  kind: string;
  uri: string;
  index?: number;
  corpus?: string;
  curation_status?: string | null;
  text?: string;
  meta?: Record<string, unknown>;
}

export interface MakeFeedItemOpts {
  family: FeedFamily;
  kind: string;
  uri: string;
  index?: number;
  corpus?: string;
  curation_status?: string | null;
  text?: string;
  meta?: Record<string, unknown>;
}

export declare function makeFeedItem(opts: MakeFeedItemOpts): FeedItem;

/**
 * Wrap a feed handle so `nextDroplets` aliases `nextItems` (flow engines).
 * Unknown-shaped feed: only `nextItems` is consulted.
 */
export declare function withDropletAlias<T extends object>(feed: T): T;
