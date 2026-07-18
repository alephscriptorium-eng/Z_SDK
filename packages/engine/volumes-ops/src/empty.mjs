/**
 * Role-gated volume empty (DATOS.md §4).
 * Operator = hard purge + ledger. Player/dj hard purge = rejected.
 * empty_playable records a ledger seat without deleting files.
 * Node-only.
 */

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertIntentRole,
  resolveIntentRole
} from '@zeus/protocol';
import {
  curationStatusFromCorpus,
  isCanonStatus
} from '@zeus/linea-kit/curation';
import { resolveVolume } from '@zeus/presets-sdk/volumes';
import { VOLUMES_OPS_CATALOG } from './catalog.mjs';
import { appendOpsLedger } from './ledger.mjs';
import { measurePath } from './measure.mjs';
import { syncVolumeCounters } from './counters.mjs';

/** Default empty targets: soft / uncurated corpora (DATOS §4). */
export const DEFAULT_SOFT_CORPUS_STATUSES = Object.freeze([
  'raw',
  'discarded',
  'candidate',
  'pending',
  'draft',
  'triaged',
  'rumor',
  'proposal'
]);

/**
 * @param {string} corpusId
 * @returns {boolean}
 */
export function isSoftEmptyTarget(corpusId) {
  const status = curationStatusFromCorpus(corpusId);
  if (!status) return true;
  if (isCanonStatus(status)) return false;
  return DEFAULT_SOFT_CORPUS_STATUSES.includes(status);
}

/**
 * Delete all files/dirs under absPath, keeping the directory itself.
 * @param {string} absPath
 * @returns {{ removedEntries: number, bytesFreed: number }}
 */
export function clearDirectoryContents(absPath) {
  if (!existsSync(absPath)) {
    return { removedEntries: 0, bytesFreed: 0 };
  }
  const before = measurePath(absPath);
  let removedEntries = 0;
  const entries = readdirSync(absPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(absPath, entry.name);
    rmSync(full, { recursive: true, force: true });
    removedEntries += 1;
  }
  return { removedEntries, bytesFreed: before.bytes };
}

/**
 * @param {object} opts
 * @param {string} opts.volumeId
 * @param {string} [opts.corpusId] — if omitted, empties soft corpora only
 * @param {string} [opts.role]
 * @param {string} [opts.actorId]
 * @param {string} [opts.intent='empty_volume']
 * @param {boolean} [opts.forceCurated=false] — allow emptying canon corpora (still operator)
 * @param {{ volumesRoot?: string, ledgerPath?: string }} [opts.ledger]
 * @returns {object}
 */
export function emptyVolume(opts) {
  const {
    volumeId,
    corpusId = null,
    actorId = 'ops',
    intent = 'empty_volume',
    forceCurated = false,
    ledger: ledgerOpts = {}
  } = opts;

  const role = resolveIntentRole({ role: opts.role });
  // Role gate only (local ops, not room wire) — no makeIntent/game envelope.
  const auth = assertIntentRole({ actorId, intent, role }, VOLUMES_OPS_CATALOG);
  if (!auth.ok) {
    return {
      ok: false,
      error: auth.error,
      role,
      intent,
      volumeId,
      corpusId
    };
  }

  if (intent === 'empty_playable') {
    const seat = appendOpsLedger(
      {
        kind: 'empty_playable',
        intent,
        role,
        actorId,
        volumeId,
        corpusId,
        purged: false,
        note: 'playable request recorded; no hard disk purge'
      },
      ledgerOpts
    );
    return {
      ok: true,
      purged: false,
      playable: true,
      role,
      intent,
      volumeId,
      corpusId,
      ledger: seat
    };
  }

  // Hard purge path (empty_volume) — operator only via catalog.
  const volume = resolveVolume(volumeId);
  /** @type {{ id: string, path: string, absPath: string }[]} */
  const targets = [];

  if (corpusId) {
    const entry = (volume.corpora || []).find((c) => c.id === corpusId);
    if (!entry) {
      return {
        ok: false,
        error: 'corpus_no_encontrado',
        role,
        intent,
        volumeId,
        corpusId
      };
    }
    if (!forceCurated && !isSoftEmptyTarget(corpusId)) {
      // Canon/curated weigh more (DATOS §4): operator must set forceCurated.
      return {
        ok: false,
        error: 'corpus_curado_requiere_force',
        role,
        intent,
        volumeId,
        corpusId
      };
    }
    targets.push({
      id: entry.id,
      path: entry.path || entry.id,
      absPath: join(volume.absPath, entry.path || entry.id)
    });
  } else {
    const corpora = volume.corpora || [];
    if (corpora.length === 0) {
      // No corpora list: clear volume root contents (synthetic fixtures).
      targets.push({
        id: volumeId,
        path: '.',
        absPath: volume.absPath
      });
    } else {
      for (const entry of corpora) {
        if (!forceCurated && !isSoftEmptyTarget(entry.id)) continue;
        targets.push({
          id: entry.id,
          path: entry.path || entry.id,
          absPath: join(volume.absPath, entry.path || entry.id)
        });
      }
    }
  }

  const purged = [];
  let bytesFreed = 0;
  for (const t of targets) {
    if (!existsSync(t.absPath)) {
      purged.push({ ...t, removedEntries: 0, bytesFreed: 0, missing: true });
      continue;
    }
    const st = statSync(t.absPath);
    if (!st.isDirectory()) {
      rmSync(t.absPath, { force: true });
      purged.push({ ...t, removedEntries: 1, bytesFreed: st.size, missing: false });
      bytesFreed += st.size;
      continue;
    }
    const result = clearDirectoryContents(t.absPath);
    purged.push({ ...t, ...result, missing: false });
    bytesFreed += result.bytesFreed;
  }

  const counters = syncVolumeCounters(volumeId);
  const seat = appendOpsLedger(
    {
      kind: 'empty_volume',
      intent,
      role,
      actorId,
      volumeId,
      corpusId,
      purged: true,
      targets: purged.map((p) => ({
        id: p.id,
        path: p.path,
        removedEntries: p.removedEntries,
        bytesFreed: p.bytesFreed
      })),
      bytesFreed,
      counters: { files: counters.files, bytes: counters.bytes }
    },
    ledgerOpts
  );

  return {
    ok: true,
    purged: true,
    playable: false,
    role,
    intent,
    volumeId,
    corpusId,
    bytesFreed,
    targets: purged,
    counters,
    ledger: seat
  };
}
