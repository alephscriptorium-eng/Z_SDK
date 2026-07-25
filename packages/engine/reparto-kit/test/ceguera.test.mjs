import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { crearReparto, validarReparto } from '../src/index.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');

// Vocabulario vetado del dominio (D-8 / vocabulario de reparto). Fragmentado
// para que este propio test no hospede los tokens completos.
const VETADO = ['nov' + 'ela', 'nov' + 'elist'].join('|');
const RE_VETADO = new RegExp(VETADO, 'gi');

function ficherosEscaneados() {
  const src = readdirSync(join(pkgDir, 'src')).map((f) => join('src', f));
  const types = readdirSync(join(pkgDir, 'types')).map((f) => join('types', f));
  return [...src, ...types, 'README.md'];
}

test('ceguera: cero vocabulario vetado en fuentes públicas (src + types + README)', () => {
  /** @type {Record<string, number>} */
  const conteo = {};
  let total = 0;
  for (const rel of ficherosEscaneados()) {
    const body = readFileSync(join(pkgDir, rel), 'utf8');
    const n = (body.match(RE_VETADO) || []).length;
    conteo[rel] = n;
    total += n;
  }
  assert.equal(total, 0, `vocabulario vetado encontrado: ${JSON.stringify(conteo)}`);
});

test('ceguera: fuentes públicas no nombran un juego concreto en PERMISOS/version', () => {
  // El contrato usa verbos genéricos de reparto; sin token de juego horneado.
  const tipos = readFileSync(join(pkgDir, 'src', 'tipos.mjs'), 'utf8');
  assert.match(tipos, /reparto:leer/);
  assert.doesNotMatch(tipos, /reparto:[a-z-]*(delta|solar|linea|ciudad|force)[a-z-]*/i);
});

test('ceguera: validarReparto marca !ok ante blob envenenado y ok ante blob limpio', () => {
  const limpio = crearReparto({
    personajes: [{ id: 'pj-1', nombre: 'Uno', rol: 'protagonista' }],
    politica: { protagonista: ['reparto:leer'] }
  });
  assert.deepEqual(validarReparto(limpio, VETADO), { ok: true, matches: [] });

  const envenenado = crearReparto({
    personajes: [{ id: 'pj-x', nombre: 'nov' + 'ela-fuga', rol: 'protagonista' }],
    politica: { protagonista: ['reparto:leer'] }
  });
  const gate = validarReparto(envenenado, VETADO);
  assert.equal(gate.ok, false);
  assert.ok(gate.matches.length >= 1);
});

test('ceguera: sin patrón → ok false (fail-safe)', () => {
  const r = crearReparto({ personajes: [], politica: {} });
  assert.deepEqual(validarReparto(r, undefined), { ok: false, matches: ['CEGUERA_PATTERN_undefined'] });
});
