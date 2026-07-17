/**
 * Sync CLI: export SSB JSON log → DISK_04/SSB (files-first; not a daemon).
 *
 * Env (runbook):
 *   ZEUS_VOLUMES_ROOT  — VOLUMES root (required for live sync)
 *   ZEUS_SSB_LOG_PATH  — path to JSON log dump from the OASIS pub
 *   ZEUS_SSB_PUB_URL   — provenance annotation only (no network in this CLI)
 *
 * Usage:
 *   npm run sync -w @zeus/ssb-system
 *   npm run sync -w @zeus/ssb-system -- --fixture
 *   node src/sync-cli.mjs --log <path> --volumes <VOLUMES>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadZeusEnv, resolveVolumesRoot, isMainModule } from '@zeus/presets-sdk';
import { exportSsbLogFile } from './export.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const FIXTURE_LOG = path.join(PKG_ROOT, 'fixtures', 'ssb-log.json');

/**
 * @param {string[]} argv
 */
export function parseSyncArgs(argv) {
  /** @type {{ logPath?: string, volumesRoot?: string, fixture?: boolean }} */
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--fixture') out.fixture = true;
    else if (a === '--log') out.logPath = argv[++i];
    else if (a === '--volumes') out.volumesRoot = argv[++i];
  }
  return out;
}

/**
 * @param {{ logPath?: string, volumesRoot?: string, fixture?: boolean }} [opts]
 */
export function runSsbSync(opts = {}) {
  loadZeusEnv();
  const logPath =
    opts.logPath ||
    (opts.fixture ? FIXTURE_LOG : null) ||
    process.env.ZEUS_SSB_LOG_PATH ||
    null;
  if (!logPath) {
    return {
      ok: false,
      error:
        'Set ZEUS_SSB_LOG_PATH, pass --log <path>, or use --fixture for the package offline log'
    };
  }
  if (!fs.existsSync(logPath)) {
    return { ok: false, error: `SSB log not found: ${logPath}` };
  }

  const volumesRoot =
    opts.volumesRoot || process.env.ZEUS_VOLUMES_ROOT || resolveVolumesRoot();

  const provenance = {
    pubUrl: process.env.ZEUS_SSB_PUB_URL || null,
    logPath: path.resolve(logPath),
    note: 'Sync copies typed tribe*/parliament*/votes* messages to JSON on disk; no live gossip daemon.'
  };

  const result = exportSsbLogFile({
    logPath,
    volumesRoot,
    provenance
  });

  return { ok: true, ...result, provenance };
}

if (isMainModule(import.meta.url)) {
  const parsed = parseSyncArgs(process.argv.slice(2));
  const result = runSsbSync(parsed);
  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify(
        {
          ok: true,
          ssbRoot: result.ssbRoot,
          counts: result.counts,
          skipped: result.skipped,
          total: result.total,
          syncedAt: result.manifest?.syncedAt
        },
        null,
        2
      )
    );
  }
}
