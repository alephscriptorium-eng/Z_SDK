#!/usr/bin/env node
/**
 * Opt-in publish-ready gate for the P0 mesh allowlist.
 *
 * This command only inspects manifests and runs `npm pack --dry-run`; it never
 * changes `private`, creates changesets, or publishes. P1 is excluded because
 * WP-U166 intentionally left @zeus/linea-editor pending a publish-ready WP.
 *
 * Usage:
 *   node scripts/gate-publish-ready.mjs
 *   node scripts/gate-publish-ready.mjs --root <fixture-root> --package <name>
 *   node scripts/gate-publish-ready.mjs --package <name> --fail-probe
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANDIDATES } from './audit-publish-allowlist.mjs';

// Reports U163/U164 document this explicit policy: P0 ships ESM runtime JS
// exports and intentionally has no declaration files until a dedicated types WP.
const JS_ONLY_P0 = new Set(CANDIDATES.P0);
const scriptRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  if (!args[index + 1]) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

const root = path.resolve(option('--root') || scriptRoot);
const selectedPackage = option('--package');
const failProbe = args.includes('--fail-probe');
const measuredCandidates = selectedPackage
  ? CANDIDATES.P0.filter((name) => name === selectedPackage)
  : CANDIDATES.P0;

if (selectedPackage && measuredCandidates.length === 0) {
  throw new Error(
    `--package must select a P0 candidate (${CANDIDATES.P0.join(', ')})`
  );
}
if (failProbe && !selectedPackage) {
  throw new Error('--fail-probe requires --package');
}

function normalizeRegistry(value) {
  return value.replace(/\/+$/, '');
}

function readCanonicalRegistry() {
  const npmrcPath = path.join(root, '.npmrc');
  if (!existsSync(npmrcPath)) {
    throw new Error(`missing .npmrc at ${npmrcPath}`);
  }
  const npmrc = readFileSync(npmrcPath, 'utf8');
  const match = npmrc.match(/^\s*@zeus:registry\s*=\s*(\S+)\s*$/m);
  if (!match) throw new Error('missing @zeus:registry in .npmrc');
  return normalizeRegistry(match[1]);
}

function packageManifests(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) packageManifests(absolute, found);
    else if (entry.name === 'package.json') found.push(absolute);
  }
  return found;
}

function packageIndex() {
  const byName = new Map();
  for (const manifestPath of packageManifests(path.join(root, 'packages'))) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.name) byName.set(manifest.name, { manifest, manifestPath });
  }
  return byName;
}

function zeusDependencies(manifest) {
  const result = [];
  const fields = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies'
  ];
  for (const field of fields) {
    for (const [name, version] of Object.entries(manifest[field] || {})) {
      if (name.startsWith('@zeus/')) {
        result.push({ field, name, version: String(version) });
      }
    }
  }
  return result;
}

function isRegistryRange(version) {
  return (
    version !== '*' &&
    !/^(?:workspace|file|link):/i.test(version) &&
    !/^[./]/.test(version)
  );
}

function exportedTargets(exportsField) {
  if (typeof exportsField === 'string') return [exportsField];
  if (!exportsField || typeof exportsField !== 'object') return [];
  return Object.values(exportsField).flatMap((value) =>
    exportedTargets(value)
  );
}

function packDryRun(packageDirectory) {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packageDirectory,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `exit ${result.status}`)
      .trim()
      .split('\n')
      .slice(0, 6)
      .join('\n');
    return { error: detail, files: [] };
  }
  try {
    const parsed = JSON.parse(result.stdout);
    const pack = Array.isArray(parsed) ? parsed[0] : parsed;
    return {
      error: null,
      files: (pack?.files || []).map((file) =>
        typeof file === 'string' ? file : file.path
      )
    };
  } catch (error) {
    return { error: `invalid npm pack JSON: ${error.message}`, files: [] };
  }
}

function unsafePackPath(file) {
  const normalized = file.replaceAll('\\', '/');
  return (
    /(^|\/)(?:node_modules|test|tests|__tests__|fixtures?)(\/|$)/i.test(
      normalized
    ) ||
    /(^|\/)\.env(?:\.|$)/i.test(normalized) ||
    /\.(?:pem|key|p12|pfx)$/i.test(normalized) ||
    /(^|\/)\.npmrc$/i.test(normalized)
  );
}

function checkCandidate(name, entry, registry) {
  const failures = [];
  if (!entry) return { failures: ['manifest not found'], packEntries: 0 };

  const { manifest, manifestPath } = entry;
  const relativeManifest = path
    .relative(root, manifestPath)
    .split(path.sep)
    .join('/');
  const packageRegistry = manifest.publishConfig?.registry;
  if (
    typeof packageRegistry !== 'string' ||
    normalizeRegistry(packageRegistry) !== registry
  ) {
    failures.push(
      `publishConfig.registry=${JSON.stringify(packageRegistry)}; expected ${registry}`
    );
  }

  if (
    !Array.isArray(manifest.files) ||
    manifest.files.length === 0 ||
    manifest.files.some((file) => typeof file !== 'string' || !file.trim())
  ) {
    failures.push('files must be a non-empty array of paths');
  }

  const exportsTargets = exportedTargets(manifest.exports);
  const hasTypes =
    typeof (manifest.types || manifest.typings) === 'string';
  const isDocumentedJsOnly =
    JS_ONLY_P0.has(name) &&
    exportsTargets.length > 0 &&
    exportsTargets.every((target) => /\.(?:mjs|cjs|js)$/i.test(target));
  if (!hasTypes && !isDocumentedJsOnly) {
    failures.push(
      'types/typings absent and exports do not establish the P0 JS-only policy'
    );
  }

  const invalidDependencies = zeusDependencies(manifest).filter(
    ({ version }) => !isRegistryRange(version)
  );
  for (const dependency of invalidDependencies) {
    failures.push(
      `${dependency.field}.${dependency.name}=${dependency.version}; expected a registry semver range, not wildcard/workspace/local`
    );
  }

  const pack = packDryRun(path.dirname(manifestPath));
  if (pack.error) failures.push(`npm pack --dry-run failed: ${pack.error}`);
  const unsafeFiles = pack.files.filter(unsafePackPath);
  if (unsafeFiles.length) {
    failures.push(`unsafe pack paths: ${unsafeFiles.join(', ')}`);
  }

  return {
    failures,
    relativeManifest,
    packEntries: pack.files.length,
    dependencyCount: zeusDependencies(manifest).length,
    typeMode: hasTypes ? 'types' : 'JS-only'
  };
}

function main() {
  const registry = readCanonicalRegistry();
  const manifests = packageIndex();
  let failureCount = 0;

  if (failProbe) {
    const entry = manifests.get(selectedPackage);
    const dependency = entry && zeusDependencies(entry.manifest)[0];
    if (!dependency) {
      throw new Error(
        `cannot inject fail probe: ${selectedPackage} has no @zeus dependency`
      );
    }
    entry.manifest[dependency.field][dependency.name] = '*';
    console.log(
      `fail-probe (memory only): ${dependency.field}.${dependency.name}=*`
    );
  }

  console.log('gate:publish-ready (WP-U165; P0 allowlist subset)');
  console.log(`registry (.npmrc @zeus): ${registry}`);
  console.log(`measured: ${measuredCandidates.join(', ')}`);
  console.log(
    `excluded P1 (pending publish-ready WP): ${CANDIDATES.P1.join(', ') || '(none)'}`
  );

  for (const name of measuredCandidates) {
    const result = checkCandidate(name, manifests.get(name), registry);
    if (result.failures.length) {
      failureCount += result.failures.length;
      console.error(`FAIL ${name}`);
      for (const failure of result.failures) {
        console.error(`  - ${failure}`);
      }
    } else {
      console.log(
        `PASS ${name} manifest=${result.relativeManifest} files=explicit pack=${result.packEntries} types=${result.typeMode} zeusDeps=${result.dependencyCount}`
      );
    }
  }

  if (failureCount) {
    console.error(
      `gate:publish-ready: FAIL (${failureCount} violation${failureCount === 1 ? '' : 's'})`
    );
    process.exitCode = 1;
  } else {
    console.log(
      `gate:publish-ready: OK (${measuredCandidates.length} P0 candidate${measuredCandidates.length === 1 ? '' : 's'})`
    );
  }
}

try {
  main();
} catch (error) {
  console.error(`gate:publish-ready: FAIL (${error.message})`);
  process.exitCode = 1;
}
