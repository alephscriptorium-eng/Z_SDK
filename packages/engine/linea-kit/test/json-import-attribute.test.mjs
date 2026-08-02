/**
 * WP-U245 · B1 — the `./schemas/*` subpath REQUIRES `with { type: 'json' }`.
 *
 * Why this file exists. Adding a `types` condition to the wildcard subpath
 * buys a typed document and PAYS for it by switching a compiler check off:
 * with the declaration in place, TypeScript resolves the subpath to a `.d.ts`
 * and stops emitting
 *
 *   TS1543: Importing a JSON file into an ECMAScript module requires a
 *           'type: "json"' import attribute when 'module' is set to 'NodeNext'.
 *
 * while Node still refuses the bare import at load time. Retiring the
 * declaration brings TS1543 back but loses the typed document, which is worse.
 * So the check is traded away deliberately — and this test is what stands in
 * its place: it asserts, at runtime and in CI, that the contract the 19
 * declarations document is still the contract Node enforces.
 *
 * If Node ever stops requiring the attribute, this test goes red and the
 * paragraph in all 19 declarations has to be rewritten. That is the point.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMAS_DIR = path.join(PKG_DIR, 'schemas');

const schemaFiles = fs
  .readdirSync(SCHEMAS_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

/** The runtime target of `@zeus/linea-kit/schemas/<name>`, as a file URL. */
function targetUrl(name) {
  return pathToFileURL(path.join(SCHEMAS_DIR, name)).href;
}

test('there are schema documents to check at all', () => {
  assert.equal(schemaFiles.length, 19, 'the wildcard covers nineteen documents');
});

test('the BARE import of a schema target is refused by Node', async () => {
  await assert.rejects(
    () => import(targetUrl('volumes.json')),
    (err) => {
      assert.equal(
        err.code,
        'ERR_IMPORT_ATTRIBUTE_MISSING',
        `expected ERR_IMPORT_ATTRIBUTE_MISSING, got ${err.code}: ${err.message}`
      );
      return true;
    },
    'a bare import of the JSON target must NOT load'
  );
});

test("with { type: 'json' } every one of the nineteen loads", async () => {
  for (const name of schemaFiles) {
    const mod = await import(targetUrl(name), { with: { type: 'json' } });
    const doc = mod.default;
    assert.ok(doc && typeof doc === 'object', `${name} did not load a document`);
    // The five members `JsonSchemaDocument` declares are the promise the 19
    // declarations make. Check them here so the type cannot drift from disk.
    for (const key of ['$schema', '$id', 'title', 'description', 'type']) {
      assert.equal(typeof doc[key], 'string', `${name} is missing a string ${key}`);
    }
  }
});

test('the bare import is refused for every one of the nineteen, not just one', async () => {
  for (const name of schemaFiles) {
    await assert.rejects(
      () => import(targetUrl(name)),
      (err) => err.code === 'ERR_IMPORT_ATTRIBUTE_MISSING',
      `${name} loaded without an import attribute`
    );
  }
});

test('the JSON module exposes a default export only (no named members)', async () => {
  const mod = await import(targetUrl('curation-status.json'), { with: { type: 'json' } });
  assert.deepEqual(
    Object.keys(mod).filter((k) => k !== 'default'),
    [],
    'a JSON module must expose nothing but `default`'
  );
});
