/**
 * WP-U257 — guardián: el conjunto de reglas de gate se declara en UN solo sitio.
 *
 * POR QUÉ EXISTE. `GateRule` estaba escrito cuatro veces (`scan.mjs` typedef,
 * el literal de `byRule` en `runAllGates`, `exceptions.mjs` typedef y la prosa
 * de su cabecera). Aguantó dos altas de regla y se partió en la tercera:
 * `e7a608d` dio de alta la séptima sólo en `scan.mjs` y las copias de
 * `exceptions.mjs` se quedaron en seis. Nadie lo notó porque NINGÚN `npm run`
 * miraba las copias: no hay typecheck en CI, así que la divergencia no costaba
 * nada hasta el día que lo hubiera. Mover las líneas a `reglas.mjs` no cierra
 * eso; lo que lo cierra es que a partir de aquí las copias tengan observador.
 *
 * QUÉ VIGILA, en tres frentes:
 *
 *   1. COHERENCIA INTERNA de `scripts/gates/reglas.mjs`: la unión del `@typedef`
 *      y el array `GATE_RULES` son las dos únicas escrituras de la lista y
 *      tienen que coincidir elemento a elemento Y EN ORDEN (el orden es el de
 *      las claves del informe de `runAllGates`).
 *
 *   2. EXCLUSIVIDAD: ningún otro `.mjs` de `scripts/gates/` ni de `test/gates/`
 *      puede volver a escribir la lista — ni como unión de `@typedef`, ni como
 *      array, ni como claves de objeto, ni en prosa entrecomillada. El barrido
 *      se aplica también A ESTE FICHERO: por eso aquí no se escribe ningún
 *      nombre de regla, todo se deriva de `GATE_RULES`.
 *
 *   3. EFECTO: las claves que `runAllGates` publica en `byRule` son exactamente
 *      `GATE_RULES`, en su orden. Es la copia que antes tumbaba el gate entero
 *      —`byRule[o.rule].push` sobre `undefined`— en la primera ofensa de una
 *      regla recién dada de alta.
 *
 * ATACADO POR QUIEN LO ESCRIBE. Los vectores viven abajo: los que caza están
 * aseverados como cazados y los que SE LE ESCAPAN están aseverados como fuga,
 * no escondidos en una cabecera optimista.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATE_RULES } from '../../scripts/gates/reglas.mjs';
import { runAllGates } from '../../scripts/gates/scan.mjs';

const AQUI = fileURLToPath(import.meta.url);
const DIR_GATES = path.dirname(AQUI);
const REPO = path.resolve(DIR_GATES, '../..');

/** El único fichero autorizado a escribir la lista. */
const FUENTE_UNICA = 'scripts/gates/reglas.mjs';

/** @param {string} s */
function escapaRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Lectores puros — se les puede dar un fuente MUTADO, que es como se les ataca
// ---------------------------------------------------------------------------

/**
 * Las dos escrituras de la lista dentro de `reglas.mjs`, leídas del TEXTO (no
 * del módulo): sólo así se puede confrontar la unión —que en runtime no
 * existe— con el array, y sólo así se puede atacar el guardián con un fuente
 * que nunca llega al disco.
 * @param {string} fuente
 * @returns {{ union: string[]|null, arreglo: string[]|null, uniones: number }}
 */
export function reglasDeclaradas(fuente) {
  const literales = (t) => [...t.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2]);
  const uniones = [...fuente.matchAll(/@typedef\s*\{([^}]*)\}\s*GateRule\b/g)];
  const arreglo = fuente.match(/export const GATE_RULES\s*=\s*Object\.freeze\(\s*\[([\s\S]*?)\]\s*\)/);
  return {
    union: uniones.length === 1 ? literales(uniones[0][1]) : null,
    arreglo: arreglo ? literales(arreglo[1]) : null,
    uniones: uniones.length
  };
}

/**
 * Rachas de nombres de regla seguidos, separadas SÓLO por puntuación de lista
 * (comillas, comas, barras verticales, dos puntos, corchetes, llaves,
 * paréntesis y espacio). Ésa es la forma que toma la lista escrita a mano en
 * cualquiera de sus disfraces: unión de `@typedef`, array, claves de objeto o
 * enumeración en prosa entrecomillada. Tres nombres DISTINTOS seguidos ya no es
 * una casualidad del castellano: es la tabla otra vez.
 *
 * Se buscan también los nombres SIN comillas —la prosa de `exceptions.mjs` era
 * una de las cuatro copias y vivía en un comentario—; lo que corta la racha es
 * que entre dos nombres aparezca cualquier otra cosa que no sea puntuación.
 * @param {string} fuente
 * @param {readonly string[]} reglas
 * @param {number} [minimo]
 * @returns {{ inicio: number, nombres: string[] }[]}
 */
export function rachasDeReglas(fuente, reglas, minimo = 3) {
  const alt = [...reglas]
    .sort((a, b) => b.length - a.length)
    .map(escapaRe)
    .join('|');
  const re = new RegExp(`(?<![\\w$-])(?:${alt})(?![\\w$-])`, 'g');
  const separador = /^['"`\s,|:[\]{}()]*$/;
  /** @type {{ inicio: number, nombres: Set<string> }[]} */
  const rachas = [];
  let fin = -1;
  for (let m; (m = re.exec(fuente)); ) {
    const entre = fin === -1 ? null : fuente.slice(fin, m.index);
    if (entre !== null && separador.test(entre)) {
      rachas[rachas.length - 1].nombres.add(m[0]);
    } else {
      rachas.push({ inicio: m.index, nombres: new Set([m[0]]) });
    }
    fin = m.index + m[0].length;
  }
  return rachas
    .filter((r) => r.nombres.size >= minimo)
    .map((r) => ({ inicio: r.inicio, nombres: [...r.nombres] }));
}

/**
 * Cuerpos de una anotación de tipo para `GateRule` que NO delegan en el módulo
 * único. Un consumidor puede darle nombre local al tipo; lo que no puede es
 * volver a definirlo.
 *
 * (La frase de arriba evita escribir la anotación con su cuerpo entre llaves a
 * propósito: el barrido de este mismo fichero la leería como una redefinición
 * y se denunciaría solo. Se rodea cambiando el idioma, no desafilando la regla.)
 * @param {string} fuente
 * @returns {string[]} los cuerpos infractores
 */
export function typedefsQueNoDelegan(fuente) {
  return [...fuente.matchAll(/@typedef\s*\{([^}]*)\}\s*GateRule\b/g)]
    .map((m) => m[1].trim())
    .filter((cuerpo) => !/^import\((['"])[^'"]+\1\)\.GateRule$/.test(cuerpo));
}

/**
 * Nombres que un fuente ATRIBUYE a una ofensa o a una excepción, es decir el
 * valor literal del campo homónimo del registro. Se admite un casteo JSDoc
 * intercalado porque `scan.mjs` usa uno.
 * @param {string} fuente
 * @returns {string[]}
 */
export function reglasCitadas(fuente) {
  return [
    ...new Set(
      [...fuente.matchAll(/(?<![\w$.])rule\s*:\s*(?:\/\*\*[\s\S]*?\*\/\s*)?\(?\s*(['"])([^'"]+)\1/g)].map(
        (m) => m[2]
      )
    )
  ].sort();
}

/** @param {string} rel @returns {number} línea 1-based de un índice de carácter */
function lineaDe(fuente, indice) {
  return fuente.slice(0, indice).split('\n').length;
}

/** Los `.mjs` bajo `scripts/gates/` y `test/gates/` (incluidas las fixtures). */
function ficherosBarridos() {
  /** @type {string[]} */
  const out = [];
  /** @param {string} dir */
  const recorre = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        recorre(abs);
        continue;
      }
      if (entrada.name.endsWith('.mjs')) out.push(abs);
    }
  };
  recorre(path.join(REPO, 'scripts', 'gates'));
  recorre(path.join(REPO, 'test', 'gates'));
  return out.map((abs) => path.relative(REPO, abs).split(path.sep).join('/'));
}

// ---------------------------------------------------------------------------
// 1 · Coherencia interna del módulo único
// ---------------------------------------------------------------------------

test('la unión del @typedef y GATE_RULES son la misma lista, en el mismo orden', () => {
  const fuente = fs.readFileSync(path.join(REPO, FUENTE_UNICA), 'utf8');
  const { union, arreglo, uniones } = reglasDeclaradas(fuente);
  assert.equal(uniones, 1, `${FUENTE_UNICA} debe declarar exactamente un @typedef GateRule (hay ${uniones})`);
  assert.ok(arreglo, `${FUENTE_UNICA} no declara \`export const GATE_RULES = Object.freeze([…])\``);
  assert.deepEqual(
    union,
    arreglo,
    'la unión del @typedef y el array GATE_RULES divergieron DENTRO del módulo único.\n' +
      'Dar de alta una regla es tocar las dos líneas contiguas de reglas.mjs, no una.'
  );
  assert.deepEqual(
    arreglo,
    [...GATE_RULES],
    'lo que el módulo exporta en runtime no es lo que su fuente declara: ¿GATE_RULES se construye en otra parte?'
  );
  assert.ok(Object.isFrozen(GATE_RULES), 'GATE_RULES debe estar congelado: es una declaración, no un acumulador');
  assert.equal(new Set(GATE_RULES).size, GATE_RULES.length, 'GATE_RULES tiene nombres repetidos');
});

// ---------------------------------------------------------------------------
// 2 · Exclusividad: nadie más escribe la lista
// ---------------------------------------------------------------------------

test('ningún otro fichero de gates vuelve a escribir la lista de reglas', () => {
  const ficheros = ficherosBarridos();
  assert.ok(ficheros.includes(FUENTE_UNICA), `el barrido no alcanza ${FUENTE_UNICA}`);
  assert.ok(ficheros.length >= 8, `barrido demasiado corto para significar algo: ${ficheros.length} ficheros`);
  // Este mismo fichero entra al barrido: un guardián que se exime a sí mismo
  // deja abierto el sitio más cómodo para volver a escribir la tabla.
  assert.ok(ficheros.includes(path.relative(REPO, AQUI).split(path.sep).join('/')));

  /** @type {string[]} */
  const ofensas = [];
  for (const rel of ficheros) {
    if (rel === FUENTE_UNICA) continue;
    const fuente = fs.readFileSync(path.join(REPO, rel), 'utf8');
    for (const cuerpo of typedefsQueNoDelegan(fuente)) {
      ofensas.push(`${rel} · @typedef GateRule que no delega: {${cuerpo}}`);
    }
    for (const racha of rachasDeReglas(fuente, GATE_RULES)) {
      ofensas.push(`${rel}:${lineaDe(fuente, racha.inicio)} · lista de reglas reescrita: ${racha.nombres.join(', ')}`);
    }
  }
  assert.deepEqual(
    ofensas,
    [],
    `la lista de reglas volvió a estar escrita fuera de ${FUENTE_UNICA}. Ésa es exactamente\n` +
      'la forma en que se partió en dos la primera vez. Importa el tipo con\n' +
      "`/** @typedef {import('./reglas.mjs').GateRule} GateRule */` y las claves con GATE_RULES:\n" +
      ofensas.join('\n')
  );
});

// ---------------------------------------------------------------------------
// 3 · Efecto: el informe de runAllGates cubre exactamente GATE_RULES
// ---------------------------------------------------------------------------

test('runAllGates publica byRule con las claves de GATE_RULES, en su orden', () => {
  // `files: []` deja sin corpus a los seis escáneres de fichero; el séptimo
  // (licencia) mira el lock del repo real. Se quiere la FORMA del informe, no
  // sus ofensas: el recuento vive en gates.test.mjs y en licencia.test.mjs.
  const { byRule } = runAllGates({ repoRoot: REPO, files: [] });
  assert.deepEqual(
    Object.keys(byRule),
    [...GATE_RULES],
    'byRule dejó de derivarse de GATE_RULES: una regla nueva no tendría cubo y\n' +
      '`byRule[o.rule].push` reventaría runAllGates entero en su primera ofensa.'
  );
  for (const regla of GATE_RULES) assert.ok(Array.isArray(byRule[regla]), `byRule.${regla} no es un array`);
});

test('lo que los escáneres emiten y lo que las excepciones invocan es GATE_RULES', () => {
  // El otro extremo del mismo desfase. Mover el typedef no impide dar de alta
  // un escáner que emita un nombre que nadie declaró: `byRule[o.rule]` sería
  // `undefined` y `runAllGates` reventaría entero… pero SÓLO el día que esa
  // regla encontrase su primera ofensa. Un gate verde no lo delata. Aquí sí.
  // Y por el otro lado: una excepción con el nombre mal escrito no exime nada
  // y no se queja — `isExcepted` compara con `!==` y devuelve false en
  // silencio, que es la misma clase de fallo mudo que motivó este WP.
  const declaradas = [...GATE_RULES].sort();
  /** @type {Record<string, string[]>} */
  const porFichero = {};
  const citadas = new Set();
  for (const rel of ficherosBarridos().filter((r) => r.startsWith('scripts/gates/'))) {
    const nombres = reglasCitadas(fs.readFileSync(path.join(REPO, rel), 'utf8'));
    if (nombres.length > 0) porFichero[rel] = nombres;
    for (const n of nombres) citadas.add(n);
  }
  const intrusas = [...citadas].filter((n) => !GATE_RULES.includes(n)).sort();
  assert.deepEqual(
    intrusas,
    [],
    `nombre de regla usado en scripts/gates/ que no está declarado en ${FUENTE_UNICA}:\n` +
      JSON.stringify(porFichero, null, 2)
  );
  assert.deepEqual(
    [...citadas].sort(),
    declaradas,
    'hay reglas declaradas que ningún escáner emite ni ninguna excepción invoca:\n' +
      'o sobra la declaración o falta el código que la usa.'
  );
});

// ---------------------------------------------------------------------------
// 4 · El guardián atacado. Los vectores se derivan de GATE_RULES para no
//     escribir aquí la tabla que este mismo fichero prohíbe escribir.
// ---------------------------------------------------------------------------

/** El fuente real del módulo único, para mutarlo EN MEMORIA. */
function fuenteUnica() {
  return fs.readFileSync(path.join(REPO, FUENTE_UNICA), 'utf8');
}

/** Un nombre de regla que no existe, para inyectarlo en una copia y no en la otra. */
const INTRUSA = 'gemela-u257';

test('ataque: dar de alta una regla en el array y no en la unión → rojo', () => {
  const mutado = fuenteUnica().replace(
    /(export const GATE_RULES\s*=\s*Object\.freeze\(\s*\[)/,
    `$1\n  '${INTRUSA}',`
  );
  assert.notEqual(mutado, fuenteUnica(), 'la mutación no se aplicó: el ataque no prueba nada');
  const { union, arreglo } = reglasDeclaradas(mutado);
  assert.ok(arreglo.includes(INTRUSA) && !union.includes(INTRUSA));
  assert.notDeepEqual(union, arreglo, 'el guardián se tragó una regla dada de alta sólo en el array');
});

test('ataque: dar de alta una regla en la unión y no en el array → rojo', () => {
  const mutado = fuenteUnica().replace(/(@typedef\s*\{)/, `$1'${INTRUSA}'|`);
  assert.notEqual(mutado, fuenteUnica(), 'la mutación no se aplicó: el ataque no prueba nada');
  const { union, arreglo } = reglasDeclaradas(mutado);
  assert.ok(union.includes(INTRUSA) && !arreglo.includes(INTRUSA));
  assert.notDeepEqual(union, arreglo, 'el guardián se tragó una regla dada de alta sólo en la unión');
});

test('ataque: reordenar una de las dos copias sin cambiar el conjunto → rojo', () => {
  // Un `deepEqual` de conjuntos no lo vería; el orden de GATE_RULES ES el orden
  // de las claves del informe, así que aquí sí importa.
  const { arreglo } = reglasDeclaradas(fuenteUnica());
  const [a, b] = arreglo;
  const permutado = [b, a, ...arreglo.slice(2)];
  assert.notDeepEqual(permutado, arreglo, 'el guardián compara conjuntos, no listas: un reorden pasaría');
});

test('ataque: reescribir la lista en otro fichero, en sus cuatro disfraces → rojo', () => {
  const reglas = [...GATE_RULES];
  const disfraces = [
    // 1 · unión de @typedef, tal cual estaba en exceptions.mjs antes del WP
    ['unión de @typedef', `/** @typedef {${reglas.map((r) => `'${r}'`).join('|')}} GateRule */`],
    // 2 · la MISMA unión pero incompleta: el defecto histórico literal, la
    //     séptima regla ausente. Tiene que caer por reescribir la lista, no
    //     por estar rancia — porque cuando se dio de alta la séptima aún no
    //     había nada rancio que ver.
    ['unión incompleta (el defecto de e7a608d)', `/** @typedef {${reglas.slice(0, -1).map((r) => `'${r}'`).join('|')}} GateRule */`],
    // 3 · claves de objeto, la forma que tenía byRule en runAllGates
    ['claves de objeto', `const byRule = { ${reglas.map((r) => `'${r}': []`).join(', ')} };`],
    // 4 · prosa entrecomillada en un comentario, la forma de la cabecera de
    //     exceptions.mjs — la copia que no era código y por eso no la miraba nadie
    ['prosa de comentario', ` * - \`rule\`: ${reglas.map((r) => `'${r}'`).join(' | ')}`]
  ];
  for (const [nombre, src] of disfraces) {
    const rachas = rachasDeReglas(src, GATE_RULES);
    const typedefs = typedefsQueNoDelegan(src);
    assert.ok(
      rachas.length >= 1 || typedefs.length >= 1,
      `disfraz NO cazado: ${nombre}\n${src}`
    );
  }
});

test('contraprueba: mencionar reglas sueltas NO es reescribir la lista', () => {
  // Un guardián que también pinta de rojo el idioma legítimo obliga a
  // desactivarlo. Estos tres son el idioma real de los ficheros de gates.
  const [r0, r1, r2] = GATE_RULES;
  const limpios = [
    ['aserción por regla', `assert.equal(offenders[0].rule, '${r0}');\nassert.equal(o.rule, '${r1}');`],
    [
      'entradas de excepción consecutivas',
      `{ path: 'packages/a/src/x.mjs', rule: '${r0}', reason: 'motivo uno' },\n` +
        `{ path: 'packages/b/src/y.mjs', rule: '${r1}', reason: 'motivo dos' },\n` +
        `{ path: 'packages/c/src/z.mjs', rule: '${r2}', reason: 'motivo tres' }`
    ],
    ['delegación al módulo único', "/** @typedef {import('./reglas.mjs').GateRule} GateRule */"]
  ];
  for (const [nombre, src] of limpios) {
    assert.deepEqual(rachasDeReglas(src, GATE_RULES), [], `falso positivo (racha) en: ${nombre}`);
    assert.deepEqual(typedefsQueNoDelegan(src), [], `falso positivo (typedef) en: ${nombre}`);
  }
});

test('LÍMITES declarados: por dónde SÍ se le escapa una copia de la lista', () => {
  const reglas = [...GATE_RULES];
  // Aseverados como fuga para que la afirmación del guardián no sea más ancha
  // que su evidencia, y para que quien cierre uno encuentre aquí el test que
  // tiene que dar la vuelta.
  const fugas = [
    // El barrido es TEXTUAL: una lista construida en runtime no se ve.
    ['lista construida por concatenación', `const R = [${reglas.map((r) => r.split('-').map((p) => `'${p}'`).join(" + '-' + ")).join(', ')}];`],
    // Partirla en dos rachas de menos de tres nombres tampoco se ve.
    [
      'lista partida en dos mitades separadas',
      `const A = [${reglas.slice(0, 2).map((r) => `'${r}'`).join(', ')}];\n` +
        `const otraCosa = calcular(A);\n` +
        `const B = [${reglas.slice(2, 4).map((r) => `'${r}'`).join(', ')}];`
    ]
  ];
  for (const [nombre, src] of fugas) {
    assert.deepEqual(
      rachasDeReglas(src, GATE_RULES),
      [],
      `este vector ya NO se escapa — actualiza LÍMITES: ${nombre}`
    );
  }
  // Y el límite que no es un vector sino un alcance: el barrido mira
  // `scripts/gates/` y `test/gates/`. Una copia plantada fuera de esos dos
  // árboles no la ve nadie. Cerrarlo es barrer el repo entero, que es otro WP.
  const barridos = new Set(ficherosBarridos().map((r) => r.split('/').slice(0, 2).join('/')));
  assert.deepEqual([...barridos].sort(), ['scripts/gates', 'test/gates']);
});
