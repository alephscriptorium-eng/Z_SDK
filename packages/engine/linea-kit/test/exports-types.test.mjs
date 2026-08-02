/**
 * WP-U245 · CA3 — the exports↔declarations gate must FAIL in BOTH directions.
 *
 * Not a mocked filesystem: each vector copies the real package manifest plus
 * its real `types/` tree into a temp dir, breaks exactly one thing, and runs
 * the same gate against it.
 *
 *   vector A · a subpath added to `exports` WITHOUT its declaration
 *   vector B1 · the declaration of a declared subpath RETIRED (entry file)
 *   vector B2 · a declaration only the barrels import RETIRED (dangling specifier)
 *   vector B3 · a declaration added under `types/` that nothing reaches (orphan)
 *   vector C · a wildcard runtime target without its declaration
 *
 * A gate that only fails on one of these would let the other half rot.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { gateExportsTypes } from './gate-exports-types.mjs';

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Copy manifest + types/ + schemas/ into a temp package and mutate it. */
function sandbox(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u245-gate-'));
  fs.cpSync(path.join(PKG_DIR, 'types'), path.join(dir, 'types'), { recursive: true });
  fs.cpSync(path.join(PKG_DIR, 'schemas'), path.join(dir, 'schemas'), { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));
  mutate({ dir, manifest });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest, null, 2), 'utf8');
  return dir;
}

function codes(report) {
  return report.findings.map((f) => `${f.leg}:${f.code}`);
}

test('the real package passes the gate', () => {
  const report = gateExportsTypes(PKG_DIR);
  assert.equal(report.ok, true, JSON.stringify(report.findings, null, 2));
  assert.equal(report.checked.subpaths, 10, 'the manifest must still declare ten subpaths');
  assert.ok(report.checked.declarations > 0);
});

test('the unmutated copy passes too (the sandbox itself is not the failure)', () => {
  const dir = sandbox(() => {});
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, true, JSON.stringify(report.findings, null, 2));
});

test('vector A · a subpath in exports without its declaration FAILS', () => {
  const dir = sandbox(({ manifest }) => {
    manifest.exports['./nuevo'] = {
      types: './types/nuevo.d.ts',
      default: './src/nuevo.mjs'
    };
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted an undeclared subpath');
  assert.ok(
    codes(report).includes('A:declaration_missing'),
    `expected A:declaration_missing, got ${codes(report).join(', ')}`
  );
});

test('vector A bis · a subpath with a bare string target (no types condition) FAILS', () => {
  const dir = sandbox(({ manifest }) => {
    manifest.exports['./curation'] = './src/curation.mjs';
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted a subpath with no types condition');
  assert.ok(codes(report).includes('A:no_types_condition'));
});

test('vector B1 · retiring the declaration of a declared subpath FAILS', () => {
  const dir = sandbox(({ dir: d }) => {
    fs.rmSync(path.join(d, 'types', 'viaje', 'index.d.ts'));
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted a retired entry declaration');
  assert.ok(
    codes(report).includes('A:declaration_missing'),
    `expected A:declaration_missing, got ${codes(report).join(', ')}`
  );
});

test('vector B2 · retiring a declaration the barrels import FAILS', () => {
  const dir = sandbox(({ dir: d }) => {
    // `types/model.d.ts` is no subpath entry: only ./resolve and ./loader
    // import it. Leg A cannot see it; leg B must.
    fs.rmSync(path.join(d, 'types', 'model.d.ts'));
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted a retired transitive declaration');
  assert.ok(
    codes(report).includes('B:specifier_dangling'),
    `expected B:specifier_dangling, got ${codes(report).join(', ')}`
  );
});

test('vector B3 · a declaration nothing reaches FAILS as an orphan', () => {
  const dir = sandbox(({ dir: d }) => {
    fs.writeFileSync(
      path.join(d, 'types', 'huerfano.d.ts'),
      'export declare const nadie: string;\n',
      'utf8'
    );
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted an unreachable declaration');
  assert.ok(codes(report).includes('B:declaration_orphan'));
});

test('vector C · a wildcard runtime target without its declaration FAILS', () => {
  const dir = sandbox(({ dir: d }) => {
    fs.rmSync(path.join(d, 'types', 'schemas', 'volumes.json.d.ts'));
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted an undeclared wildcard target');
  const detail = report.findings.map((f) => f.detail).join(' | ');
  assert.ok(detail.includes('volumes.json'), detail);
});

test('vector J · a wildcard declaration that drops the import-attribute note FAILS', () => {
  // The `types` condition on `./schemas/*` switches TS1543 off (see
  // test/json-import-attribute.test.mjs), so the note in the declaration is
  // the only warning a consumer gets. A regeneration that dropped it would be
  // invisible without this leg.
  const dir = sandbox(({ dir: d }) => {
    const decl = path.join(d, 'types', 'schemas', 'registro.json.d.ts');
    fs.writeFileSync(
      decl,
      fs.readFileSync(decl, 'utf8').replace(/with \{ type: 'json' \}/g, '(nota borrada)'),
      'utf8'
    );
  });
  const report = gateExportsTypes(dir);
  assert.equal(report.ok, false, 'gate accepted a declaration without the attribute contract');
  assert.ok(
    codes(report).includes('J:attribute_contract_missing'),
    `expected J:attribute_contract_missing, got ${codes(report).join(', ')}`
  );
});

test('all nineteen wildcard declarations carry the attribute contract', () => {
  const report = gateExportsTypes(PKG_DIR);
  assert.equal(
    report.findings.filter((f) => f.leg === 'J').length,
    0,
    'a shipped schema declaration lost its import-attribute note'
  );
});

test('the root types field and the publishable files entry are checked', () => {
  const noTypes = sandbox(({ manifest }) => {
    delete manifest.types;
  });
  assert.ok(codes(gateExportsTypes(noTypes)).includes('root:types_field_missing'));

  const noFiles = sandbox(({ manifest }) => {
    manifest.files = manifest.files.filter((f) => f !== 'types');
  });
  assert.ok(codes(gateExportsTypes(noFiles)).includes('root:files_missing_types'));
});
