/** Three feed families (DATOS.md §3). Browser-safe constants. */

export type FeedFamily = 'static' | 'stream' | 'gossip';

export interface FeedFamilyMeta {
  readonly nature: string;
  readonly volumeHint: string;
  readonly uriScheme: string;
}

export declare const FEED_FAMILIES: readonly FeedFamily[];

export declare const FEED_FAMILY_META: Readonly<Record<FeedFamily, FeedFamilyMeta>>;

export declare function isFeedFamily(value: unknown): value is FeedFamily;
