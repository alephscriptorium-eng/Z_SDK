/**
 * WP-U00 — gates de prácticas.
 * CA: verde en el repo (con excepciones justificadas); rojo con violación
 * sintética de cada tipo (a–d).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  REPO_ROOT,
  runAllGates,
  scanHardcodedPorts,
  scanTransitionNames,
  scanArgImportViolations,
  scanTwoGamesRule,
  formatOffenders
} from '../../scripts/gates/scan.mjs';

/**
 * @param {string} prefix
 * @param {(dir: string) => void} write
 * @returns {string} temp root
 */
function withTempTree(prefix, write) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  write(dir);
  return dir;
}

test('CA verde: npm run gates / runAllGates limpio en el repo actual', { timeout: 60_000 }, () => {
  const result = runAllGates({ repoRoot: REPO_ROOT });
  assert.equal(
    result.ok,
    true,
    formatOffenders(result.offenders)
  );
});

test('CA rojo (a): puerto hardcodeado detectado', () => {
  const root = withTempTree('zeus-gates-ports-', (dir) => {
    const pkg = path.join(dir, 'packages', 'app', 'fake-ui', 'src');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, 'server.mjs'),
      "export const port = 3017;\nconst url = 'http://localhost:3017/runtime';\n"
    );
  });
  try {
    const file = path.join(root, 'packages', 'app', 'fake-ui', 'src', 'server.mjs');
    const offenders = scanHardcodedPorts({ repoRoot: root, files: [file] });
    assert.ok(offenders.length >= 1, 'expected at least one ports offender');
    assert.equal(offenders[0].rule, 'ports');
    assert.match(offenders[0].path, /fake-ui\/src\/server\.mjs$/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA rojo (b): nombre de transición detectado', () => {
  const root = withTempTree('zeus-gates-transition-', (dir) => {
    const pkg = path.join(dir, 'packages', 'lib', 'fake-lib', 'src');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, 'compat.mjs'),
      "export function legacyHandler() { return 'v2-shim'; }\nexport const api_old = 1;\n"
    );
  });
  try {
    const file = path.join(root, 'packages', 'lib', 'fake-lib', 'src', 'compat.mjs');
    const offenders = scanTransitionNames({ repoRoot: root, files: [file] });
    assert.ok(offenders.length >= 1, 'expected transition offender');
    assert.equal(offenders[0].rule, 'transition');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA rojo (c): import de @zeus/arg-* fuera de packages/arg', () => {
  const root = withTempTree('zeus-gates-argimport-', (dir) => {
    const pkg = path.join(dir, 'packages', 'platform', 'fake-mesh', 'src');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, 'bridge.mjs'),
      "import { EVENTS } from '@zeus/arg-domain';\nexport const e = EVENTS;\n"
    );
  });
  try {
    const file = path.join(root, 'packages', 'platform', 'fake-mesh', 'src', 'bridge.mjs');
    const offenders = scanArgImportViolations({ repoRoot: root, files: [file] });
    assert.equal(offenders.length, 1);
    assert.equal(offenders[0].rule, 'arg-import');
    assert.match(offenders[0].detail, /@zeus\/arg-domain/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('CA rojo (d): concepto de juego en packages/engine', () => {
  const root = withTempTree('zeus-gates-twogames-', (dir) => {
    const pkg = path.join(dir, 'packages', 'engine', 'protocol', 'src');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, 'delta-only.mjs'),
      "/** Engine must not know delta or grifo. */\nexport const game = 'delta';\nexport const tap = 'grifo';\n"
    );
  });
  try {
    const file = path.join(root, 'packages', 'engine', 'protocol', 'src', 'delta-only.mjs');
    const offenders = scanTwoGamesRule({ repoRoot: root, files: [file] });
    assert.ok(offenders.length >= 1, 'expected two-games offender');
    assert.equal(offenders[0].rule, 'two-games');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('oldid de dominio no dispara transición -old', () => {
  const root = withTempTree('zeus-gates-oldid-', (dir) => {
    const pkg = path.join(dir, 'packages', 'lib', 'fake', 'src');
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(
      path.join(pkg, 'paths.mjs'),
      "export const p = `${id}-oldid-${oldid}/registro.md`;\n"
    );
  });
  try {
    const file = path.join(root, 'packages', 'lib', 'fake', 'src', 'paths.mjs');
    const offenders = scanTransitionNames({ repoRoot: root, files: [file] });
    assert.deepEqual(offenders, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('presets-sdk/env puede declarar puertos sin offender', () => {
  const envFile = path.join(
    REPO_ROOT,
    'packages/lib/presets-sdk/src/env/index.mjs'
  );
  const offenders = scanHardcodedPorts({ repoRoot: REPO_ROOT, files: [envFile] });
  assert.deepEqual(offenders, []);
});
