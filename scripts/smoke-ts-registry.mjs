#!/usr/bin/env node
/**
 * smoke:ts-registry — WP-U158
 *
 * Instala @zeus/* tipados DESDE el registry real (no tarball/npm pack) en un
 * directorio limpio fuera del workspace, y corre `tsc --noEmit` sobre un
 * consumidor TypeScript strict (sin `any` de escape en imports Zeus).
 *
 * Convive con smoke:external-consumer (U54/U161 · tarballs). No lo demuele.
 *
 * Skip limpio (exit 0 · ⏳) si el registry no responde o ZEUS_SMOKE_TS_REGISTRY_SKIP=1.
 */

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleDir = path.join(root, 'examples', 'ts-registry-consumer');
const ZEUS_REGISTRY = 'https://npm.scriptorium.escrivivir.co';

/** Versiones publicadas verificadas (R5-Z / brief U158). */
const PKGS = {
  protocol: '@zeus/protocol@0.4.1',
  rooms: '@zeus/rooms@0.1.2',
  webrtc: '@zeus/webrtc-signaling@0.3.3'
};

function fail(msg) {
  console.error(`smoke:ts-registry FAIL — ${msg}`);
  process.exitCode = 1;
}

function skip(reason) {
  console.log(`smoke:ts-registry — skipped (⏳) — ${reason}`);
  process.exit(0);
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: true,
    ...opts
  });
}

function assertNoAnyEscape(srcPath) {
  const text = readFileSync(srcPath, 'utf8');
  const offenders = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // Escape hatches around Zeus imports / typed values.
    if (/\bas\s+any\b/.test(line) || /:\s*any\b/.test(line)) {
      offenders.push(`${i + 1}: ${line.trim()}`);
    }
  }
  if (offenders.length) {
    throw new Error(
      `consumer has any-escape (forbidden in U158):\n${offenders.join('\n')}`
    );
  }
  console.log('consumer.ts: no any-escape: ok');
}

function assertLockResolvedFromRegistry(cleanDir) {
  const lockPath = path.join(cleanDir, 'package-lock.json');
  if (!existsSync(lockPath)) {
    throw new Error('package-lock.json missing after npm install');
  }
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  const packages = lock.packages || {};
  const zeusKeys = Object.keys(packages).filter((k) =>
    k.includes('node_modules/@zeus/')
  );
  if (zeusKeys.length === 0) {
    throw new Error('no @zeus/* entries in package-lock.json');
  }
  const bad = [];
  for (const key of zeusKeys) {
    const entry = packages[key];
    const resolved = String(entry.resolved || '');
    // Must be registry URL — reject file:/tarball/workspace installs.
    if (
      !resolved.includes('npm.scriptorium.escrivivir.co') &&
      !resolved.startsWith('https://npm.scriptorium.escrivivir.co')
    ) {
      // npm may store resolved without host when using scoped registry —
      // accept integrity+version only if resolved is absolute https to our host
      // or the classic registry path form.
      if (!/^https?:\/\//.test(resolved)) {
        bad.push(`${key}: resolved=${resolved || '(empty)'}`);
      } else if (!resolved.includes('scriptorium.escrivivir.co')) {
        bad.push(`${key}: resolved=${resolved}`);
      }
    }
  }
  if (bad.length) {
    throw new Error(
      `CA: @zeus/* must resolve from registry real, not tarball/file:\n${bad.join('\n')}`
    );
  }
  console.log(
    `package-lock: ${zeusKeys.length} @zeus/* resolved from registry: ok`
  );
}

function probeRegistry() {
  if (process.env.ZEUS_SMOKE_TS_REGISTRY_SKIP === '1') {
    skip('ZEUS_SMOKE_TS_REGISTRY_SKIP=1');
  }

  const r = run(
    'npm',
    [
      'view',
      PKGS.protocol,
      'version',
      `--registry=${ZEUS_REGISTRY}`,
      '--json'
    ],
    { cwd: root }
  );
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim();
    // Unreachable / DNS / TLS / 5xx → skip limpio (U122-style).
    // E404 on a pinned published version → FAIL (contradicts R5-Z).
    if (/E404|404 Not Found/i.test(err)) {
      throw new Error(
        `registry reachable but ${PKGS.protocol} missing (E404):\n${err}`
      );
    }
    skip(`registry unavailable (${ZEUS_REGISTRY}): ${err.slice(0, 240)}`);
  }
  const ver = String(r.stdout || '')
    .trim()
    .replace(/^"|"$/g, '');
  console.log(`registry probe: ${PKGS.protocol} → ${ver}`);
}

console.log('smoke:ts-registry (WP-U158 · install from registry + tsc --noEmit)');
console.log(`  registry: ${ZEUS_REGISTRY}`);
console.log(`  pkgs:     ${Object.values(PKGS).join(' · ')}`);
console.log('');

let cleanDir;

try {
  probeRegistry();

  if (!existsSync(path.join(exampleDir, 'consumer.ts'))) {
    throw new Error(`missing ${path.join(exampleDir, 'consumer.ts')}`);
  }
  if (!existsSync(path.join(exampleDir, 'tsconfig.json'))) {
    throw new Error(`missing ${path.join(exampleDir, 'tsconfig.json')}`);
  }

  cleanDir = mkdtempSync(path.join(os.tmpdir(), 'zeus-u158-ts-registry-'));
  console.log(`  clean:    ${cleanDir}`);
  console.log('');

  writeFileSync(
    path.join(cleanDir, '.npmrc'),
    [`@zeus:registry=${ZEUS_REGISTRY}`, ''].join('\n')
  );
  writeFileSync(
    path.join(cleanDir, 'package.json'),
    JSON.stringify(
      {
        name: 'zeus-ts-registry-smoke',
        private: true,
        type: 'module',
        version: '0.0.0'
      },
      null,
      2
    )
  );
  copyFileSync(
    path.join(exampleDir, 'consumer.ts'),
    path.join(cleanDir, 'consumer.ts')
  );
  copyFileSync(
    path.join(exampleDir, 'tsconfig.json'),
    path.join(cleanDir, 'tsconfig.json')
  );

  assertNoAnyEscape(path.join(cleanDir, 'consumer.ts'));

  const install = run(
    'npm',
    [
      'install',
      PKGS.protocol,
      PKGS.rooms,
      PKGS.webrtc,
      'typescript@5.8.3',
      '@types/node@22',
      '--no-fund',
      '--no-audit',
      '--package-lock'
    ],
    { cwd: cleanDir }
  );
  if (install.status !== 0) {
    throw new Error(
      `npm install from registry failed (exit ${install.status}):\n${install.stderr || install.stdout}`
    );
  }
  console.log(`npm install from registry: exit ${install.status}`);
  assertLockResolvedFromRegistry(cleanDir);

  // Sanity: .d.ts landed for covered surfaces.
  const dtsChecks = [
    ['@zeus/protocol', 'types/index.d.ts'],
    ['@zeus/protocol', 'types/peer-card-seat.d.ts'],
    ['@zeus/rooms', 'types/index.d.ts'],
    ['@zeus/webrtc-signaling', 'types/messages.d.ts']
  ];
  for (const [pkg, rel] of dtsChecks) {
    const p = path.join(cleanDir, 'node_modules', ...pkg.split('/'), rel);
    if (!existsSync(p)) throw new Error(`missing .d.ts: ${p}`);
  }
  console.log('.d.ts present (protocol, peer-card-seat, rooms, messages): ok');

  const tscBin = path.join(cleanDir, 'node_modules', 'typescript', 'bin', 'tsc');
  const tsc = run(process.execPath, [tscBin, '--noEmit', '-p', 'tsconfig.json'], {
    cwd: cleanDir,
    shell: false
  });
  if (tsc.status !== 0) {
    throw new Error(
      `tsc --noEmit failed (exit ${tsc.status}):\n${tsc.stdout || ''}\n${tsc.stderr || ''}`
    );
  }
  console.log('tsc --noEmit: exit 0');

  console.log('');
  console.log(
    'smoke:ts-registry — GREEN (registry install + tsc --noEmit, no any-escape)'
  );
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  if (cleanDir && process.env.ZEUS_SMOKE_CLEANUP === '1') {
    rmSync(cleanDir, { recursive: true, force: true });
  }
}

process.exit(process.exitCode ?? 0);
