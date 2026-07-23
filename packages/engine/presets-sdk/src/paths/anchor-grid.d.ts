/** Types for `@zeus/presets-sdk/anchor-grid` (WP-U156). */

export const STUB_BYTE_THRESHOLD: number;

export function buildAnchorGrid(opts?: {
  lineaId?: string;
  cachedOldids?: Array<number | string>;
  wikitextLengths?: Record<string, number>;
  paths?: object;
  basePath?: string;
  cacheDir?: string | null;
  includeWikitextPath?: boolean;
  lineaEntry?: object | null;
  manifest?: object | null;
  anchors?: object | null;
}): { error?: string; linea?: object; cells?: unknown[]; [key: string]: unknown };
