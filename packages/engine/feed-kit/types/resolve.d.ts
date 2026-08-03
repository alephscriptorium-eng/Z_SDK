import type { FeedFamily } from './families.d.ts';
import type { FeedMcpPorts } from './mcp.d.ts';
import type { SyntheticFeed } from './synthetic.d.ts';

export type FeedMode = 'auto' | 'synthetic' | 'real';

/**
 * Resolved bag. Individual feed handles stay loosely typed: real MCP feeds
 * carry methods the runtime does not freeze into a public schema.
 */
export interface ResolvedFeedBag {
  mode: FeedMode | 'real' | 'synthetic';
  families: Partial<Record<FeedFamily, SyntheticFeed | Record<string, unknown>>>;
}

export declare function resolveRuntimeFeeds(opts?: {
  mode?: FeedMode;
  seed?: number;
  logger?: Console;
  mcpPorts?: FeedMcpPorts;
  host?: string;
  families?: FeedFamily[];
  streamCursor?: number;
  streamCorpus?: string;
  staticYears?: number[];
  gossipCorpora?: string[];
  requireForAuto?: ('stream' | 'static' | 'gossip')[];
}): Promise<ResolvedFeedBag>;
