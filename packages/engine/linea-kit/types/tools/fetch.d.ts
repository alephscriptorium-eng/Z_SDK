/**
 * Declarations for src/tools/fetch.mjs.
 * Materialize snapshot wikitext behind an explicit approval gate.
 * Nothing reaches disk without `approve: true`.
 */

import type { KitFailure } from '../common.js';

export interface FetchSnapshotOptions {
  satDir: string;
  oldid: number;
  /** Offline materialization: the caller supplies the body. */
  wikitext: string;
  /** The gate. `false` refuses with rule `fetch.approval_required`. */
  approve: boolean;
  approvalToken?: string;
  expectedToken?: string;
  sourceUrl?: string;
  title?: string;
  timestamp?: string;
  user?: string;
  parent_oldid?: number | null;
  bytes?: number;
}

export interface FetchSnapshotOk {
  ok: true;
  oldid: number;
  wikitextPath: string;
  metaPath: string;
  bytes: number;
  fetched_at: string;
}

/**
 * Refusals carry rule `fetch.sat_dir`, `fetch.oldid`, `fetch.wikitext`,
 * `fetch.approval_required`, `fetch.token_mismatch` or `fetch.meta_schema`.
 */
export declare function fetchSnapshot(
  options: FetchSnapshotOptions
): FetchSnapshotOk | KitFailure;
