/**
 * WP-U200 (◆5): canonical volumes-root resolver — env mandatory.
 * CA-1 root does not depend on cwd · CA-2 a pack cannot hijack resolution
 * · CA-3 no env → honest abort.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  loadZeusEnv,
  resetZeusEnvLoader,
  MONOREPO_ROOT,
  resolveVolumesRoot,
  resetVolumesCache
} from '../src/index.mjs';

/**
 * Isolate env + cwd: mark the env loader as loaded from a dir WITHOUT a
 * .env so a developer's repo .env can never leak into these assertions.
 */
function setupIsolated() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u200-resolver-'));
  const prevRoot = process.env.ZEUS_VOLUMES_ROOT;
  const prevCwd = process.cwd();
  resetZeusEnvLoader();
  resetVolumesCache();
  loadZeusEnv(tempRoot);
  return {
    tempRoot,
    restore() {
      process.chdir(prevCwd);
      if (prevRoot == null) delete process.env.ZEUS_VOLUMES_ROOT;
      else process.env.ZEUS_VOLUMES_ROOT = prevRoot;
      resetZeusEnvLoader();
      resetVolumesCache();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  };
}

test('CA-3: without ZEUS_VOLUMES_ROOT the resolver aborts honestly (not operable)', () => {
  const { restore } = setupIsolated();
  try {
    delete process.env.ZEUS_VOLUMES_ROOT;
    assert.throws(
      () => resolveVolumesRoot(),
      /ZEUS_VOLUMES_ROOT is not set .* not operable/
    );
  } finally {
    restore();
  }
});

test('CA-1: resolved root is identical from two different cwds (absolute and relative env)', () => {
  const { tempRoot, restore } = setupIsolated();
  try {
    const volumesDir = path.join(tempRoot, 'VOLUMES');
    fs.mkdirSync(volumesDir, { recursive: true });
    const otherCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u200-cwd-'));

    // Absolute env value.
    process.env.ZEUS_VOLUMES_ROOT = volumesDir;
    process.chdir(tempRoot);
    const fromA = resolveVolumesRoot();
    process.chdir(otherCwd);
    const fromB = resolveVolumesRoot();
    assert.equal(fromA, fromB);
    assert.equal(fromA, path.resolve(volumesDir));

    // Relative env value anchors to MONOREPO_ROOT — never to cwd.
    process.env.ZEUS_VOLUMES_ROOT = './VOLUMES';
    process.chdir(tempRoot);
    const relA = resolveVolumesRoot();
    process.chdir(otherCwd);
    const relB = resolveVolumesRoot();
    assert.equal(relA, relB);
    assert.equal(relA, path.resolve(MONOREPO_ROOT, 'VOLUMES'));

    process.chdir(tempRoot); // leave otherCwd so rmSync can clean it
    fs.rmSync(otherCwd, { recursive: true, force: true });
  } finally {
    restore();
  }
});

test('CA-2 (caso rojo): a volumes tree planted in a pack under node_modules never wins', () => {
  const { tempRoot, restore } = setupIsolated();
  try {
    // Synthetic pack: node_modules/@fake/startpack/VOLUMES/volumes.json
    const packVolumes = path.join(
      tempRoot,
      'node_modules',
      '@fake',
      'startpack',
      'VOLUMES'
    );
    fs.mkdirSync(packVolumes, { recursive: true });
    fs.writeFileSync(
      path.join(packVolumes, 'volumes.json'),
      JSON.stringify({ root: '.', volumes: {} }),
      'utf8'
    );

    // 1) cwd inside the pack + no env: the demolished walk would have
    //    found the planted root — now it aborts and elects nothing.
    process.chdir(path.dirname(packVolumes));
    delete process.env.ZEUS_VOLUMES_ROOT;
    assert.throws(
      () => resolveVolumesRoot(),
      /ZEUS_VOLUMES_ROOT is not set .* not operable/
    );

    // 2) Even an env pointing into node_modules is refused (cerco §10.8):
    //    packs are import sources, never live roots.
    process.env.ZEUS_VOLUMES_ROOT = packVolumes;
    assert.throws(
      () => resolveVolumesRoot(),
      /never a live volumes root; refusing \(cerco §10\.8\)/
    );

    process.chdir(tempRoot);
  } finally {
    restore();
  }
});
