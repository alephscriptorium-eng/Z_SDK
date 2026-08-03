/**
 * MCP client helpers for feed loaders (node-only).
 * Client handle is opaque: presets-sdk's extractor shape is not re-declared here.
 */

export type FeedMcpPorts = {
  firehose?: { disk: number };
  lineas?: { espana?: number; wpHistoria?: number };
  ssb?: { disk: number };
};

export type FeedRequireFamily = 'stream' | 'static' | 'gossip';

export interface FeedMcpClients {
  firehose: unknown | null;
  wp: unknown | null;
  espana: unknown | null;
  ssb: unknown | null;
}

/** Parse a tool result's first text block as JSON. Throws if missing. */
export declare function parseToolJson(content: unknown): unknown;

export declare function callToolJson(
  client: unknown,
  name: string,
  args?: Record<string, unknown>
): Promise<unknown>;

export declare function probeFeedMcpHealth(
  ports: FeedMcpPorts | null | undefined,
  opts?: {
    timeoutMs?: number;
    host?: string;
    require?: FeedRequireFamily[];
  }
): Promise<boolean>;

export declare function createFeedMcpClients(
  ports: FeedMcpPorts | null | undefined,
  opts?: { host?: string; logger?: Console }
): Promise<FeedMcpClients>;
