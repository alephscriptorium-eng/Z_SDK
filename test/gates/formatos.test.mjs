/**
 * WP-U269 — guardián del detector que PARSEA en vez de barrer.
 *
 * NINGÚN SECRETO REAL VIVE EN ESTE FICHERO, igual que en `claves.test.mjs`: el
 * material se COMPONE por concatenación en tiempo de ejecución, los hosts son
 * `.invalid` (RFC 2606) y los cuerpos son relleno. Y ningún vector toca
 * `VOLUMES/`: todo se planta en árboles temporales.
 *
 * QUÉ SE MIDE AQUÍ, y en este orden:
 *   1. LAS TRES FORMAS del enunciado, cazadas **por el CLI lanzado como
 *      proceso**. U231 aprendió caro que probar la función no es probar el
 *      camino: su test del detector aislado pasaba porque allí la cadena nunca
 *      toca el disco, y el cableado que faltaba no lo vio nadie.
 *   2. CENSO DE MUTACIÓN sobre las tres: al desactivar `campo-identidad` las
 *      tres tienen que ponerse VERDES. Y el verde se comprueba separando
 *      «nadie disparó» de «saltó OTRO patrón», que es rojo disfrazado de
 *      verificación.
 *   3. LOS SIETE FALSOS POSITIVOS de U231 por el camino NUEVO, con sus gemelos
 *      que sí caen: la precisión no se compró aflojando.
 *   4. LA RETIRADA: lo que el analizador no entiende se sigue barriendo como
 *      antes. Un analizador que no entiende no puede decir «limpio».
 *   5. EL ANCLA DEL LÉXICO, que estaba rota y no anclaba.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  LEXICO_IDENTIDAD,
  PATRONES_IDENTIDAD,
  esHuecoEstructural,
  hallazgosEnFichero,
  hallazgosEnTexto,
  hallazgosEstructurales
} from '../../scripts/gates/claves.mjs';
import { NoEntiendo, camposDeYaml, formatoDe } from '../../scripts/gates/formatos.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(AQUI, '../../scripts/gates/claves.mjs');

/**
 * Material sintético. Compuesto, nunca escrito entero, y sin forma de token de
 * ningún proveedor: así el único patrón que puede cazarlo es `campo-identidad`,
 * que es justo el que este WP cambia. Si lo cazara otro, el censo de mutación
 * de abajo no mediría nada.
 */
const MATERIAL = `${'Xk29fJqLm4'}${'Tz8vBn1Qw'}${'ErTyU'}`;

/** @param {(api: { dir: string, fichero: (rel: string, texto: string) => string }) => void} escribir */
function arbol(escribir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u269-'));
  const fichero = (rel, texto) => {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, texto);
    return abs;
  };
  escribir({ dir, fichero });
  return dir;
}

/** @param {string} dir @param {() => void} fn */
function con(dir, fn) {
  try {
    fn();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Lanza el CLI COMO PROCESO sobre un árbol de volúmenes.
 * @param {string} raiz
 * @returns {{ rc: number, salida: string }}
 */
function barridoCli(raiz) {
  const r = spawnSync(process.execPath, [CLI, '--barrido', '--root', raiz], { encoding: 'utf8' });
  assert.equal(r.error, undefined, `el CLI no llegó a lanzarse: ${r.error?.message}`);
  return { rc: r.status, salida: `${r.stdout}${r.stderr}` };
}

// ---------------------------------------------------------------------------
// LAS TRES FORMAS. Cada una: cómo se escribe, y qué valor la deja limpia.
// ---------------------------------------------------------------------------

/**
 * @type {{ nombre: string, fichero: string, conMaterial: string, conHueco: string, line: number }[]}
 */
const LAS_TRES = [
  {
    nombre: '1 · un valor dentro de un array JSON',
    fichero: 'DISK_09/DEMO/config.json',
    // La comilla cortaba la clase del valor del patrón de U231, así que la
    // captura moría en `[` y no llegaba nunca al elemento.
    conMaterial: `{\n  "nota": "fixture",\n  "tokens": [\n    "${MATERIAL}"\n  ]\n}\n`,
    conHueco: '{\n  "nota": "fixture",\n  "tokens": [\n    "${ZEUS_ALGO_TOKEN}"\n  ]\n}\n',
    line: 4
  },
  {
    nombre: '2 · un escalar de bloque YAML (`api_key: |`)',
    // `VOLUMES/DISK_02/LINEAS/registry.yaml` es YAML real: esto no es hipótesis.
    fichero: 'DISK_09/DEMO/registro.yaml',
    conMaterial: `id: demo\napi_key: |\n  ${MATERIAL}\n`,
    conHueco: 'id: demo\napi_key: |\n  ${ZEUS_ALGO_TOKEN}\n',
    line: 3
  },
  {
    nombre: '3 · `ENV API_KEY valor` sin `=`',
    fichero: 'DISK_09/DEMO/Dockerfile',
    conMaterial: `FROM node:20\nENV API_KEY ${MATERIAL}\n`,
    conHueco: 'FROM node:20\nENV API_KEY ${ZEUS_ALGO_TOKEN}\n',
    line: 2
  }
];

test('las tres formas del enunciado se cazan POR EL CLI, lanzado como proceso', () => {
  for (const caso of LAS_TRES) {
    const dir = arbol(({ fichero }) => fichero(caso.fichero, caso.conMaterial));
    con(dir, () => {
      const { rc, salida } = barridoCli(dir);
      assert.equal(rc, 1, `${caso.nombre}: el CLI salió ${rc} sobre material sembrado\n${salida}`);
      assert.match(salida, /1 hallazgo\(s\)/, `${caso.nombre}: se esperaba UN hallazgo\n${salida}`);
      assert.match(
        salida,
        new RegExp(`${caso.fichero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${caso.line}\\b`),
        `${caso.nombre}: el hallazgo no señala la línea del VALOR\n${salida}`
      );
      assert.match(salida, /campo-identidad/, caso.nombre);
      // El valor no se transcribe: un gate que imprime lo que caza lo publica.
      assert.equal(salida.includes(MATERIAL), false, `${caso.nombre}: el CLI transcribió el material`);
    });
  }
});

test('CONTROL NEGATIVO: las tres formas con un hueco de plantilla salen limpias por el CLI', () => {
  // Sin este control el test de arriba sólo probaría que el gate enrojece
  // siempre, que es tan inútil como que no enrojezca nunca.
  for (const caso of LAS_TRES) {
    const dir = arbol(({ fichero }) => fichero(caso.fichero, caso.conHueco));
    con(dir, () => {
      const { rc, salida } = barridoCli(dir);
      assert.equal(rc, 0, `${caso.nombre}: falso positivo sobre un \${VAR}\n${salida}`);
      assert.match(salida, /limpio \(0 hallazgos\)/, `${caso.nombre}\n${salida}`);
    });
  }
});

test('las tres formas ESCAPAN al barrido de línea: por eso hizo falta analizar', () => {
  // Fija POR QUÉ no bastaba otra expresión regular. `hallazgosEnTexto` es el
  // barrido crudo de U231, intacto: sobre las tres formas da CERO. Si alguien
  // «arregla» esto añadiendo un patrón al barrido, este test se lo dice — y le
  // recuerda que la densidad de falsos positivos era el problema.
  /** @type {string[]} */
  const cazadas = [];
  for (const caso of LAS_TRES) {
    if (hallazgosEnTexto(caso.conMaterial).length > 0) cazadas.push(caso.nombre);
  }
  assert.deepEqual(
    cazadas,
    [],
    'el barrido crudo ya caza estas formas: o se añadió un patrón (y con él densidad ' +
      'de falsos positivos), o el enunciado de este WP cambió:\n' + cazadas.join('\n')
  );
});

// ---------------------------------------------------------------------------
// CENSO DE MUTACIÓN sobre las tres formas
// ---------------------------------------------------------------------------

test('censo de mutación: sin `campo-identidad`, las tres formas se ponen VERDES', () => {
  const sinElPatron = PATRONES_IDENTIDAD.filter((p) => p.id !== 'campo-identidad');
  assert.equal(sinElPatron.length, PATRONES_IDENTIDAD.length - 1, 'no se desactivó exactamente uno');

  for (const caso of LAS_TRES) {
    const dir = arbol(({ fichero }) => fichero(caso.fichero, caso.conMaterial));
    con(dir, () => {
      const abs = path.join(dir, ...caso.fichero.split('/'));

      // (a) Con TODOS los patrones: exactamente UN hallazgo, y es el suyo. Esto
      //     es lo que separa «nadie disparó» de «saltó OTRO patrón»: si el
      //     material lo cazara además `token-de-proveedor`, el verde de (b)
      //     sería mentira y aquí se vería.
      const conTodos = hallazgosEnFichero(abs);
      assert.equal(conTodos.length, 1, `${caso.nombre}: ${JSON.stringify(conTodos)}`);
      assert.equal(conTodos[0].id, 'campo-identidad', caso.nombre);
      assert.equal(conTodos[0].line, caso.line, caso.nombre);

      // (b) Desactivado su guardián: CERO. Y cero de verdad, no «otro saltó».
      const mutado = hallazgosEnFichero(abs, sinElPatron);
      assert.deepEqual(
        mutado,
        [],
        `${caso.nombre}: al desactivar \`campo-identidad\` alguien MÁS disparó — ` +
          `el verde no lo produce el patrón que se mide: ${JSON.stringify(mutado)}`
      );
    });
  }
});

test('la lista de patrones VACÍA sigue siendo ruidosa también por el camino estructural', () => {
  // La guardia de U231 no se relaja por venir por otra puerta: cero patrones no
  // dice «limpio», dice «no miré».
  assert.throws(() => hallazgosEstructurales('api_key: x', 'yaml', []), TypeError);
  assert.throws(() => hallazgosEstructurales('api_key: x', 'yaml', null), TypeError);
  assert.throws(() => hallazgosEstructurales('api_key: x', 'yaml', Object.freeze([])), TypeError);
});

// ---------------------------------------------------------------------------
// LOS SIETE FALSOS POSITIVOS DE U231, POR EL CAMINO NUEVO
// ---------------------------------------------------------------------------

/**
 * Los siete de la contrarrevisión de U231 (`test/gates/claves.test.mjs`, y
 * §2.8 de `plan/REPORTES/WP-U231-secretos-en-datos.md`). Allí se miden sobre el
 * barrido de línea; aquí sobre el ANALIZADOR, que es un camino distinto y puede
 * romperlos de otra manera —y de hecho rompió el primero: el reparto de
 * colecciones de flujo sacaba `DB_PASSWORD` de dentro de `{{DB_PASSWORD}}`—.
 *
 * @type {[string, string][]}
 */
const LOS_SIETE = [
  ['plantilla de llaves dobles (Helm, Jinja, Actions)', 'password: {{DB_PASSWORD}}'],
  ['plantilla de paréntesis (Make, Azure)', 'password: $(DB_PASSWORD)'],
  ['plantilla de porcentajes (cmd)', 'password: %DB_PASSWORD%'],
  ['referencia a otra configuración', 'password: .Values.global.registrySecretName'],
  ['URL de documentación sobre rotación', 'secret: https://docs.example.invalid/guia/rotacion-de-claves'],
  ['valor centinela de un enum', 'credentials: inherit-from-operator-env'],
  ['texto de i18n que repite su etiqueta', '"contraseña": "Contraseña olvidada, revise su correo"']
];

test('los siete falsos positivos de U231 siguen limpios POR EL ANALIZADOR de YAML', () => {
  /** @type {string[]} */
  const rojos = [];
  for (const [nombre, texto] of LOS_SIETE) {
    const h = hallazgosEstructurales(`${texto}\n`, 'yaml');
    if (h.length > 0) rojos.push(`${nombre} — [${h.map((x) => x.id).join(', ')}]: ${texto}`);
  }
  assert.deepEqual(rojos, [], 'el analizador reintrodujo falsos positivos:\n' + rojos.join('\n'));
});

test('los siete siguen limpios POR EL CLI, sembrados en un volumen como YAML', () => {
  for (const [nombre, texto] of LOS_SIETE) {
    const dir = arbol(({ fichero }) => fichero('DISK_09/DEMO/config.yaml', `${texto}\n`));
    con(dir, () => {
      const { rc, salida } = barridoCli(dir);
      assert.equal(rc, 0, `falso positivo por el gate: ${nombre}\n${salida}`);
    });
  }
});

test('los siete siguen limpios TAMBIÉN como JSON, que es el otro analizador', () => {
  /** @type {string[]} */
  const rojos = [];
  for (const [nombre, texto] of LOS_SIETE) {
    // el mismo par, pero escrito como JSON legal
    const i = texto.indexOf(': ');
    const clave = texto.slice(0, i).replace(/^"|"$/g, '');
    const valor = texto.slice(i + 2).replace(/^"|"$/g, '');
    const h = hallazgosEstructurales(JSON.stringify({ [clave]: valor }, null, 2), 'json');
    if (h.length > 0) rojos.push(`${nombre} — [${h.map((x) => x.id).join(', ')}]`);
  }
  assert.deepEqual(rojos, [], 'el analizador de JSON tiene falsos positivos:\n' + rojos.join('\n'));
});

test('LA PRECISIÓN NO SE COMPRÓ AFLOJANDO: cada hueco tiene su gemelo que SÍ cae', () => {
  // Mismo formato, misma clase de valor, pero material. Si alguien ensancha el
  // clasificador para quitar un falso positivo, esto se pone rojo.
  /** @type {[string, string, 'yaml'|'json'|'dockerfile'][]} */
  const gemelos = [
    ['URL con un tramo de material', `secret: https://hooks.example.invalid/T00/B00/${'Xk29fJqLm4Tz8vBn1QwErT'}`, 'yaml'],
    ['kebab sin palabra de configuración', 'password: correct-horse-battery-staple', 'yaml'],
    ['ruta punteada sin el punto inicial', 'password: Values.global.registrySecretName', 'yaml'],
    ['i18n que NO repite su etiqueta y no es prosa', `"contraseña": "${MATERIAL}"`, 'yaml'],
    ['plantilla incompleta: NO es una plantilla', 'password: {{DB_PASSWORD', 'yaml'],
    ['array JSON con material', `{"tokens":["${MATERIAL}"]}`, 'json'],
    ['ENV de espacio con material', `FROM node:20\nENV API_KEY ${MATERIAL}`, 'dockerfile']
  ];
  /** @type {string[]} */
  const tragados = [];
  for (const [nombre, texto, formato] of gemelos) {
    if (hallazgosEstructurales(`${texto}\n`, formato).length === 0) tragados.push(nombre);
  }
  assert.deepEqual(tragados, [], 'el clasificador se tragó material:\n' + tragados.join('\n'));
});

test('LÍMITE DECLARADO: una frase de paso con espacios LITERALES no se caza', () => {
  // Se fija en un test para que sea un límite CONOCIDO y no un descubrimiento.
  // El precio: con el valor entero delante, «tiene un espacio dentro» es la
  // señal que distingue prosa de material, y una frase de paso escrita con
  // espacios cae del lado de la prosa. Con guiones —como se escriben en un
  // fichero de configuración— sí se caza, y está arriba entre los gemelos.
  assert.deepEqual(hallazgosEstructurales('clave: correct horse battery staple\n', 'yaml'), []);
  assert.ok(esHuecoEstructural('correct horse battery staple', 'clave'));
  assert.equal(esHuecoEstructural('correct-horse-battery-staple', 'clave'), false);
});

// ---------------------------------------------------------------------------
// LA RETIRADA — lo que no se entiende se sigue mirando
// ---------------------------------------------------------------------------

test('lo que el analizador NO entiende se retira al barrido crudo, nunca a silencio', () => {
  // Un `.json` que no es JSON (comentarios estilo tsconfig) y lleva material:
  // el analizador lanza, y el barrido de U231 lo caza igual.
  const dir = arbol(({ fichero }) => {
    fichero('DISK_09/DEMO/roto.json', `{\n  // esto no es JSON legal\n  "api_key": "${MATERIAL}"\n}\n`);
  });
  con(dir, () => {
    const { rc, salida } = barridoCli(dir);
    assert.equal(rc, 1, `la retirada perdió el hallazgo — eso sería silencio, no vigilancia\n${salida}`);
    assert.match(salida, /roto\.json:3/, salida);
  });
});

test('la retirada NO se traga un TypeError: la guardia de patrones sigue matando el gate', () => {
  const dir = arbol(({ fichero }) => fichero('DISK_09/DEMO/x.json', '{"a":"b"}\n'));
  con(dir, () => {
    const abs = path.join(dir, 'DISK_09', 'DEMO', 'x.json');
    assert.throws(() => hallazgosEnFichero(abs, []), TypeError);
  });
});

test('el analizador de YAML se retira ante lo que declaró no modelar', () => {
  // Anclas, alias, etiquetas, claves complejas y de fusión. Se comprueba que
  // LANZA (y no que «sale limpio»), que es la diferencia entre retirarse y
  // mentir.
  for (const texto of ['a: &ancla 1\nb: *ancla\n', 'a: !!str 1\n', '? [a, b]\n: c\n', 'x:\n  <<: *base\n']) {
    assert.throws(() => camposDeYaml(texto), NoEntiendo, `no se retiró ante: ${JSON.stringify(texto)}`);
  }
});

test('un formato desconocido sigue el camino de siempre — no se inventa analizador', () => {
  assert.equal(formatoDe('README.md'), null);
  assert.equal(formatoDe('.env.example'), null);
  assert.equal(formatoDe('config.json'), 'json');
  assert.equal(formatoDe('registry.yaml'), 'yaml');
  assert.equal(formatoDe('ci.yml'), 'yaml');
  assert.equal(formatoDe('Dockerfile'), 'dockerfile');
  assert.equal(formatoDe('Dockerfile.ops'), 'dockerfile');
  assert.equal(formatoDe('ops.dockerfile'), 'dockerfile');
  assert.equal(formatoDe('index.mjs'), 'codigo');
  assert.equal(formatoDe('tipos.d.ts'), 'codigo');
});

// ---------------------------------------------------------------------------
// EL ANCLA DEL LÉXICO, QUE NO ANCLABA
// ---------------------------------------------------------------------------

test('el léxico anclado ANCLA: `author` no es `auth`, ni `tokenizer` es `token`', () => {
  // `LEXICO_IDENTIDAD.source` es una alternancia de primer nivel SIN paréntesis,
  // así que interpolarla a pelo entre un lookbehind y un lookahead ataba el
  // primero sólo a la primera alternativa y el segundo sólo a la última. Sobre
  // este árbol eran once falsos positivos en campos `author`, que son identidad
  // PÚBLICA. El arreglo es un `(?:…)`; este test lo fija.
  const anclado = new RegExp(`(?<![A-Za-z0-9])(?:${LEXICO_IDENTIDAD.source})(?![A-Za-z0-9])`, 'i');
  for (const n of ['author', 'authors', 'tokenizer', 'secretaria', 'xxpwdyy', 'passenger', 'autoridad']) {
    assert.equal(anclado.test(n), false, `\`${n}\` no es un nombre de identidad y el léxico dice que sí`);
  }
  // y las trece que U231 midió siguen dentro
  for (const n of [
    'clave', 'contraseña', 'contrasena', 'secreto', 'credencial', 'credenciales',
    'auth', 'authorization', 'privkey', 'clave_privada', 'clave_secreta', 'claveApi', 'semilla'
  ]) {
    assert.equal(anclado.test(n), true, `el léxico dejó de reconocer \`${n}\``);
  }
});

// ---------------------------------------------------------------------------
// EL ESCALAR DE BLOQUE, DE VERDAD
//
// El censo de mutación pilló que el primer test de la forma 2 pasaba POR OTRO
// CAMINO: sin recoger el bloque, el cuerpo de una sola línea cae igualmente por
// la herencia de nombre del escalar suelto. O sea que el test estaba verde y no
// vigilaba el bloque. Esto sí lo vigila: lo que SÓLO da el análisis de bloque es
// que el cuerpo entero es UN valor —una fuga, no una por línea— y que el cuerpo
// no se lee como pares `clave: valor`.
// ---------------------------------------------------------------------------

test('el escalar de bloque es UN valor, no una línea suelta por cada línea', () => {
  const texto = `api_key: |\n  ${MATERIAL}\n  ${MATERIAL}A\n`;
  const h = hallazgosEstructurales(texto, 'yaml');
  assert.equal(h.length, 1, `un bloque con dos líneas de material es UNA fuga: ${JSON.stringify(h)}`);
  assert.equal(h[0].id, 'campo-identidad');
  assert.equal(h[0].line, 2, 'la línea señalada no es la primera del cuerpo');
});

test('el cuerpo de un bloque NO se lee como pares `clave: valor`', () => {
  // `notas` no es un nombre de identidad y el cuerpo es TEXTO: la línea de
  // dentro no es un campo. Sin análisis de bloque, `api_key` de ahí dentro se
  // leería como un campo y sería un falso positivo sobre documentación.
  const texto = 'notas: |\n  el campo api_key: se documenta en la guia de rotacion\n';
  assert.deepEqual(hallazgosEstructurales(texto, 'yaml'), []);
});

test('pero el cuerpo OPACO se sigue barriendo en crudo: un `run: |` de CI no se tapa', () => {
  // El análisis no puede tapar lo que no entiende. El cuerpo de un bloque es
  // shell, no YAML, y el shell de CI es donde viven los secretos.
  const texto = `run: |\n  npm ci\n  export API_KEY=${MATERIAL}\n`;
  const h = hallazgosEstructurales(texto, 'yaml');
  assert.equal(h.length, 1, `el análisis se tragó un secreto dentro de un bloque: ${JSON.stringify(h)}`);
  assert.equal(h[0].line, 3, 'la línea del hallazgo dentro del bloque no se traduce bien');
});

// ---------------------------------------------------------------------------
// EL LEXER DE CÓDIGO
// ---------------------------------------------------------------------------

test('en código, un valor que NO es literal deja de ser un hallazgo', () => {
  // Es la clase que más ruido hacía: 100 de los 125 hallazgos del barrido
  // estaban en `.mjs`/`.ts` y ninguno era una credencial. Un secreto escrito en
  // el código ES un literal de cadena; una llamada a función no lo es.
  const noLiterales = [
    'const token = resolveScriptoriumSecret();',
    'const auth = assertIntentRole({ actorId, intent, role }, CATALOGO);',
    'secret: options.secret ?? resolveScriptoriumSecret()',
    'token: cfg?.token ?? DEV_ROOM_CLIENT_CONFIG.token,',
    'privateKey: KeyObject | string | Buffer,'
  ];
  for (const l of noLiterales) {
    assert.deepEqual(hallazgosEstructurales(`${l}\n`, 'codigo'), [], l);
  }
  // y el gemelo: el MISMO nombre con un literal de verdad SÍ cae
  assert.equal(hallazgosEstructurales(`const token = '${MATERIAL}';\n`, 'codigo').length, 1);
  assert.equal(hallazgosEstructurales(`  secret: '${MATERIAL}',\n`, 'codigo').length, 1);
});

test('el lexer distingue comentario, plantilla y expresión regular', () => {
  // Sin distinguir comentarios, el JSDoc de este mismo árbol enrojecía.
  assert.deepEqual(hallazgosEstructurales(`// token: '${MATERIAL}'\n`, 'codigo'), []);
  assert.deepEqual(hallazgosEstructurales(`/* api_key: '${MATERIAL}' */\n`, 'codigo'), []);
  // Una expresión regular con comillas dentro NO debe desincronizar el lexer:
  // si lo hiciera, el literal de después se perdería y eso sería un silencio.
  const conRegex = `const re = /['"]:/;\nconst token = '${MATERIAL}';\n`;
  const h = hallazgosEstructurales(conRegex, 'codigo');
  assert.equal(h.length, 1, `el lexer se desincronizó con la expresión regular: ${JSON.stringify(h)}`);
  assert.equal(h[0].line, 2);
  // Una división NO abre expresión regular.
  assert.equal(hallazgosEstructurales(`const x = a / b;\nconst token = '${MATERIAL}';\n`, 'codigo').length, 1);
});

test('LÍMITE DECLARADO: un `campo-identidad` COMENTADO en código ya no se caza', () => {
  // Es el precio de excluir los comentarios, y se escribe para que sea un
  // límite conocido. Lo que NO se pierde: los patrones por FORMA siguen
  // barriendo el texto entero, comentarios incluidos — un PEM, un JWT o un
  // token de proveedor comentados se cazan igual, y eso se comprueba aquí.
  assert.deepEqual(hallazgosEstructurales(`// api_key = ${MATERIAL}\n`, 'codigo'), []);
  const jwt = `${'ey'}${'J'}${'NOESUNTOKENSINTETICO'}.${'ZWpwbG9zaW50ZXRpY28'}.${'firma-sintetica'}`;
  const h = hallazgosEstructurales(`// ${jwt}\n`, 'codigo');
  assert.equal(h.length, 1, 'un JWT comentado SÍ se tiene que seguir cazando');
  assert.equal(h[0].id, 'jwt');
});

test('un campo `author` con su identidad pública NO es un hallazgo', () => {
  // El caso real: `packages/mesh/ssb-system/fixtures/ssb-log.json`. Un autor de
  // SSB es una clave PÚBLICA; denunciarla es ruido sobre datos correctos.
  assert.deepEqual(hallazgosEstructurales('{"author":"@alice.ed25519"}', 'json'), []);
  assert.deepEqual(hallazgosEstructurales('{"author":"escrivivir-co"}', 'json'), []);
});
