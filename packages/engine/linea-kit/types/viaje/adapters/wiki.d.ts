/**
 * Declarations for src/viaje/adapters/wiki.mjs.
 * Article link graph plus `fetchSnapshot` materialization behind the approval gate.
 */

import type { GraphSource } from '../graph-source.js';
import type { MaterializeNodeResult } from '../run.js';

export interface WikiNodePayload {
  oldid: number;
  wikitext: string;
  title?: string;
}

export interface WikiGraphSourceOptions {
  /** Node id → outgoing link targets. */
  links: Record<string, string[]>;
  titles?: Record<string, string>;
  /** Required for `materializeNode` to write anything. */
  satDir?: string;
  wikitextByNode?: Record<string, WikiNodePayload>;
  /** The kit gate: writes are refused unless this is exactly `true`. */
  approve?: boolean;
  approvalToken?: string;
  expectedToken?: string;
}

/**
 * A GraphSource that also knows how to materialize one node, so it can be
 * passed straight to `runViaje` as both `source` and `materializeNode`.
 */
export interface WikiGraphSource extends GraphSource {
  kind: 'wiki';
  materializeNode: (nodeId: string) => MaterializeNodeResult;
}

export declare function createWikiGraphSource(
  options: WikiGraphSourceOptions
): WikiGraphSource;
