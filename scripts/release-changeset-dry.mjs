#!/usr/bin/env node
/**
 * release:changeset-dry — local CA path without publish (WP-U53).
 *
 * 1. Require pending changesets (backed up before version consumes them)
 * 2. Apply `changeset version` (bump + changelog)
 * 3. Run `release:dry` (npm pack + verify)
 * 4. Restore package.json versions + re-write pending changesets for CI
 *
 * Never calls npm publish. Never pushes. Never tags remotes.
 *
 * Note: `changeset status` needs a local baseBranch ref; this script skips
 * status and goes straight to version (sufficient for CA dry-run).
 */
import { spawnSync } from 'node:child_process';
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  mkdirSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changesetDir = path.join(root, '.changeset');
const engineDir = path.join(root, 'packages', 'engine');

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    stdio: opts.stdio ?? 'pipe',
    env: { ...process.env, ...opts.env }
  });
}

function listPendingChangesets() {
  if (!existsSync(changesetDir)) return [];
  return readdirSync(changesetDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
}

function backupPendingChangesets() {
  const pending = listPendingChangesets();
  const dir = path.join(os.tmpdir(), `zeus-changeset-dry-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const name of pending) {
    const src = path.join(changesetDir, name);
    const dest = path.join(dir, name);
    const body = readFileSync(src, 'utf8');
    writeFileSync(dest, body);
    files.push({ name, body });
  }
  return { dir, files };
}

function restorePendingChangesets(backup) {
  mkdirSync(changesetDir, { recursive: true });
  for (const { name, body } of backup.files) {
    writeFileSync(path.join(changesetDir, name), body);
  }
}

function removeEngineChangelogs() {
  if (!existsSync(engineDir)) return;
  for (const d of readdirSync(engineDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const cl = path.join(engineDir, d.name, 'CHANGELOG.md');
    if (existsSync(cl)) unlinkSync(cl);
  }
}

function restoreAfterDryRun(backup) {
  // Only revert version bumps from `changeset version`, not other package docs/edits.
  const pjs = [];
  if (existsSync(engineDir)) {
    for (const d of readdirSync(engineDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const pj = path.join('packages', 'engine', d.name, 'package.json');
      if (existsSync(path.join(root, pj))) pjs.push(pj);
    }
  }
  if (pjs.length) {
    const checkout = run('git', ['checkout', '--', ...pjs]);
    if (checkout.status !== 0) {
      console.error(checkout.stderr || checkout.stdout);
      throw new Error('git checkout restore failed');
    }
  }
  removeEngineChangelogs();
  restorePendingChangesets(backup);
}

function summarizeBumps() {
  const rows = [];
  for (const d of readdirSync(engineDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const pj = path.join(engineDir, d.name, 'package.json');
    if (!existsSync(pj)) continue;
    const pkg = JSON.parse(readFileSync(pj, 'utf8'));
    if (pkg.private === true || !pkg.publishConfig?.registry) continue;
    const cl = path.join(engineDir, d.name, 'CHANGELOG.md');
    rows.push({
      name: pkg.name,
      version: pkg.version,
      changelog: existsSync(cl)
    });
  }
  return rows;
}

function main() {
  console.log('release:changeset-dry — no publish, restore after verify\n');

  const pending = listPendingChangesets();
  if (pending.length === 0) {
    console.error('No pending changesets under .changeset/*.md');
    process.exit(1);
  }
  console.log(`pending changesets (${pending.length}):`);
  for (const f of pending) console.log(`  - ${f}`);
  console.log('');

  const backup = backupPendingChangesets();

  console.log('→ changeset version');
  const versioned = run('npx', ['changeset', 'version'], { stdio: 'inherit' });
  if (versioned.status !== 0) {
    console.error('changeset version failed; attempting restore…');
    try {
      restoreAfterDryRun(backup);
    } catch {
      /* best-effort */
    }
    process.exit(versioned.status ?? 1);
  }

  const bumps = summarizeBumps();
  const withChangelog = bumps.filter((b) => b.changelog);
  const touched = bumps.filter((b) => b.changelog || b.version !== '0.1.0');
  const versions = new Set(bumps.map((b) => b.version));
  console.log(`\nbumps after version (${versions.size} distinct version(s)):`);
  for (const b of touched) {
    const mark = b.changelog ? 'CHANGELOG' : 'dep bump';
    console.log(`  ${b.name}@${b.version}  [${mark}]`);
  }
  if (withChangelog.length === 0) {
    console.error('expected at least one CHANGELOG.md after version');
    restoreAfterDryRun(backup);
    process.exit(1);
  }
  console.log('');

  console.log('→ release:dry (npm pack + verify)');
  const dry = run('node', ['scripts/release-dry.mjs'], { stdio: 'inherit' });
  const dryOk = dry.status === 0;

  console.log('\n→ restore working tree (re-write pending changesets for CI)');
  restoreAfterDryRun(backup);

  const pendingAfter = listPendingChangesets();
  if (pendingAfter.length !== pending.length) {
    console.error(
      `restore incomplete: pending ${pendingAfter.length} ≠ ${pending.length}`
    );
    process.exit(1);
  }

  if (!dryOk) {
    console.error('release:changeset-dry — release:dry failed (tree restored)');
    process.exit(1);
  }

  console.log(
    'release:changeset-dry — green (bump + changelog + pack; publish skipped)'
  );
  console.log(
    '⏳ npm publish / git tag / GitHub Release: only from CI with NPM_TOKEN'
  );
}

main();
