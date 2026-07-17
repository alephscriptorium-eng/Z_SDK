/**
 * Append-only ops ledger (files-first). JSONL under VOLUMES root.
 * Node-only.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveVolumesRoot } from '@zeus/presets-sdk/volumes';

export const DEFAULT_LEDGER_NAME = '.ops-ledger.jsonl';

/**
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [opts]
 * @returns {string}
 */
export function resolveOpsLedgerPath(opts = {}) {
  if (opts.ledgerPath) return opts.ledgerPath;
  const root = opts.volumesRoot || resolveVolumesRoot();
  return join(root, DEFAULT_LEDGER_NAME);
}

/**
 * @param {object} entry
 * @param {{ volumesRoot?: string, ledgerPath?: string, ts?: number }} [opts]
 * @returns {object} written entry (with seq/ts)
 */
export function appendOpsLedger(entry, opts = {}) {
  const path = resolveOpsLedgerPath(opts);
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const prev = readOpsLedger({ ledgerPath: path });
  const seq = prev.length === 0 ? 1 : (prev[prev.length - 1].seq || prev.length) + 1;
  const record = {
    v: 1,
    seq,
    ts: opts.ts ?? Date.now(),
    kind: entry.kind || 'ops',
    ...entry
  };
  appendFileSync(path, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

/**
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [opts]
 * @returns {object[]}
 */
export function readOpsLedger(opts = {}) {
  const path = resolveOpsLedgerPath(opts);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  if (!text.trim()) return [];
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}
