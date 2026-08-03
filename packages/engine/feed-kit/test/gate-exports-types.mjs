/**
 * Gate exports ↔ declarations for @zeus/feed-kit.
 * Fails in BOTH directions. Zero dependencies. existsSync only (no parse).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PKG_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

/**
 * @param {string} pkgDir
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

  if (typeof manifest.types !== 'string') {
    add('root', 'types_field_missing', 'package.json has no root "types"');
  } else if (!fs.existsSync(path.join(pkgDir, manifest.types))) {
    add('root', 'types_target_missing', manifest.types);
  }

  const files = Array.isArray(manifest.files) ? manifest.files : [];
  if (!files.includes('types')) {
    add('root', 'types_not_in_files', 'files[] must include "types"');
  }

  const typesDir = path.join(pkgDir, 'types');
  /** @type {Set<string>} */
  const declaredFiles = new Set();
  let subpaths = 0;

  for (const [subpath, target] of Object.entries(exportsMap)) {
    subpaths += 1;
    if (typeof target === 'string') {
      add('A', 'types_condition_missing', `${subpath} → string target (no types)`);
      continue;
    }
    if (!target || typeof target !== 'object') {
      add('A', 'export_target_invalid', subpath);
      continue;
    }
    if (typeof target.types !== 'string') {
      add('A', 'types_condition_missing', subpath);
      continue;
    }
    const abs = path.join(pkgDir, target.types);
    if (!fs.existsSync(abs)) {
      add('A', 'types_file_missing', `${subpath} → ${target.types}`);
    } else {
      declaredFiles.add(path.resolve(abs));
    }
  }

  let declarations = 0;
  if (!fs.existsSync(typesDir)) {
    add('B', 'types_dir_missing', typesDir);
  } else {
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(abs);
        else if (ent.name.endsWith('.d.ts')) {
          declarations += 1;
          if (!declaredFiles.has(path.resolve(abs))) {
            const reachable = isReachableFrom(declaredFiles, abs, typesDir);
            if (!reachable) {
              add(
                'B',
                'orphan_declaration',
                path.relative(typesDir, abs).replaceAll('\\', '/')
              );
            }
          }
        }
      }
    };
    walk(typesDir);
  }

  return {
    ok: findings.length === 0,
    findings,
    checked: { subpaths, declarations }
  };
}

/**
 * @param {Set<string>} roots
 * @param {string} targetAbs
 * @param {string} typesDir
 */
function isReachableFrom(roots, targetAbs, typesDir) {
  const target = path.resolve(targetAbs);
  if (roots.has(target)) return true;
  const visited = new Set();
  const queue = [...roots];
  while (queue.length) {
    const cur = queue.pop();
    if (!cur || visited.has(cur)) continue;
    visited.add(cur);
    if (cur === target) return true;
    if (!fs.existsSync(cur)) continue;
    const text = fs.readFileSync(cur, 'utf8');
    const re =
      /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      let spec = m[1];
      if (!spec.endsWith('.d.ts') && !spec.endsWith('.ts')) {
        if (fs.existsSync(path.resolve(path.dirname(cur), `${spec}.d.ts`))) {
          spec = `${spec}.d.ts`;
        } else if (
          fs.existsSync(path.resolve(path.dirname(cur), spec, 'index.d.ts'))
        ) {
          spec = path.join(spec, 'index.d.ts');
        }
      }
      const next = path.resolve(path.dirname(cur), spec);
      if (next.startsWith(typesDir) && !visited.has(next)) queue.push(next);
    }
  }
  return visited.has(target);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = gateExportsTypes();
  for (const f of result.findings) {
    console.error(`${f.leg}:${f.code} ${f.detail}`);
  }
  console.log(
    result.ok
      ? `PASS feed-kit gate — ${result.checked.subpaths} subpaths, ${result.checked.declarations} declarations`
      : `FAIL feed-kit gate — ${result.findings.length} finding(s)`
  );
  process.exit(result.ok ? 0 : 1);
}
