/**
 * WP-U263 — el flujo que publica no verifica MENOS que el flujo diario.
 *
 * Por qué existe. `release.yml` llevaba su propia copia de la matriz de test y
 * la copia se pudrió: `needs_volumes_root` estaba 8 veces en `ci.yml` y 0 en
 * `release.yml`, y `Release` acumuló 8 runs en rojo sobre `main` sin que nadie
 * lo mirara. `scripts/verificacion-paridad.mjs` cierra eso; este fichero
 * comprueba que el instrumento MUERDE, porque un gate que nunca se ha visto en
 * rojo no se sabe si es un gate.
 *
 * Los vectores se montan en `os.tmpdir()`, NUNCA sobre el árbol del repo: la
 * suite de `test/gates/` está vigilada por `arbol-inmutable.test.mjs`, que
 * denuncia toda escritura anclada al repo. Aquí se lee el par real de flujos y
 * se escriben COPIAS mutadas fuera.
 *
 * POR QUÉ LAS VARIABLES NO SE LLAMAN `ci` NI `release`. El guardián estático
 * propaga el ancla POR NOMBRE y sin ámbito, y comprueba si un nombre anclado
 * aparece —delimitado por caracteres no-palabra— dentro de los argumentos de la
 * escritura. Con `const ci = mutar(CI_REAL, …)` el nombre `ci` queda anclado
 * (la regla de «concatenación de cadenas» empuja el RHS entero, que menciona
 * `CI_REAL`), y entonces el literal `'ci.yml'` de `path.join(dir, 'ci.yml')`
 * CONTIENE `ci` entre `'` y `.` — así que el guardián marcaba como escritura
 * sobre el repo un `writeFileSync` a un temporal. Es un falso positivo suyo,
 * medido y reproducido. Se rodea cambiando el idioma —`diario` / `publicacion`,
 * `fCi` / `fRelease`—, que es lo que hizo WP-U260 ante el mismo guardián, y NO
 * tocando `MUTADORES` ni añadiéndole una excepción: desafilar la regla para que
 * quepa mi arnés la desactivaría justo donde importa.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const AQUI = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(AQUI), '../..');
const GUARDA = path.join(REPO, 'scripts', 'verificacion-paridad.mjs');

/**
 * Los flujos se leen NORMALIZADOS a LF. No es cosmética: este repo tiene
 * `core.autocrlf=true`, así que en un checkout de Windows los dos ficheros
 * llegan con CRLF y en el runner de CI con LF. Si los anclajes de los vectores
 * dependieran del final de línea, esta suite sería verde en Linux y roja en el
 * banco del operador — que es exactamente la clase de defecto que persigue el
 * WP. La guarda parte por `/\r?\n/` y le da igual; que le dé igual se asevera
 * abajo con su propio vector, no se supone.
 */
const aLF = (s) => s.replace(/\r\n/g, '\n');
const CI_REAL = aLF(fs.readFileSync(path.join(REPO, '.github/workflows/ci.yml'), 'utf8'));
const RELEASE_REAL = aLF(fs.readFileSync(path.join(REPO, '.github/workflows/release.yml'), 'utf8'));

/**
 * Escribe el par de flujos en un directorio temporal y corre la guarda contra
 * ellos. Devuelve el código de salida y la salida junta.
 * @param {string} diario contenido del flujo tipo `ci.yml`
 * @param {string} publicacion contenido del flujo tipo `release.yml`
 */
function correr(diario, publicacion) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u263-'));
  try {
    const fCi = path.join(dir, 'ci.yml');
    const fRelease = path.join(dir, 'release.yml');
    fs.writeFileSync(fCi, diario);
    fs.writeFileSync(fRelease, publicacion);
    const r = spawnSync(process.execPath, [GUARDA, fCi, fRelease], {
      encoding: 'utf8',
      cwd: REPO
    });
    return { code: r.status, salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Sustituye una vez y asevera que la sustitución OCURRIÓ (si no, el vector
 *  no estaría probando nada y el test pasaría por la razón equivocada). */
function mutar(texto, buscar, reemplazo) {
  assert.ok(texto.includes(buscar), `el vector no encontró su ancla: ${buscar.slice(0, 60)}`);
  return texto.replace(buscar, reemplazo);
}

// ---------------------------------------------------------------------------
// 0 · Verde de referencia — el par real del repo pasa
// ---------------------------------------------------------------------------

test('el par real de flujos cumple la paridad', () => {
  const { code, salida } = correr(CI_REAL, RELEASE_REAL);
  assert.equal(code, 0, salida);
  assert.match(salida, /paridad OK/);
  assert.match(salida, /matriz OK/);
});

// ---------------------------------------------------------------------------
// 1 · Cobertura de pasos — quita un comando de un lado
// ---------------------------------------------------------------------------

test('VECTOR · un paso de ci.yml que falta en release.yml pone ROJO', () => {
  const publicacion = mutar(
    RELEASE_REAL,
    '      - name: Vigilancia del sello (verde + vectores rojos)\n' +
      '        run: node --test packages/engine/volumes-ops/test/sello-root-referencia.test.mjs\n',
    ''
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 1, salida);
  assert.match(salida, /PARIDAD ROTA/);
  assert.match(salida, /sello-root-referencia\.test\.mjs/);
});

test('VECTOR · un paso NUEVO en ci.yml que nadie trajo a release.yml pone ROJO', () => {
  const diario = mutar(
    CI_REAL,
    '      - name: Lint\n        run: npm run lint\n',
    '      - name: Lint\n        run: npm run lint\n' +
      '      - name: Control recien nacido\n        run: npm run test:release\n'
  );
  const { code, salida } = correr(diario, RELEASE_REAL);
  assert.equal(code, 1, salida);
  assert.match(salida, /PARIDAD ROTA/);
  assert.match(salida, /npm run test:release/);
});

// ---------------------------------------------------------------------------
// 2 · La marca blanda — copiar el paso y apagarlo con su `if`
// ---------------------------------------------------------------------------

test('VECTOR · la guarda copiada pero DESACTIVADA con `if` pone ROJO', () => {
  const publicacion = mutar(
    RELEASE_REAL,
    "        if: matrix.workspace == '@zeus/linea-system'\n",
    '        if: false\n'
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 1, salida);
  assert.match(salida, /PARIDAD ROTA/);
  assert.match(salida, /linea-system exige su root de VOLUMES/);
});

// ---------------------------------------------------------------------------
// 3 · Orden — sobre el grafo de `needs`, no sobre el número de línea
// ---------------------------------------------------------------------------

test('VECTOR · un job de verificación fuera del `needs` del que publica pone ROJO', () => {
  const publicacion = mutar(
    RELEASE_REAL,
    '    needs: [quality, test, sello-root, smoke-ts-registry]',
    '    needs: [quality, test]'
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 1, salida);
  assert.match(salida, /ORDEN ROTO/);
  // El diagnóstico distingue «no está» de «está, pero no bloquea».
  assert.match(salida, /NO bloquean la publicación/);
  assert.doesNotMatch(salida, /PARIDAD ROTA/);
});

test('el veredicto NO depende del final de línea (CRLF ≡ LF)', () => {
  // `core.autocrlf=true`: el operador ve CRLF, el runner LF. Un instrumento que
  // sólo entienda uno de los dos da verdes distintos en cada sitio.
  const aCRLF = (s) => s.replace(/\n/g, '\r\n');
  const verde = correr(aCRLF(CI_REAL), aCRLF(RELEASE_REAL));
  assert.equal(verde.code, 0, verde.salida);
  const rojo = correr(aCRLF(CI_REAL), aCRLF(mutar(RELEASE_REAL, "          - '@zeus/linea-kit'\n", '')));
  assert.equal(rojo.code, 1, rojo.salida);
  assert.match(rojo.salida, /MATRIZ ROTA/);
});

test('VECTOR · mover el job que publica AL PRINCIPIO del fichero no inventa un rojo', () => {
  // Un cotejo por número de línea daría falso ROJO aquí: los jobs de
  // verificación quedan por DEBAJO del `uses: changesets/action`. El grafo de
  // `needs` no cambia, así que la guarda tiene que seguir en verde.
  const i = RELEASE_REAL.indexOf('  release:\n');
  assert.ok(i > 0);
  const cabeza = RELEASE_REAL.slice(0, RELEASE_REAL.indexOf('jobs:\n') + 'jobs:\n'.length);
  const cuerpo = RELEASE_REAL.slice(cabeza.length);
  const jobRelease = cuerpo.slice(cuerpo.indexOf('  release:\n'));
  const resto = cuerpo.slice(0, cuerpo.indexOf('  release:\n'));
  const { code, salida } = correr(CI_REAL, `${cabeza}${jobRelease.trimEnd()}\n${resto}`);
  assert.equal(code, 0, salida);
  assert.match(salida, /paridad OK/);
});

// ---------------------------------------------------------------------------
// 4 · Matriz — el comando es idéntico; lo que falta es la FILA
// ---------------------------------------------------------------------------

test('VECTOR · quitar un workspace de la matriz de release.yml pone ROJO', () => {
  const publicacion = mutar(RELEASE_REAL, "          - '@zeus/linea-kit'\n", '');
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 1, salida);
  assert.match(salida, /MATRIZ ROTA/);
  assert.match(salida, /@zeus\/linea-kit/);
});

test('VECTOR · quitar el `include` de release.yml pone ROJO (el defecto original)', () => {
  const publicacion = mutar(
    RELEASE_REAL,
    "          - workspace: '@zeus/linea-system'\n            needs_volumes_root: true\n",
    ''
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 1, salida);
  assert.match(salida, /MATRIZ ROTA/);
  assert.match(salida, /needs_volumes_root/);
});

// ---------------------------------------------------------------------------
// 5 · Una publicación LEGÍTIMA no se bloquea
// ---------------------------------------------------------------------------

test('release.yml puede tener pasos y jobs propios sin que la guarda se queje', () => {
  // La regla es de inclusión y orden, NO de igualdad: si exigiera igualdad,
  // los pasos de credenciales/npmrc/changesets —que `ci.yml` no tiene ni debe
  // tener— bloquearían toda publicación. Aquí se añade además un paso nuevo
  // sólo de publicación.
  const publicacion = mutar(
    RELEASE_REAL,
    '      - name: Detect publish credentials\n',
    '      - name: Anunciar la version que sale\n' +
      '        run: echo "publicando $GITHUB_SHA"\n' +
      '      - name: Detect publish credentials\n'
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 0, salida);
  assert.match(salida, /paridad OK/);
});

// ---------------------------------------------------------------------------
// 6 · Fail-closed — si no entiende el flujo, muere; no aplaude
// ---------------------------------------------------------------------------

test('FAIL-CLOSED · sin paso que publique, sale 2 (no 0)', () => {
  const publicacion = RELEASE_REAL.replace(/uses:\s*changesets\/action@v1/, 'uses: actions/checkout@v4')
    .replace(/publish:\s*npm run release:publish/, 'publish: false')
    .replace(/createGithubReleases:\s*true/, 'createGithubReleases: false');
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 2, salida);
  assert.match(salida, /ningún paso que publique/);
});

test('FAIL-CLOSED · un ci.yml sin un solo `run:` sale 2 (no 0)', () => {
  const diario = 'name: CI\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n';
  const { code, salida } = correr(diario, RELEASE_REAL);
  assert.equal(code, 2, salida);
  assert.match(salida, /cero pasos/);
});

test('FAIL-CLOSED · un `needs` a un job inexistente sale 2 (no 0)', () => {
  const publicacion = mutar(
    RELEASE_REAL,
    '    needs: [quality, test, sello-root, smoke-ts-registry]',
    '    needs: [quality, test, sello-root, smoke-ts-registry, fantasma]'
  );
  const { code, salida } = correr(CI_REAL, publicacion);
  assert.equal(code, 2, salida);
  assert.match(salida, /no hay ningún job así/);
});

test('FAIL-CLOSED · un fichero que no existe sale 2 (no 0)', () => {
  const r = spawnSync(process.execPath, [GUARDA, 'no/existe/ci.yml', '.github/workflows/release.yml'], {
    encoding: 'utf8',
    cwd: REPO
  });
  assert.equal(r.status, 2, `${r.stdout}${r.stderr}`);
  assert.match(`${r.stderr}`, /no se pudo leer/);
});

// ---------------------------------------------------------------------------
// 7 · Los argumentos son para atacar el instrumento, no para saltárselo
// ---------------------------------------------------------------------------

test('la guarda imprime SIEMPRE qué par de ficheros ha mirado', () => {
  const { salida } = correr(CI_REAL, RELEASE_REAL);
  assert.match(salida, /verificación exigida por :/);
  assert.match(salida, /flujo que debe cumplirla :/);
  assert.match(salida, /publica {18}: job «release»/);
});
