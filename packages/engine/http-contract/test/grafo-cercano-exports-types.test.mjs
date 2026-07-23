/**
 * WP-U157 — every JS export in the grafo-cercano lote exposes `"types"` → published `.d.ts`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

const LOTE = [
  'packages/engine/view-kit',
  'packages/engine/game-engine',
  'packages/engine/authority-kit',
  'packages/engine/room-client-browser',
  'packages/engine/http-contract',
  'packages/engine/ui-kit',
  'packages/engine/app-shell',
  'packages/engine/player-mcp-kit',
  'packages/mesh/socket-server'
];

test('grafo-cercano lote: JS exports expose types → .d.ts in files (WP-U157)', () => {
  for (const rel of LOTE) {
    const root = path.join(repoRoot, rel);
    const pj = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.ok(pj.types, `${pj.name}: missing root "types"`);
    assert.ok(
      (pj.files || []).includes('types'),
      `${pj.name}: "types" missing from files`
    );
    assert.ok(
      fs.existsSync(path.join(root, pj.types)),
      `${pj.name}: types file missing ${pj.types}`
    );

    for (const [sub, exp] of Object.entries(pj.exports || {})) {
      if (typeof exp === 'string') {
        // non-JS (spec markdown, etc.)
        continue;
      }
      assert.equal(typeof exp, 'object', `${pj.name}${sub}: export must be object`);
      assert.ok(exp.types, `${pj.name}${sub}: missing types condition`);
      assert.ok(exp.default, `${pj.name}${sub}: missing default condition`);
      assert.ok(
        fs.existsSync(path.join(root, exp.types)),
        `${pj.name}${sub}: types path missing ${exp.types}`
      );
    }
  }
});
