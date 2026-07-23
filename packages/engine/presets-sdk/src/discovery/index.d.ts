/** Types for `@zeus/presets-sdk/discovery` (WP-U156). */

export interface DiscoveryPortRange {
  host?: string;
  from: number;
  to: number;
}

export interface DiscoveryStaticEntry {
  name?: string;
  url: string;
  transport?: string;
}

export interface DiscoverOptions {
  urls?: string[];
  portRange?: DiscoveryPortRange;
  staticList?: DiscoveryStaticEntry[];
  timeoutMs?: number;
  probePath?: string;
}

export interface DiscoveredServer {
  name: string;
  url: string;
  transport: 'http';
}

export function discoverServers(options?: DiscoverOptions): Promise<DiscoveredServer[]>;
export function syncDiscoveredServers(
  options?: DiscoverOptions & { dataDir?: string }
): Promise<unknown>;

export const DEFAULT_ZEUS_DISCOVERY: object;
export const DEFAULT_ZEUS_MCP: Record<string, Record<string, number>>;
export const DEFAULT_ZEUS_UI_MESH: Record<string, object>;
export function resolveDiscoverySources(opts?: object): object;

export function resolveUiMesh(opts?: {
  dataDir?: string;
  localConfig?: object;
  selfUiId?: string | null;
}): { entries: Array<Record<string, unknown>>; uis: Record<string, object> };
export function buildUiHref(entry: {
  url?: string;
  host?: string;
  port?: number;
  path?: string;
}): string;
export function resolveNavHref(
  entry: { id?: string; path?: string; url?: string; host?: string; port?: number },
  selfUiId: string | null
): string;
export function isNavExternal(selfUiId: string | null, entryId: string): boolean;
