import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Eje II: el contrato CredencialEmbajador / DEFAULT_STARTPACK vive solo aquí.
 * Grep simbólico dentro del paquete = una definición por símbolo canónico.
 */
const SYMBOLS = [
  'CREDENCIAL_VERSION',
  'DEFAULT_STARTPACK',
  'isCredencialEmbajadorShaped',
  'emitirCredencial',
  'consumirCredencial'
];

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

test('eje II: un destino canónico por símbolo de contrato en src/', () => {
  const files = walk(srcDir);
  for (const sym of SYMBOLS) {
    /** @type {string[]} */
    const defs = [];
    const exportRe = new RegExp(
      String.raw`export\s+(?:const|function|async function)\s+${sym}\b`
    );
    for (const f of files) {
      const body = readFileSync(f, 'utf8');
      if (exportRe.test(body)) defs.push(f);
    }
    assert.equal(
      defs.length,
      1,
      `${sym} debe tener exactamente 1 export def; got ${defs.join(', ')}`
    );
  }
});
