import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTypeDeclarations } from '../spec/types-build.mjs';
import { EVENT_KINDS, ROLES, PROTOCOL_VERSION } from '../src/index.mjs';

const typesPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'types',
  'index.d.ts'
);

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
