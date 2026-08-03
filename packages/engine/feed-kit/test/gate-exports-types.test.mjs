import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateExportsTypes } from './gate-exports-types.mjs';

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('gate exports↔declarations: limpio sobre el paquete', () => {
  const r = gateExportsTypes(PKG);
  assert.equal(r.ok, true, JSON.stringify(r.findings, null, 2));
  assert.equal(r.checked.subpaths, 6);
  assert.ok(r.checked.declarations >= 6);
});
