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

test('release.yml: release job needs quality+test; publish gated on _password basic-auth', () => {
  const yml = fs.readFileSync(
    path.join(root, '.github/workflows/release.yml'),
    'utf8'
  );
  // WP-U263 · la aserción era `\[quality,\s*test\]`, que fijaba el corchete de
  // cierre justo detrás de `test` y por tanto prohibía AÑADIR gates. U263 pasa
  // el `needs` a `[quality, test, sello-root, smoke-ts-registry]` porque un job
  // de verificación que no está en el `needs` del que publica corre en PARALELO
  // con la publicación y no la bloquea. Se conserva la intención —quality y test
  // tienen que seguir estando— y se deja de pinchar el número de gates: la
  // exigencia se vuelve de INCLUSIÓN, igual que la regla de paridad.
  const needs = yml.match(/needs:\s*\[([^\]]*)\]/);
  assert.ok(needs, 'el job release debe declarar un `needs`');
  const gates = needs[1].split(',').map((s) => s.trim());
  assert.ok(gates.includes('quality'), `quality debe bloquear la publicación: ${needs[0]}`);
  assert.ok(gates.includes('test'), `test debe bloquear la publicación: ${needs[0]}`);
  assert.match(yml, /has_npm/);
  assert.match(yml, /secrets\.NPM_USERNAME/);
  assert.match(yml, /secrets\.NPM_PASSWORD/);
  // Canónico ScriptoriumVps/.npmrc.example (D-24 a): orden username →
  // _password → email → always-auth
  assert.match(yml, /:username=\$\{NPM_USERNAME\}/);
  assert.match(yml, /:_password=\$\{NPM_PASSWORD\}/);
  assert.match(yml, /:email=ci@scriptorium\.escrivivir\.co/);
  assert.match(yml, /:always-auth=true/);
  const userIdx = yml.indexOf(':username=${NPM_USERNAME}');
  const passIdx = yml.indexOf(':_password=${NPM_PASSWORD}');
  const emailIdx = yml.indexOf(':email=ci@scriptorium.escrivivir.co');
  const alwaysIdx = yml.indexOf(':always-auth=true');
  assert.ok(userIdx > 0 && userIdx < passIdx && passIdx < emailIdx && emailIdx < alwaysIdx);
  assert.match(yml, /changesets\/action@v1/);
  assert.match(yml, /createGithubReleases:\s*true/);
  assert.match(yml, /if:\s*steps\.creds\.outputs\.has_npm == 'true'/);
  assert.match(yml, /Skip publish without credentials/);
  // WP-U122 demolition: no JWT-as-NPM_TOKEN / NODE_AUTH_TOKEN / _auth wiring
  assert.equal(yml.includes('NODE_AUTH_TOKEN'), false);
  assert.equal(yml.includes('secrets.NPM_TOKEN'), false);
  assert.equal(/registry-url:/.test(yml), false);
  assert.equal(yml.includes(':_authToken='), false);
  assert.equal(yml.includes(':_auth='), false);
});

test('release-dry.mjs has no LOCKSTEP constant (demolition)', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/release-dry.mjs'), 'utf8');
  assert.equal(src.includes('LOCKSTEP'), false);
  assert.equal(/lockstep\s+0\.1\.0/i.test(src), false);
});

test('version tree prepared: protocol CHANGELOG after changesets consumed (WP-U105)', () => {
  const cl = path.join(root, 'packages/engine/protocol/CHANGELOG.md');
  assert.equal(fs.existsSync(cl), true);
  const body = fs.readFileSync(cl, 'utf8');
  assert.match(body, /0\.2\.0/);
  const pending = fs
    .readdirSync(path.join(root, '.changeset'))
    .filter((f) => f.endsWith('.md') && f !== 'README.md');
  assert.equal(pending.length, 0, 'pending changesets should be consumed into version tree');
});
