import type { FeedFamily } from './families.d.ts';
import type { FeedItem } from './item.d.ts';

export type Rng = () => number;

export interface SyntheticFeed {
  family: FeedFamily;
  kind: 'synthetic';
  nextItems(count?: number): FeedItem[];
  nextDroplets?(count?: number): FeedItem[];
  commitLabel?(
    ref: unknown,
    label: unknown
  ): Promise<{ ok: true; committed: false; mode: 'synthetic' }>;
  materialize?(
    anchor: unknown,
    approval?: string
  ): Promise<{ ok: true; committed: false; mode: 'synthetic' }>;
}

export interface SyntheticFeedBag {
  mode: 'synthetic';
  families: {
    static: SyntheticFeed;
    stream: SyntheticFeed;
    gossip: SyntheticFeed;
  };
}

/** PRNG determinista (mulberry32). */
export declare function createRng(seed?: number): Rng;

export declare function createSyntheticStreamFeed(opts?: {
  seed?: number;
}): SyntheticFeed;

export declare function createSyntheticGossipFeed(opts?: {
  seed?: number;
}): SyntheticFeed;

export declare function createSyntheticStaticFeed(opts?: {
  seed?: number;
  anchors?: number[];
}): SyntheticFeed;

export declare function createSyntheticFeedBag(opts?: {
  seed?: number;
}): SyntheticFeedBag;
