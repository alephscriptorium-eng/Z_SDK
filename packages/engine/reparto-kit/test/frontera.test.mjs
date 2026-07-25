import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

// Deps permitidas: @zeus/protocol (core) y @zeus/view-kit (solo adaptador de
// vista). Ningún otro @zeus/*; ningún domain.mjs de juego.
const PERMITIDOS = ['@zeus/protocol', '@zeus/view-kit'];

test('frontera: imports solo protocol (core) + view-kit (vista); cero domain.mjs', () => {
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
      if (spec.startsWith('.')) continue; // relativo dentro del kit
      const okZeus = PERMITIDOS.some((p) => spec === p || spec.startsWith(`${p}/`));
      if (spec.startsWith('@zeus/') && !okZeus) {
        offenders.push(`${f}: import @zeus inesperado ${spec}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('frontera: solo vista.mjs importa @zeus/view-kit (core libre de la cadena 3D)', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.mjs'));
  for (const f of files) {
    const body = readFileSync(join(srcDir, f), 'utf8');
    const usaViewKit = /from\s+['"]@zeus\/view-kit['"]/.test(body);
    if (usaViewKit) assert.equal(f, 'vista.mjs', `solo vista.mjs debe importar view-kit; violó ${f}`);
  }
});
