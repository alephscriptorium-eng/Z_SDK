/**
 * Invoke WP-U62 Notario against the games-library (spawn, no reinvent).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { resolveGamesLibraryRoot, resolveNotarioScript } from './resolve-library.mjs';

/**
 * @param {{
 *   game?: string,
 *   libraryRoot?: string,
 *   dryRun?: boolean,
 *   skipTests?: boolean,
 *   publishGithub?: boolean
 * }} [opts]
 */
export function runNotarioRelease(opts = {}) {
  const libraryRoot = resolveGamesLibraryRoot({ libraryRoot: opts.libraryRoot });
  const script = resolveNotarioScript(libraryRoot);
  const game = opts.game || 'sketch';
  const args = [script, '--game', game];
  if (opts.dryRun) args.push('--dry-run');
  if (opts.skipTests) args.push('--skip-tests');
  if (opts.publishGithub) args.push('--publish-github');

  const res = spawnSync(process.execPath, args, {
    cwd: libraryRoot,
    encoding: 'utf8',
    shell: false,
    env: { ...process.env }
  });

  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  const outDir = path.join(libraryRoot, '.release-startpack');
  let tarball = null;
  if (existsSync(outDir)) {
    const tgz = readdirSync(outDir).filter((f) => f.endsWith('.tgz') && f.includes(game));
    if (tgz.length) {
      tarball = path.join(outDir, tgz[tgz.length - 1]);
    }
  }

  const summaryMatch = stdout.match(/\{[\s\S]*"tarball"[\s\S]*\}/);
  let summary = null;
  if (summaryMatch) {
    try {
      summary = JSON.parse(summaryMatch[0]);
      if (summary.tarball) tarball = summary.tarball;
    } catch {
      // ignore parse noise from mixed console output
    }
  }

  return {
    ok: res.status === 0,
    status: res.status,
    libraryRoot,
    game,
    tarball,
    summary,
    stdout,
    stderr,
    error: res.status === 0 ? null : (stderr || stdout || `notario exit ${res.status}`).trim()
  };
}
