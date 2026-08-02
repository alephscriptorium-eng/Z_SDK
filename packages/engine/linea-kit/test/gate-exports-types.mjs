/**
 * Gate exports ↔ declarations for @zeus/linea-kit (WP-U245).
 *
 * Fails in BOTH directions, which is the whole point:
 *
 *  A. exports → declarations
 *     every subpath of `exports` must declare a `types` condition and the
 *     file it points at must exist. Wildcard subpaths are expanded over the
 *     real runtime targets, so every `schemas/<x>.json` must have its
 *     `types/schemas/<x>.json.d.ts`. Retiring a declared entry declaration
 *     trips this leg.
 *
 *  B. declarations → exports
 *     every `.d.ts` under `types/` must be reachable from at least one
 *     `exports` entry by following relative `import`/`export … from`
 *     specifiers, and every one of those specifiers must resolve to a file
 *     that exists. Adding a subpath to `exports` without its declaration
 *     trips leg A; retiring a declaration that only a barrel imports trips
 *     this leg (broken specifier), and an orphan declaration trips it too.
 *
 * Also checks the root `types` field and that `files` ships the `types` dir.
 *
 * Usage: node test/gate-exports-types.mjs [pkgDir]
 * Exit code 0 = clean, 1 = findings. Zero dependencies, no runtime import of
 * the package under test.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} pkgDir
 * @returns {{ ok: boolean, findings: Array<{ leg: string, code: string, detail: string }>, checked: { subpaths: number, declarations: number } }}
 */
export function gateExportsTypes(pkgDir = DEFAULT_PKG_DIR) {
  const findings = [];
  const add = (leg, code, detail) => findings.push({ leg, code, detail });

  const manifestPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    add('setup', 'manifest_missing', manifestPath);
    return { ok: false, findings, checked: { subpaths: 0, declarations: 0 } };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const exportsMap = manifest.exports;

  if (!exportsMap || typeof exportsMap !== 'object') {
    add('setup', 'exports_missing', 'package.json has no exports map');
    return { ok: false, findings, checked: { subpaths: 0, declarations: 0 } };
  }

  // ---- root `types` field + publishable `files` ------------------------
  if (typeof manifest.types !== 'string') {
    add('root', 'types_field_missing', 'package.json has no root "types"');
  } else if (!fs.existsSync(path.join(pkgDir, manifest.types))) {
    add('root', 'types_field_dangling', manifest.types);
  }
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.includes('types')) {
    add('root', 'files_missing_types', `files: ${JSON.stringify(files)}`);
  }

  // ---- leg A: exports → declarations -----------------------------------
  /** @type {Set<string>} declaration files that an exports entry points at */
  const entryDecls = new Set();
  let subpathCount = 0;

  for (const [subpath, target] of Object.entries(exportsMap)) {
    subpathCount += 1;
    if (typeof target === 'string') {
      add('A', 'no_types_condition', `${subpath} → ${target} (bare string target)`);
      continue;
    }
    if (!target || typeof target !== 'object') {
      add('A', 'unreadable_target', `${subpath}`);
      continue;
    }
    const typesTarget = target.types;
    if (typeof typesTarget !== 'string') {
      add('A', 'no_types_condition', subpath);
      continue;
    }
    if (Object.keys(target)[0] !== 'types') {
      add('A', 'types_not_first', `${subpath}: "types" must come first in the condition object`);
    }

    if (subpath.includes('*')) {
      const runtimeTarget = target.default;
      if (typeof runtimeTarget !== 'string' || !runtimeTarget.includes('*')) {
        add('A', 'wildcard_without_runtime', subpath);
        continue;
      }
      for (const star of expandWildcard(pkgDir, runtimeTarget)) {
        const decl = path.join(pkgDir, typesTarget.replace('*', star));
        if (!fs.existsSync(decl)) {
          add('A', 'declaration_missing', `${subpath.replace('*', star)} → ${rel(pkgDir, decl)}`);
        } else {
          entryDecls.add(path.resolve(decl));
        }
      }
      continue;
    }

    const decl = path.join(pkgDir, typesTarget);
    if (!fs.existsSync(decl)) {
      add('A', 'declaration_missing', `${subpath} → ${typesTarget}`);
      continue;
    }
    entryDecls.add(path.resolve(decl));
  }

  // ---- leg B: declarations → exports ------------------------------------
  const typesDir = path.join(pkgDir, 'types');
  const allDecls = fs.existsSync(typesDir) ? walkDts(typesDir) : [];

  /** @type {Set<string>} */
  const reachable = new Set();
  /** @type {string[]} */
  const queue = [...entryDecls];
  while (queue.length) {
    const current = queue.pop();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    for (const spec of relativeSpecifiers(fs.readFileSync(current, 'utf8'))) {
      const resolved = resolveDeclSpecifier(path.dirname(current), spec);
      if (!resolved) {
        add('B', 'specifier_dangling', `${rel(pkgDir, current)} → "${spec}"`);
        continue;
      }
      queue.push(resolved);
    }
  }

  for (const decl of allDecls) {
    if (!reachable.has(path.resolve(decl))) {
      add('B', 'declaration_orphan', rel(pkgDir, decl));
    }
  }

  return {
    ok: findings.length === 0,
    findings,
    checked: { subpaths: subpathCount, declarations: allDecls.length }
  };
}

/** Runtime targets matching a wildcard `./dir/*` pattern → the `*` values. */
function expandWildcard(pkgDir, runtimeTarget) {
  const [prefix, suffix = ''] = runtimeTarget.split('*');
  const dir = path.join(pkgDir, path.dirname(prefix.endsWith('/') ? `${prefix}x` : prefix));
  if (!fs.existsSync(dir)) return [];
  const base = path.basename(prefix.endsWith('/') ? '' : prefix);
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => name.startsWith(base) && name.endsWith(suffix))
    .map((name) => name.slice(base.length, name.length - (suffix.length || 0) || undefined));
}

function walkDts(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkDts(abs));
    else if (entry.name.endsWith('.d.ts')) out.push(abs);
  }
  return out;
}

/** Relative module specifiers of `import`/`export … from` and `import(...)`. */
function relativeSpecifiers(source) {
  /** @type {string[]} */
  const specs = [];
  const fromRe = /\bfrom\s+['"](\.[^'"]*)['"]/g;
  const importRe = /\bimport\s*\(\s*['"](\.[^'"]*)['"]\s*\)/g;
  for (const re of [fromRe, importRe]) {
    let match;
    while ((match = re.exec(source)) !== null) specs.push(match[1]);
  }
  return specs;
}

/** `./x.js` inside a .d.ts resolves to `./x.d.ts` (NodeNext declaration rules). */
function resolveDeclSpecifier(fromDir, spec) {
  const base = path.resolve(fromDir, spec);
  const candidates = [
    base.replace(/\.js$/, '.d.ts'),
    base.replace(/\.mjs$/, '.d.mts'),
    `${base}.d.ts`,
    base
  ];
  for (const candidate of candidates) {
    if (candidate.endsWith('.d.ts') && fs.existsSync(candidate)) return path.resolve(candidate);
  }
  return null;
}

function rel(pkgDir, abs) {
  return path.relative(pkgDir, abs).split(path.sep).join('/');
}

/** CLI. */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PKG_DIR;
  const report = gateExportsTypes(target);
  const label = `gate exports↔declarations · ${target}`;
  if (report.ok) {
    console.log(
      `PASS ${label} — ${report.checked.subpaths} subpaths, ${report.checked.declarations} declarations`
    );
    process.exit(0);
  }
  console.error(`FAIL ${label} — ${report.findings.length} finding(s)`);
  for (const f of report.findings) {
    console.error(`  [leg ${f.leg}] ${f.code}: ${f.detail}`);
  }
  process.exit(1);
}
