import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

test('frontera: imports solo protocolo / kits lectura; cero domain.mjs', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.mjs'));
  assert.ok(files.length > 0);
  /** @type {string[]} */
  const offenders = [];
  for (const f of files) {
    const body = readFileSync(join(srcDir, f), 'utf8');
    const importLines = body.split('\n').filter((l) => /^\s*import\s/.test(l));
    for (const line of importLines) {
      if (line.includes('domain.mjs') || line.includes('/domain"') || line.includes("/domain'")) {
        offenders.push(`${f}: ${line.trim()}`);
      }
      const m = line.match(/from\s+['"]([^'"]+)['"]/);
      if (!m) continue;
      const spec = m[1];
      if (spec.startsWith('.')) continue; // relative within kit
      if (spec === '@zeus/protocol' || spec.startsWith('@zeus/protocol/')) continue;
      // Allow no other @zeus/* engine packages unless reading kits — none needed.
      if (spec.startsWith('@zeus/')) {
        offenders.push(`${f}: unexpected zeus import ${spec}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});
