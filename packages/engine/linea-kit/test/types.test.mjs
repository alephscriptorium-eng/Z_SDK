/**
 * WP-U264 · nada en CI podía cazar una declaración `.d.ts` corrompida.
 *
 * WP-U245 dejó la deuda escrita en la cabecera del gate: `existsSync` es todo
 * lo que hace, así que una declaración VACÍA o SINTÁCTICAMENTE ROTA pasaba
 * `PASS … 50 declarations` con `EXIT=0`. Y `test/types/check.mjs` —lo único
 * que compila algo— no lo corría `npm test` ni ningún workflow.
 *
 * Este fichero es la respuesta, y vive aquí por una razón medida: el `test`
 * de este paquete es `node --test test/*.test.mjs`, y `@zeus/linea-kit` es una
 * fila de la matriz de CI (`.github/workflows/ci.yml`). Estar en `test/` con
 * ese nombre es lo que lo mete en CI **sin tocar el workflow**.
 *
 * Corre tres cosas:
 *
 *   1. que el compilador sea el que el paquete FIJA. Sin esta guarda todo lo
 *      demás es teatro: `check.mjs` busca `tsc` andando hacia arriba, y hacia
 *      arriba de este paquete vive un `typescript@4.9.5` transitivo (lock:
 *      `node_modules/typescript`, `devOptional`, de `typescript-json-schema`).
 *      Con ese 4.9.5 los dos consumidores de U245 caen con `TS1005` —no sabe
 *      leer `with { type: 'json' }`— y los 13 negativos siguen diciendo PASS:
 *      rojo por una razón, verde por otra, y ninguna es la declarada.
 *
 *   2. los vectores de `types/corrupt/`: una declaración vacía y una rota
 *      tienen que ENROJECER, con el error nombrando la causa.
 *
 *   3. `types/check.mjs` entero: los dos consumidores y los 13 `must-fail`.
 *      Hasta hoy sólo corrían a mano.
 *
 * Los negativos van con su control: la copia SIN mutar compila limpia (si no,
 * el rojo sería del banco de pruebas, no del vector) y el gate de U245 —el
 * guardián viejo— dice `ok` sobre la MISMA copia corrompida, que es la
 * demostración de que el rojo lo pone esta comprobación y nada más.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { gateExportsTypes } from './gate-exports-types.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(HERE, '..');
const CORRUPT_DIR = path.join(HERE, 'types', 'corrupt');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));
const PINNED = MANIFEST.devDependencies?.typescript;

/**
 * El mismo eje que `test/types/consumer-nodenext/tsconfig.json`, incluido su
 * `"types": []`, que en la CLI sólo se sabe decir apuntando `typeRoots` a un
 * directorio que no existe. No es cosmético: sin él el programa arrastra los
 * `@types/*` del monorepo (84 tras `npm ci`) y cualquier rojo de ésos pasaría
 * por rojo del vector.
 */
const TSC_FLAGS = [
  '--noEmit',
  '--module', 'NodeNext',
  '--moduleResolution', 'NodeNext',
  '--strict',
  '--noImplicitAny',
  '--target', 'ES2022',
  '--lib', 'ES2022',
  '--typeRoots', path.join(HERE, '__sin-tipos-ambientales__')
];

/**
 * `typescript` resuelto DESDE ESTE PAQUETE. No es un paseo por directorios
 * como el de `check.mjs`: es la resolución de Node, la misma que usaría
 * cualquiera que dependiera del paquete.
 * @returns {{ home: string, tsc: string, version: string } | { error: string }}
 */
function resolveTypescript() {
  const requireFromPkg = createRequire(path.join(PKG_DIR, 'package.json'));
  let entry;
  try {
    entry = requireFromPkg.resolve('typescript');
  } catch (err) {
    return { error: `no resuelve desde ${PKG_DIR}: ${err.code ?? err.message}` };
  }
  const home = path.resolve(path.dirname(entry), '..');
  const manifest = path.join(home, 'package.json');
  if (!fs.existsSync(manifest)) return { error: `sin package.json en ${home}` };
  const tsc = path.join(home, 'bin', 'tsc');
  if (!fs.existsSync(tsc)) return { error: `sin bin/tsc en ${home}` };
  return { home, tsc, version: JSON.parse(fs.readFileSync(manifest, 'utf8')).version };
}

const TS = resolveTypescript();

/** Toda declaración bajo `types/`, relativa a la raíz del paquete. */
function declarations(root) {
  /** @type {string[]} */
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith('.d.ts')) out.push(abs);
    }
  })(path.join(root, 'types'));
  return out.map((abs) => path.relative(root, abs).split(path.sep).join('/'));
}

/**
 * Copia real del paquete (manifiesto + `types/` + `schemas/`) y una mutación.
 * Nada de sistema de ficheros simulado: es el mismo banco que usa
 * `test/exports-types.test.mjs`, para que el gate viejo pueda opinar sobre
 * exactamente la misma copia.
 */
function sandbox(mutate = () => {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u264-'));
  fs.cpSync(path.join(PKG_DIR, 'types'), path.join(dir, 'types'), { recursive: true });
  fs.cpSync(path.join(PKG_DIR, 'schemas'), path.join(dir, 'schemas'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(MANIFEST, null, 2),
    'utf8'
  );
  mutate(dir);
  return dir;
}

/**
 * Compila las declaraciones de una copia MÁS un `probe.ts` que las importa
 * una a una.
 *
 * El `probe.ts` no es adorno y está medido: `types/index.d.ts` vacío —el
 * barril raíz, al que no importa nadie— compila `EXIT=0` sin él, porque un
 * fichero vacío es un script válido. Importarlo es lo que convierte «vacío»
 * en `TS2306: not a module`.
 */
function compile(dir) {
  const decls = declarations(dir);
  const probe = decls
    .map((rel, i) => {
      const spec = `./${rel.replace(/\.d\.ts$/, '.js')}`;
      return `import * as decl${i} from '${spec}';\nvoid decl${i};`;
    })
    .join('\n');
  fs.writeFileSync(path.join(dir, 'probe.ts'), `${probe}\n`, 'utf8');

  const run = spawnSync(
    process.execPath,
    [TS.tsc, ...decls, 'probe.ts', ...TSC_FLAGS],
    { cwd: dir, encoding: 'utf8' }
  );
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim();
  return {
    status: run.status,
    output,
    errors: output.split('\n').filter((line) => line.includes('error TS')),
    declarations: decls.length
  };
}

// ---------------------------------------------------------------------------
// 1 · el compilador es el que el paquete FIJA
// ---------------------------------------------------------------------------

test('el paquete FIJA su compilador y es ése el que se usa', () => {
  assert.equal(
    typeof PINNED,
    'string',
    'package.json tiene que declarar devDependencies.typescript: sin fijarlo, ' +
      'la comprobación usa el typescript que flote en el árbol'
  );
  assert.ok(
    !TS.error,
    `typescript no está instalado para este paquete (${TS.error}). ` +
      `Corre \`npm ci\` en la raíz del monorepo. Este test NO se auto-omite a ` +
      `propósito: omitirlo es exactamente el agujero que WP-U264 vino a cerrar.`
  );
  assert.equal(
    TS.version,
    PINNED,
    `typescript resuelto = ${TS.version}, fijado = ${PINNED}. ` +
      `Hacia arriba de este paquete vive un typescript transitivo (4.9.5 en el ` +
      `lock del monorepo) que NO sabe leer \`with { type: 'json' }\`: con él los ` +
      `consumidores de U245 caen con TS1005 y el rojo no dice lo que parece. ` +
      `Resuelto desde: ${TS.home}`
  );
});

// ---------------------------------------------------------------------------
// 2 · control del banco de pruebas — sin él, cualquier rojo vale
// ---------------------------------------------------------------------------

test('la copia SIN mutar compila limpia (el banco no es la causa del rojo)', () => {
  const dir = sandbox();
  const result = compile(dir);
  assert.equal(
    result.status,
    0,
    `la copia intacta ya viene roja, así que ningún vector de abajo prueba ` +
      `nada:\n${result.output}`
  );
  assert.equal(
    result.declarations,
    50,
    'el paquete tiene que seguir declarando 50 ficheros; si cambia, es un ' +
      'cambio real de superficie y hay que mirarlo'
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 3 · los vectores: una declaración vacía y una rota tienen que ENROJECER
// ---------------------------------------------------------------------------

/**
 * `target` es la declaración que cada vector sustituye.
 *
 * `vacia` va DOS veces y no es redundante: contra `types/model.d.ts` la caza
 * su importador (`loader.d.ts`, `resolve.d.ts`), pero contra
 * `types/index.d.ts` —barril raíz, subpath `.`, no lo importa nadie— sólo la
 * caza el `probe.ts`. Medido: sin probe, ese caso compila EXIT=0.
 */
const VECTORS = [
  {
    name: 'vacía · declaración transitiva (types/model.d.ts)',
    vector: 'vacia.d.ts.vector',
    target: 'types/model.d.ts',
    expect: /error TS2306/,
    causa: 'TS2306 — el fichero existe pero no es un módulo'
  },
  {
    name: 'vacía · barril de entrada (types/index.d.ts, subpath ".")',
    vector: 'vacia.d.ts.vector',
    target: 'types/index.d.ts',
    expect: /error TS2306/,
    causa: 'TS2306 — el barril raíz existe pero no es un módulo'
  },
  {
    name: 'rota · declaración truncada (types/model.d.ts)',
    vector: 'rota.d.ts.vector',
    target: 'types/model.d.ts',
    expect: /error TS1\d{3}/,
    causa: 'TS1xxx — error de gramática, la declaración no se puede ni leer'
  }
];

for (const v of VECTORS) {
  test(`vector ${v.name} ENROJECE`, () => {
    assert.ok(!TS.error, `sin compilador no hay vector que valga: ${TS.error}`);
    const content = fs.readFileSync(path.join(CORRUPT_DIR, v.vector), 'utf8');
    const dir = sandbox((d) => fs.writeFileSync(path.join(d, v.target), content, 'utf8'));

    const result = compile(dir);
    assert.notEqual(
      result.status,
      0,
      `${v.target} corrompida con ${v.vector} y tsc salió 0: la declaración ` +
        `corrupta pasó entera. Causa esperada: ${v.causa}`
    );
    const named = result.errors.filter((line) => v.expect.test(line));
    assert.ok(
      named.length > 0,
      `enrojeció, pero por otra causa que la declarada (${v.causa}). ` +
        `Errores:\n${result.errors.join('\n')}`
    );
    // `tsc` nombra el fichero con barras hacia delante en las dos plataformas,
    // sea la ruta relativa a la copia o absoluta, así que `v.target` aparece
    // literal en la línea. Sin esta aserción, el vector se conformaría con un
    // rojo cualquiera.
    assert.ok(
      named.some((line) => line.includes(v.target)),
      `el error no nombra ${v.target}, así que el rojo puede venir de otro ` +
        `fichero:\n${named.join('\n')}`
    );

    // CA5 · el guardián viejo APAGADO sobre ESTA MISMA copia: si el gate de
    // U245 también enrojeciera, el vector no probaría que este test aporta
    // nada. Dice `ok` — la ceguera es la deuda, y sigue exactamente donde
    // U245 la dejó escrita.
    const viejo = gateExportsTypes(dir);
    assert.equal(
      viejo.ok,
      true,
      `el gate existsSync ya cazaba este vector, luego el rojo de arriba no ` +
        `es mérito de esta comprobación: ${JSON.stringify(viejo.findings)}`
    );
    assert.equal(viejo.checked.declarations, 50);

    fs.rmSync(dir, { recursive: true, force: true });
  });
}

// ---------------------------------------------------------------------------
// 4 · los 13 `must-fail` de U245 y sus dos consumidores, AHORA en CI
// ---------------------------------------------------------------------------

test('los negativos y los consumidores de U245 corren aquí, no sólo a mano', () => {
  assert.ok(!TS.error, `sin compilador no corren: ${TS.error}`);

  const mustFailDir = path.join(HERE, 'types', 'must-fail');
  const casos = fs
    .readdirSync(mustFailDir)
    .filter((f) => f.endsWith('.ts'))
    .sort();
  assert.ok(
    casos.length >= 13,
    `U245 dejó 13 controles negativos y quedan ${casos.length}: retirar uno es ` +
      `retirar la prueba de que esa declaración sigue mordiendo`
  );

  const run = spawnSync(
    process.execPath,
    [path.join(HERE, 'types', 'check.mjs'), '--tsc', TS.tsc],
    { cwd: PKG_DIR, encoding: 'utf8' }
  );
  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
  assert.equal(run.status, 0, `types/check.mjs salió ${run.status}:\n${output}`);

  for (const caso of casos) {
    assert.ok(
      output.includes(`PASS must-fail/${caso} — rejected`),
      `must-fail/${caso} no aparece rechazado en la salida; un negativo que no ` +
        `corre es un negativo que no existe:\n${output}`
    );
  }
  for (const consumer of ['consumer-nodenext', 'consumer-bundler']) {
    assert.ok(
      output.includes(`PASS ${consumer} — tsc --noEmit, 0 errors`),
      `${consumer} no compiló limpio:\n${output}`
    );
  }
});
