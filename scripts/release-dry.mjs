#!/usr/bin/env node
/**
 * release:dry — pack publicable @zeus engine packages and verify tarball contents.
 * No publish. No registry credentials. Local verification only (WP-U50 / U53).
 * Versions are independent per package (changesets); lockstep check demolished in U53.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const libDir = path.join(root, 'packages', 'engine');
const outDir = path.join(root, '.release-dry');
export const REGISTRY = 'https://npm.scriptorium.escrivivir.co';

/** Semver core (optional pre-release / build metadata). */
export const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const FORBIDDEN_PREFIXES = ['node_modules/', 'test/', '.git/', '.env'];
const FORBIDDEN_NAMES = new Set(['.DS_Store', '.npmrc', '.env']);

export function isSemver(version) {
  return typeof version === 'string' && SEMVER_RE.test(version);
}

function readPkg(dir) {
  return JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

export function listPublicable(engineRoot = libDir) {
  return readdirSync(engineRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(engineRoot, d.name))
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

/**
 * @param {string} pkgDir
 * @param {object} pkg
 * @param {string[]} entriesRaw
 * @param {{ registry?: string }} [opts]
 */
export function verifyTarball(pkgDir, pkg, entriesRaw, opts = {}) {
  const registry = opts.registry ?? REGISTRY;
  const errors = [];
  const entries = entriesRaw.map(normalizePackPath);
  const files = pkg.files;

  if (!files || !Array.isArray(files) || files.length === 0) {
    errors.push('missing package.json files[]');
  }

  if (!isSemver(pkg.version)) {
    errors.push(`version ${pkg.version} is not valid semver`);
  }

  if (pkg.publishConfig?.registry !== registry) {
    errors.push(`publishConfig.registry ≠ ${registry}`);
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

  // WP-U54: promised .d.ts (package.json types / exports.types) must be in tarball
  const promisedDts = collectPromisedDts(pkg);
  for (const rel of promisedDts) {
    if (!entries.includes(rel) && !entries.some((e) => e.startsWith(rel + '/'))) {
      errors.push(`types entry missing from tarball: ${rel}`);
    }
  }
  if (REQUIRES_DTS.has(pkg.name) && promisedDts.length === 0) {
    errors.push(`package requires types/.d.ts (WP-U54) but none declared`);
  }
  if (REQUIRES_DTS.has(pkg.name)) {
    const hasDts = entries.some((e) => e.endsWith('.d.ts'));
    if (!hasDts) errors.push(`tarball missing .d.ts files (WP-U54)`);
  }

  return { errors, entryCount: entries.length };
}

/** Packages that must ship TypeScript declarations for anonymous consumers (D-18 / U54). */
const REQUIRES_DTS = new Set(['@zeus/protocol', '@zeus/rooms']);

/** Collect paths promised by `types` / `typings` / `exports.*.types`. */
function collectPromisedDts(pkg) {
  const paths = new Set();
  const add = (p) => {
    if (typeof p !== 'string' || !p.startsWith('./')) return;
    paths.add(p.slice(2));
  };
  add(pkg.types);
  add(pkg.typings);
  const walk = (v) => {
    if (!v || typeof v !== 'object') return;
    if (typeof v.types === 'string') add(v.types);
    for (const child of Object.values(v)) {
      if (child && typeof child === 'object') walk(child);
      else if (typeof child === 'string' && child.endsWith('.d.ts')) add(child);
    }
  };
  if (pkg.exports && typeof pkg.exports === 'object') walk(pkg.exports);
  return [...paths];
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

export function main() {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const dirs = listPublicable();
  if (dirs.length === 0) {
    console.error('release:dry — no publicable packages found under packages/engine/');
    process.exit(1);
  }

  const versions = new Set(dirs.map((d) => readPkg(d).version));
  console.log(
    `release:dry — ${dirs.length} publicable package(s), ${versions.size} distinct version(s)`
  );
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

const invokedAsMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedAsMain) {
  main();
}
