/**
 * WP-U53 — release:dry helpers + workflow contract.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isSemver,
  verifyTarball,
  REGISTRY
} from '../../scripts/release-dry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('isSemver accepts independent package versions (no lockstep)', () => {
  assert.equal(isSemver('0.1.0'), true);
  assert.equal(isSemver('0.2.0'), true);
  assert.equal(isSemver('1.0.0'), true);
  assert.equal(isSemver('0.1.0-alpha.1'), true);
  assert.equal(isSemver('not-a-version'), false);
  assert.equal(isSemver(''), false);
});

test('verifyTarball rejects invalid semver, accepts divergent versions', () => {
  const tmp = fs.mkdtempSync(path.join(root, '.release-dry-test-'));
  try {
    fs.writeFileSync(path.join(tmp, 'README.md'), '# t\n');
    const basePkg = {
      name: '@zeus/fake',
      version: '0.2.0',
      files: ['README.md'],
      publishConfig: { registry: REGISTRY }
    };
    const ok = verifyTarball(tmp, basePkg, ['README.md', 'package.json']);
    assert.deepEqual(ok.errors, []);

    const bad = verifyTarball(
      tmp,
      { ...basePkg, version: 'lockstep-nope' },
      ['README.md', 'package.json']
    );
    assert.ok(bad.errors.some((e) => /not valid semver/.test(e)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('verifyTarball accepts exports subpath wildcards when files exist (linea-kit)', () => {
  const tmp = fs.mkdtempSync(path.join(root, '.release-dry-test-'));
  try {
    fs.writeFileSync(path.join(tmp, 'README.md'), '# t\n');
    const pkg = {
      name: '@zeus/fake-schemas',
      version: '0.1.0',
      files: ['README.md', 'schemas'],
      publishConfig: { registry: REGISTRY },
      exports: {
        '.': './README.md',
        './schemas/*': './schemas/*'
      }
    };
    const ok = verifyTarball(tmp, pkg, [
      'README.md',
      'package.json',
      'schemas/force.json',
      'schemas/cota.json'
    ]);
    assert.deepEqual(ok.errors, []);

    const missing = verifyTarball(tmp, pkg, ['README.md', 'package.json']);
    assert.ok(
      missing.errors.some((e) => /exports target missing from tarball: \.\/schemas\/\*/.test(e))
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('release.yml: release job needs quality+test; publish gated on NPM_TOKEN', () => {
  const yml = fs.readFileSync(
    path.join(root, '.github/workflows/release.yml'),
    'utf8'
  );
  assert.match(yml, /needs:\s*\[quality,\s*test\]/);
  assert.match(yml, /has_npm/);
  assert.match(yml, /secrets\.NPM_TOKEN/);
  assert.match(yml, /changesets\/action@v1/);
  assert.match(yml, /createGithubReleases:\s*true/);
  assert.match(yml, /if:\s*steps\.creds\.outputs\.has_npm == 'true'/);
  assert.match(yml, /Skip publish without credentials/);
});

test('release-dry.mjs has no LOCKSTEP constant (demolition)', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/release-dry.mjs'), 'utf8');
  assert.equal(src.includes('LOCKSTEP'), false);
  assert.equal(/lockstep\s+0\.1\.0/i.test(src), false);
});

test('pending test changeset exists for CA path', () => {
  const cs = path.join(root, '.changeset/wp-u53-changesets.md');
  assert.equal(fs.existsSync(cs), true);
  const body = fs.readFileSync(cs, 'utf8');
  assert.match(body, /@zeus\/protocol/);
  assert.match(body, /patch/);
});
