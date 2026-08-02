/**
 * Append-only ops ledger (files-first). JSONL under VOLUMES root.
 * Node-only.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { resolveVolumesRoot } from '@zeus/presets-sdk/volumes';
import { assertLedgerPathPermitida } from './ledger-cerco.mjs';

export const DEFAULT_LEDGER_NAME = '.ops-ledger.jsonl';

/**
 * WP-U253 · una `ledgerPath` propuesta por el llamante pasa por el cerco
 * (`ledger-cerco.mjs`) antes de que nadie apende sobre ella: hasta este WP se
 * devolvía verbatim y sin validar, y bastaba proponerla apuntando a un
 * artefacto de máquina del root para apendar JSONL encima. Falla cerrado.
 * La AUSENCIA (omitida, undefined, null, cadena vacía) NO es una propuesta:
 * cae en la ruta segura por defecto dentro del root.
 *
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [opts]
 * @returns {string}
 * @throws {import('./ledger-cerco.mjs').LedgerPathDenegada} si la propuesta viola el cerco
 */
export function resolveOpsLedgerPath(opts = {}) {
  const root = opts.volumesRoot || resolveVolumesRoot();
  if (opts.ledgerPath) return assertLedgerPathPermitida(opts.ledgerPath, root);
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

  // `volumesRoot` viaja también en la relectura: sin él, el cerco de la
  // relectura mediría contra el root del entorno y denegaría una ruta legítima
  // cuando el llamante trabaja sobre un root explícito distinto.
  const prev = readOpsLedger({ volumesRoot: opts.volumesRoot, ledgerPath: path });
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
