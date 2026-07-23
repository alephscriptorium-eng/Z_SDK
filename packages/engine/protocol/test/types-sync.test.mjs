import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTypeDeclarations,
  buildSubpathTypeDeclarations,
  TYPED_SUBPATHS
} from '../spec/types-build.mjs';
import { EVENT_KINDS, ROLES, PROTOCOL_VERSION } from '../src/index.mjs';

const typesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'types'
);
const typesPath = path.join(typesDir, 'index.d.ts');
const pkgPath = path.join(typesDir, '..', 'package.json');

test('generated .d.ts lists event kinds and roles from contract', () => {
  const dts = buildTypeDeclarations();
  for (const kind of EVENT_KINDS) {
    assert.match(dts, new RegExp(`'${kind}'`));
  }
  for (const role of ROLES) {
    assert.match(dts, new RegExp(`'${role}'`));
  }
  assert.match(dts, new RegExp(`PROTOCOL_VERSION: ${PROTOCOL_VERSION}`));
  assert.match(dts, /export interface IntentPayload/);
  assert.match(dts, /export declare function makeIntent/);
});

test('types/index.d.ts is in sync with generator', () => {
  assert.ok(fs.existsSync(typesPath), 'types/index.d.ts missing — run types:generate');
  const onDisk = fs.readFileSync(typesPath, 'utf8');
  assert.equal(
    onDisk,
    buildTypeDeclarations(),
    'types/index.d.ts stale — run: npm run types:generate -w @zeus/protocol'
  );
});

test('subpath .d.ts files are in sync with generator (WP-U155)', () => {
  const expected = buildSubpathTypeDeclarations();
  assert.deepEqual(
    Object.keys(expected).sort(),
    [...TYPED_SUBPATHS].sort(),
    'TYPED_SUBPATHS must match buildSubpathTypeDeclarations keys'
  );
  for (const name of TYPED_SUBPATHS) {
    const filePath = path.join(typesDir, `${name}.d.ts`);
    assert.ok(fs.existsSync(filePath), `missing types/${name}.d.ts — run types:generate`);
    assert.equal(
      fs.readFileSync(filePath, 'utf8'),
      expected[name],
      `types/${name}.d.ts stale — run: npm run types:generate -w @zeus/protocol`
    );
  }
});

test('package exports JS subpaths expose types → published .d.ts (WP-U155)', () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const files = pkg.files ?? [];
  assert.ok(files.includes('types'), 'files must include types/ for publish');

  for (const sub of TYPED_SUBPATHS) {
    const entry = pkg.exports[`./${sub}`];
    assert.equal(typeof entry, 'object', `exports["./${sub}"] must be conditional object`);
    assert.equal(
      entry.types,
      `./types/${sub}.d.ts`,
      `exports["./${sub}"].types`
    );
    assert.ok(
      fs.existsSync(path.join(typesDir, `${sub}.d.ts`)),
      `types/${sub}.d.ts must exist on disk`
    );
  }

  // YAML / build script — no types condition (documented)
  assert.equal(pkg.exports['./spec'], './spec/asyncapi.yaml');
  assert.equal(pkg.exports['./spec/build'], './spec/build.mjs');
});

test('peer-card-seat.d.ts declares seat API without any escape', () => {
  const dts = buildSubpathTypeDeclarations()['peer-card-seat'];
  assert.match(dts, /export declare function generateSeatKeyPair\(\): SeatKeyPair/);
  assert.match(dts, /export declare function signTravelingPeerCard/);
  assert.match(dts, /export declare function verifyTravelingPeerCard/);
  assert.doesNotMatch(dts, /:\s*any\b/);
  assert.doesNotMatch(dts, /as any/);
});
