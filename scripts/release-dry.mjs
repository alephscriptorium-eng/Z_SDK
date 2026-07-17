#!/usr/bin/env node
/**
 * release:dry — pack publicable @zeus engine packages and verify tarball contents.
 * No publish. No registry credentials. Local verification only (WP-U50).
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libDir = path.join(root, 'packages', 'lib');
const outDir = path.join(root, '.release-dry');
const REGISTRY = 'https://npm.scriptorium.escrivivir.co';
const LOCKSTEP = '0.1.0';

const FORBIDDEN_PREFIXES = ['node_modules/', 'test/', '.git/', '.env'];
const FORBIDDEN_NAMES = new Set(['.DS_Store', '.npmrc', '.env']);

function readPkg(dir) {
  return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

function listPublicable() {
  return readdirSync(libDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(libDir, d.name))
    .filter((dir) => {
      const pkg = readPkg(dir);
      return pkg.private !== true && pkg.publishConfig?.registry;
    })
    .sort();
}

/** Normalize npm pack --json file paths (no package/ prefix). */
function normalizePackPath(entry) {
  return String(entry).replace(/^package\//, '');
}

function matchesFilesField(relPath, files) {
  if (!files || files.length === 0) return true;
  return files.some((pattern) => {
    if (pattern.endsWith('/')) {
      return relPath === pattern.slice(0, -1) || relPath.startsWith(pattern);
    }
    if (relPath === pattern) return true;
    if (relPath.startsWith(pattern + '/')) return true;
    return false;
  });
}

function verifyTarball(pkgDir, pkg, entriesRaw) {
  const errors = [];
  const entries = entriesRaw.map(normalizePackPath);
  const files = pkg.files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    errors.push('missing package.json files[]');
  }

  if (pkg.version !== LOCKSTEP) {
    errors.push(`version ${pkg.version} ≠ lockstep ${LOCKSTEP}`);
  }

  if (pkg.publishConfig?.registry !== REGISTRY) {
    errors.push(`publishConfig.registry ≠ ${REGISTRY}`);
  }

  if (!existsSync(path.join(pkgDir, 'README.md'))) {
    errors.push('README.md missing on disk');
  }

  for (const entry of entries) {
    if (!entry || entry === 'package.json') continue;
    const base = path.posix.basename(entry);
    if (FORBIDDEN_NAMES.has(base)) {
      errors.push(`forbidden file in tarball: ${entry}`);
      continue;
    }
    if (FORBIDDEN_PREFIXES.some((p) => entry === p.slice(0, -1) || entry.startsWith(p))) {
      errors.push(`forbidden path in tarball: ${entry}`);
      continue;
    }
    // LICENSE* may be auto-included by npm; ignore
    if (entry === 'LICENSE' || entry === 'LICENSE.md') continue;
    if (files && !matchesFilesField(entry, files)) {
      errors.push(`path not covered by files[]: ${entry}`);
    }
  }

  for (const pattern of files || []) {
    const needle = pattern.endsWith('/') ? pattern.slice(0, -1) : pattern;
    const found = entries.some(
      (e) => e === needle || e.startsWith(needle + '/') || e === pattern
    );
    if (!found) {
      errors.push(`files[] entry missing from tarball: ${pattern}`);
    }
  }

  const exports = pkg.exports;
  if (exports && typeof exports === 'object') {
    const targets = [];
    const walk = (v) => {
      if (typeof v === 'string') targets.push(v);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    walk(exports);
    for (const t of targets) {
      if (!t.startsWith('./')) continue;
      const rel = t.slice(2);
      if (!entries.includes(rel) && !entries.some((e) => e.startsWith(rel + '/'))) {
        errors.push(`exports target missing from tarball: ${t}`);
      }
    }
  }

  if (pkg.bin) {
    const bins = typeof pkg.bin === 'string' ? [pkg.bin] : Object.values(pkg.bin);
    for (const b of bins) {
      const rel = b.replace(/^\.\//, '');
      if (!entries.includes(rel)) errors.push(`bin missing from tarball: ${b}`);
    }
  }

  return { errors, entryCount: entries.length };
}

function packOne(pkgDir, pkg) {
  // --json lists packed files without relying on system tar (Windows Git tar
  // misreads drive-letter paths as host:file).
  const r = spawnSync('npm', ['pack', '--json', '--pack-destination', outDir], {
    cwd: pkgDir,
    encoding: 'utf8',
    shell: true
  });
  if (r.status !== 0) {
    throw new Error(`npm pack failed for ${pkg.name}:\n${r.stderr || r.stdout}`);
  }
  let parsed;
  try {
    const out = (r.stdout || '').trim();
    const start = out.indexOf('[');
    const startObj = out.indexOf('{');
    const jsonStart =
      start === -1 ? startObj : startObj === -1 ? start : Math.min(start, startObj);
    if (jsonStart < 0) throw new Error('no JSON');
    parsed = JSON.parse(out.slice(jsonStart));
  } catch {
    throw new Error(`could not parse npm pack --json for ${pkg.name}: ${r.stdout}`);
  }
  const meta = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!meta?.filename) {
    throw new Error(`npm pack --json missing filename for ${pkg.name}`);
  }
  const entryPaths = (meta.files || []).map((f) => (typeof f === 'string' ? f : f.path));
  return {
    tgz: path.join(outDir, path.basename(meta.filename)),
    entries: entryPaths
  };
}

function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const dirs = listPublicable();
  if (dirs.length === 0) {
    console.error('release:dry — no publicable packages found under packages/lib/');
    process.exit(1);
  }

  console.log(`release:dry — ${dirs.length} publicable package(s), lockstep ${LOCKSTEP}`);
  console.log(`registry: ${REGISTRY}`);
  console.log(`outdir:   ${outDir}`);
  console.log('');

  let failed = 0;

  for (const dir of dirs) {
    const pkg = readPkg(dir);
    process.stdout.write(`pack ${pkg.name}@${pkg.version} … `);
    try {
      const { tgz, entries } = packOne(dir, pkg);
      if (!existsSync(tgz)) {
        throw new Error(`tarball not written: ${tgz}`);
      }
      const { errors, entryCount } = verifyTarball(dir, pkg, entries);
      if (errors.length) {
        failed += 1;
        console.log('FAIL');
        for (const e of errors) console.log(`  - ${e}`);
      } else {
        console.log(`ok (${entryCount} entries, ${path.basename(tgz)})`);
      }
    } catch (err) {
      failed += 1;
      console.log('FAIL');
      console.log(`  - ${err.message}`);
    }
  }

  console.log('');
  if (failed) {
    console.error(`release:dry — ${failed}/${dirs.length} failed`);
    process.exit(1);
  }
  console.log(`release:dry — all ${dirs.length} green`);
}

main();
