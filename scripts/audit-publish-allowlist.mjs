#!/usr/bin/env node
/**
 * audit:publish-allowlist — inventario reproducible WP-U162.
 * Escanea todo package.json bajo packages/, clasifica contra allowlist
 * nominal + npm view (registry .npmrc). Opcionalmente mide candidatos
 * con npm pack --dry-run (nunca npm publish).
 *
 * Uso:
 *   node scripts/audit-publish-allowlist.mjs
 *   node scripts/audit-publish-allowlist.mjs --measure
 *   npm run audit:publish-allowlist
 *   npm run audit:publish-allowlist -- --measure
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = path.join(root, 'packages');
const registryDefault = 'https://npm.scriptorium.escrivivir.co';

/** Allowlist nominal (§3 de plan/PUBLISH-ALLOWLIST.md) — no inferir por private. */
export const CANDIDATES = Object.freeze({
  P0: [
    '@zeus/linea-system',
    '@zeus/linea-firehose',
    '@zeus/force-system',
    '@zeus/ssb-system'
  ],
  P1: ['@zeus/linea-editor']
});

const ALL_CANDIDATES = new Set([...CANDIDATES.P0, ...CANDIDATES.P1]);

function readRegistryFromNpmrc() {
  const npmrc = path.join(root, '.npmrc');
  if (!existsSync(npmrc)) return registryDefault;
  const text = readFileSync(npmrc, 'utf8');
  const m = text.match(/^\s*@zeus:registry\s*=\s*(\S+)/m);
  return m ? m[1].trim() : registryDefault;
}

function walkPackageJsonFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git') continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkPackageJsonFiles(abs, out);
    else if (ent.name === 'package.json') out.push(abs);
  }
  return out;
}

function rel(abs) {
  return path.relative(root, abs).split(path.sep).join('/');
}

function readPkg(abs) {
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function zeusDeps(pkg) {
  const bags = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies];
  /** @type {Record<string, string>} */
  const out = {};
  for (const bag of bags) {
    if (!bag) continue;
    for (const [name, ver] of Object.entries(bag)) {
      if (name.startsWith('@zeus/')) out[name] = String(ver);
    }
  }
  return out;
}

function listChangesetMentions() {
  const dir = path.join(root, '.changeset');
  if (!existsSync(dir)) return [];
  const names = new Set();
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md') || f === 'README.md') continue;
    const text = readFileSync(path.join(dir, f), 'utf8');
    for (const m of text.matchAll(/'@zeus\/[^']+'/g)) {
      names.add(m[0].slice(1, -1));
    }
    for (const m of text.matchAll(/"@zeus\/[^"]+"/g)) {
      names.add(m[0].slice(1, -1));
    }
  }
  return [...names].sort();
}

function releaseWorkflowMentions(name) {
  const wf = path.join(root, '.github', 'workflows', 'release.yml');
  if (!existsSync(wf)) return false;
  return readFileSync(wf, 'utf8').includes(name);
}

/**
 * @param {string} name
 * @param {string} registry
 */
function npmView(name, registry) {
  const r = spawnSync(
    'npm',
    ['view', name, 'version', '--registry', registry, '--json'],
    { encoding: 'utf8', cwd: root, shell: process.platform === 'win32' }
  );
  const stdout = (r.stdout || '').trim();
  const stderr = (r.stderr || '').trim();
  if (r.status === 0 && stdout) {
    try {
      const v = JSON.parse(stdout);
      return { ok: true, version: typeof v === 'string' ? v : String(v), raw: stdout };
    } catch {
      return { ok: true, version: stdout.replace(/^"|"$/g, ''), raw: stdout };
    }
  }
  const errText = stderr || stdout || `exit ${r.status}`;
  const code = /E404|404|not found|no such package/i.test(errText) ? 'E404' : 'ERR';
  return { ok: false, code, raw: errText.split('\n').slice(0, 4).join('\n') };
}

/**
 * @param {string} pkgDir
 */
function npmPackDryRun(pkgDir) {
  const r = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    encoding: 'utf8',
    cwd: pkgDir,
    shell: process.platform === 'win32'
  });
  const stdout = (r.stdout || '').trim();
  const stderr = (r.stderr || '').trim();
  if (r.status !== 0) {
    return {
      ok: false,
      error: (stderr || stdout || `exit ${r.status}`).split('\n').slice(0, 8).join('\n')
    };
  }
  try {
    const data = JSON.parse(stdout);
    const first = Array.isArray(data) ? data[0] : data;
    const files = (first?.files || []).map((f) =>
      typeof f === 'string' ? f : f.path || f.name || String(f)
    );
    return {
      ok: true,
      filename: first?.filename || first?.id || '(unknown)',
      entryCount: files.length,
      files: files.slice(0, 40),
      truncated: files.length > 40
    };
  } catch (e) {
    return { ok: false, error: `json parse: ${e.message}\n${stdout.slice(0, 400)}` };
  }
}

function classify(name, published) {
  if (published) return 'ya publicado';
  if (ALL_CANDIDATES.has(name)) return 'candidato';
  return 'mantener privado';
}

function candidatePriority(name) {
  if (CANDIDATES.P0.includes(name)) return 'P0';
  if (CANDIDATES.P1.includes(name)) return 'P1';
  return null;
}

function measureCandidate(row) {
  const pkg = row.pkg;
  const deps = zeusDeps(pkg);
  const starDeps = Object.entries(deps)
    .filter(([, v]) => v === '*')
    .map(([n]) => n);
  const pack = npmPackDryRun(row.dir);
  return {
    name: row.name,
    priority: candidatePriority(row.name),
    path: row.path,
    version: pkg.version ?? null,
    private: pkg.private === true,
    publishConfig: pkg.publishConfig ?? null,
    files: pkg.files ?? null,
    main: pkg.main ?? null,
    types: pkg.types ?? pkg.typings ?? null,
    exports: pkg.exports ?? null,
    zeusDeps: deps,
    starZeusDeps: starDeps,
    changesetPending: row.changesetMentions,
    inReleaseTestMatrix: row.inReleaseTestMatrix,
    pack
  };
}

function main() {
  const measure = process.argv.includes('--measure');
  const registry = readRegistryFromNpmrc();
  const changesetPkgs = new Set(listChangesetMentions());

  const files = walkPackageJsonFiles(packagesRoot).sort();
  /** @type {Map<string, object>} */
  const byName = new Map();

  for (const abs of files) {
    const pkg = readPkg(abs);
    const name = pkg.name;
    if (!name) {
      console.error(`skip (no name): ${rel(abs)}`);
      continue;
    }
    if (byName.has(name)) {
      console.error(`duplicate name ${name}: ${byName.get(name).path} vs ${rel(abs)}`);
      process.exitCode = 1;
      continue;
    }
    byName.set(name, {
      name,
      path: rel(abs),
      dir: path.dirname(abs),
      pkg,
      privateFlag: pkg.private === true,
      version: pkg.version ?? null
    });
  }

  const rows = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  const counts = { 'ya publicado': 0, candidato: 0, 'mantener privado': 0 };

  console.log(`audit:publish-allowlist (WP-U162)`);
  console.log(`registry: ${registry}`);
  console.log(`packages/** package.json files: ${files.length}`);
  console.log(`unique package names: ${rows.length}`);
  console.log(`allowlist candidatos: ${ALL_CANDIDATES.size} (P0=${CANDIDATES.P0.length} P1=${CANDIDATES.P1.length})`);
  console.log('');
  console.log(
    [
      'name',
      'class',
      'priority',
      'private',
      'version_local',
      'registry_version',
      'path'
    ].join('\t')
  );

  /** @type {object[]} */
  const inventory = [];

  for (const row of rows) {
    const view = npmView(row.name, registry);
    const published = view.ok === true;
    const cls = classify(row.name, published);
    counts[cls] += 1;
    const priority = candidatePriority(row.name) || '';
    const regVer = published ? view.version : view.code || 'ERR';
    console.log(
      [
        row.name,
        cls,
        priority,
        row.privateFlag ? 'true' : 'false',
        row.version ?? '',
        regVer,
        row.path
      ].join('\t')
    );
    inventory.push({
      name: row.name,
      class: cls,
      priority: priority || null,
      private: row.privateFlag,
      version_local: row.version,
      registry_version: published ? view.version : null,
      registry_error: published ? null : view.code,
      path: row.path,
      npm_view_ok: published
    });
    row.view = view;
    row.class = cls;
    row.changesetMentions = changesetPkgs.has(row.name);
    row.inReleaseTestMatrix = releaseWorkflowMentions(row.name);
  }

  console.log('');
  console.log('--- summary ---');
  console.log(`total_unique: ${rows.length}`);
  console.log(`ya_publicado: ${counts['ya publicado']}`);
  console.log(`candidato: ${counts.candidato}`);
  console.log(`mantener_privado: ${counts['mantener privado']}`);
  console.log(
    `private_true_local: ${rows.filter((r) => r.privateFlag).length}`
  );
  console.log(
    `private_false_or_absent_local: ${rows.filter((r) => !r.privateFlag).length}`
  );

  const candidatos = rows.filter((r) => r.class === 'candidato');
  if (candidatos.length) {
    console.log('');
    console.log('--- candidatos (allowlist §3, no publicados) ---');
    for (const c of candidatos) {
      console.log(
        `${c.name}\t${candidatePriority(c.name)}\tprivate=${c.privateFlag}\t${c.path}`
      );
    }
  }

  // Extra: allowlist names that somehow are already published
  const publishedCandidates = rows.filter(
    (r) => ALL_CANDIDATES.has(r.name) && r.class === 'ya publicado'
  );
  if (publishedCandidates.length) {
    console.log('');
    console.log('--- allowlist names already on registry (not candidato) ---');
    for (const c of publishedCandidates) {
      console.log(`${c.name}\t${c.view.version}`);
    }
  }

  // Note mesh without private that are not published and not candidates
  const odd = rows.filter(
    (r) =>
      !r.privateFlag &&
      r.class === 'mantener privado' &&
      r.path.startsWith('packages/mesh/')
  );
  if (odd.length) {
    console.log('');
    console.log(
      '--- mesh sin private y no allowlist (mantener privado por allowlist) ---'
    );
    for (const o of odd) {
      console.log(`${o.name}\t${o.path}`);
    }
  }

  if (measure) {
    console.log('');
    console.log('--- measure candidatos (npm pack --dry-run; no publish) ---');
    for (const c of candidatos) {
      const m = measureCandidate(c);
      console.log('');
      console.log(`## ${m.name} (${m.priority})`);
      console.log(`path: ${m.path}`);
      console.log(`version: ${m.version}`);
      console.log(`private: ${m.private}`);
      console.log(`publishConfig: ${JSON.stringify(m.publishConfig)}`);
      console.log(`files: ${JSON.stringify(m.files)}`);
      console.log(`main: ${m.main}`);
      console.log(`types: ${m.types}`);
      console.log(`exports: ${JSON.stringify(m.exports)}`);
      console.log(`zeusDeps: ${JSON.stringify(m.zeusDeps)}`);
      console.log(`starZeusDeps: ${JSON.stringify(m.starZeusDeps)}`);
      console.log(`changesetPending: ${m.changesetPending}`);
      console.log(`inReleaseTestMatrix: ${m.inReleaseTestMatrix}`);
      if (m.pack.ok) {
        console.log(
          `pack: ok filename=${m.pack.filename} entries=${m.pack.entryCount}`
        );
        for (const f of m.pack.files) console.log(`  pack-file: ${f}`);
        if (m.pack.truncated) console.log('  pack-file: … (truncated)');
      } else {
        console.log(`pack: FAIL ${m.pack.error}`);
      }
    }
  } else {
    console.log('');
    console.log('(tip: pase --measure para npm pack --dry-run de candidatos)');
  }

  // Machine-readable footer for report paste
  console.log('');
  console.log('--- json_summary ---');
  console.log(
    JSON.stringify(
      {
        registry,
        total_unique: rows.length,
        counts,
        inventory
      },
      null,
      2
    )
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
