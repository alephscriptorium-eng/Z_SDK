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
  esNombreDeIdentidad,
  hallazgosEnFichero,
  hallazgosEnTexto,
  hallazgosEstructurales
} from '../../scripts/gates/claves.mjs';
import {
  NoEntiendo,
  camposDe,
  camposDeCodigo,
  camposDeJson,
  camposDeYaml,
  formatoDe
} from '../../scripts/gates/formatos.mjs';
import { REPO_ROOT } from '../../scripts/gates/scan.mjs';
import { TOKEN_LEY, violacionesDeConservacion } from './conservacion.mjs';

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

test('izar la compilación quita `g` Y `y`: un patrón sticky no se salta líneas', () => {
  // `hallazgosEnTexto` documenta la lista de patrones como PARÁMETRO público, o
  // sea que el que la pasa manda. La izada quitaba `g` pero no `y`, y `y` ancla
  // el `exec` en `lastIndex` igual que `g`: cada línea empezaba a mirar donde
  // acabó la anterior. Medido por la contrarrevisión: de tres coincidencias
  // devolvía dos. Hoy ningún patrón lleva `y`; este test es para el que venga.
  const texto = `api_key=${MATERIAL}\napi_key=${MATERIAL}\napi_key=${MATERIAL}\n`;
  const pegajoso = [{ id: 'pegajoso', que: 'patron con bandera sticky', re: /api_key=\w+/gy }];
  assert.equal(
    hallazgosEnTexto(texto, pegajoso).length,
    3,
    'un patrón con bandera `y` se salta líneas: la izada no le quitó la bandera'
  );
  // y el mismo patrón sin banderas da lo mismo: la bandera no debe cambiar nada
  assert.equal(hallazgosEnTexto(texto, [{ id: 'llano', que: 'sin banderas', re: /api_key=\w+/ }]).length, 3);
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

/**
 * Hallazgos de un texto POR EL CAMINO REAL: se escribe a disco con la extensión
 * que toca y se llama a `hallazgosEnFichero`.
 *
 * NO se llama a `hallazgosEstructurales` a pelo, y la diferencia es la lección
 * de B1: **el analizador LANZA, y quien se retira al barrido crudo es
 * `hallazgosEnFichero`**. Medir en la capa de abajo mide media cadena — y
 * `{{DB_PASSWORD}}` es exactamente un caso en que la de abajo lanza y la de
 * arriba responde «limpio», que es la respuesta correcta.
 *
 * @param {string} texto @param {string} nombreFichero
 */
function hallazgosDe(texto, nombreFichero) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'u269-hf-'));
  try {
    const abs = path.join(dir, nombreFichero);
    fs.writeFileSync(abs, texto);
    return hallazgosEnFichero(abs);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('los siete falsos positivos de U231 siguen limpios POR EL CAMINO REAL en YAML', () => {
  /** @type {string[]} */
  const rojos = [];
  for (const [nombre, texto] of LOS_SIETE) {
    const h = hallazgosDe(`${texto}\n`, 'config.yaml');
    if (h.length > 0) rojos.push(`${nombre} — [${h.map((x) => x.id).join(', ')}]: ${texto}`);
  }
  assert.deepEqual(rojos, [], 'el analizador reintrodujo falsos positivos:\n' + rojos.join('\n'));
});

test('`{"api_key":"…"}` en un `.yaml` se ENTIENDE, no sólo se caza por retirada', () => {
  // El censo de mutación encontró que quitar la rama de clave entrecomillada de
  // `parYaml` dejaba la suite VERDE: el hallazgo sobrevivía porque el analizador
  // se retiraba y el barrido crudo lo cazaba igual. O sea que la seguridad
  // estaba cubierta y la PRECISIÓN no: sin esa rama, todo `.yaml` que contenga
  // JSON —y JSON es YAML— se retira entero al barrido crudo y vuelve a pagar su
  // densidad de falsos positivos. Esto vigila que se ENTIENDA.
  const texto = `{"api_key":"${MATERIAL}"}\n`;
  const campos = camposDeYaml(texto); // si no se entiende, esto LANZA
  assert.deepEqual(
    campos.map((c) => c.nombre),
    ['api_key'],
    'el analizador no lee `{"api_key":"…"}` como el mapa de flujo que es'
  );
  assert.equal(campos[0].valor, MATERIAL, 'el valor sale mal desentrecomillado');
  // Y un YAML corriente con JSON dentro NO se retira: se analiza.
  assert.doesNotThrow(() => camposDeYaml(`cfg: {"host":"a.invalid","port":8080}\n`));
});

test('el primero de los siete llega limpio POR RETIRADA, no porque se entienda', () => {
  // Es la comprobación que separa «salió limpio» de «salió limpio por la razón
  // correcta». `{{DB_PASSWORD}}` NO es YAML: el analizador tiene que LANZAR, y
  // el limpio lo produce el barrido crudo de U231 al que se retira.
  assert.throws(
    () => hallazgosEstructurales('password: {{DB_PASSWORD}}\n', 'yaml'),
    NoEntiendo,
    'el analizador dice entender `{{DB_PASSWORD}}`, y no lo entiende'
  );
  assert.deepEqual(hallazgosDe('password: {{DB_PASSWORD}}\n', 'config.yaml'), []);
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
    const h = hallazgosDe(JSON.stringify({ [clave]: valor }, null, 2), 'config.json');
    if (h.length > 0) rojos.push(`${nombre} — [${h.map((x) => x.id).join(', ')}]`);
  }
  assert.deepEqual(rojos, [], 'el analizador de JSON tiene falsos positivos:\n' + rojos.join('\n'));
});

test('LA PRECISIÓN NO SE COMPRÓ AFLOJANDO: cada hueco tiene su gemelo que SÍ cae', () => {
  // Mismo formato, misma clase de valor, pero material. Si alguien ensancha el
  // clasificador para quitar un falso positivo, esto se pone rojo.
  // Va POR EL CAMINO REAL: la retirada forma parte del resultado correcto, y
  // «plantilla incompleta» es justo un caso que el analizador no entiende y que
  // el barrido crudo sí caza.
  /** @type {[string, string, string][]} */
  const gemelos = [
    ['URL con un tramo de material', `secret: https://hooks.example.invalid/T00/B00/${'Xk29fJqLm4Tz8vBn1QwErT'}`, 'x.yaml'],
    ['kebab sin palabra de configuración', 'password: correct-horse-battery-staple', 'x.yaml'],
    ['ruta punteada sin el punto inicial', 'password: Values.global.registrySecretName', 'x.yaml'],
    ['i18n que NO repite su etiqueta y no es prosa', `"contraseña": "${MATERIAL}"`, 'x.yaml'],
    ['plantilla incompleta: NO es una plantilla', 'password: {{DB_PASSWORD', 'x.yaml'],
    ['array JSON con material', `{"tokens":["${MATERIAL}"]}`, 'x.json'],
    ['ENV de espacio con material', `FROM node:20\nENV API_KEY ${MATERIAL}`, 'Dockerfile'],
    // B2: las clases que se recuperaron. Cada una es un gemelo que SÍ cae.
    ['comentario de YAML', `# api_key: ${MATERIAL}`, 'x.yaml'],
    ['comentario de Dockerfile', `FROM node:20\n# api_key=${MATERIAL}`, 'Dockerfile'],
    ['comentario de línea en código', `// api_key = ${MATERIAL}`, 'x.mjs'],
    ['comentario de bloque en código', `/* api_key: ${MATERIAL} */`, 'x.mjs'],
    // El valor numérico se COMPONE, para no dejar escrito en este fichero un
    // par nombre/valor que el barrido crudo del `.md` y del propio test cace.
    ['valor NUMÉRICO en JSON', '{"api_key": ' + '9'.repeat(20) + '}', 'x.json'],
    ['blob JSON dentro de un literal de código', `const cfg = '{"api_key":"${MATERIAL}"}';`, 'x.mjs'],
    ['blob JSON dentro de una plantilla', `const cfg = \`{"api_key":"${MATERIAL}"}\`;`, 'x.mjs'],
    ['`RUN` de Dockerfile con export', `FROM node:20\nRUN export API_KEY=${MATERIAL}`, 'Dockerfile'],
    ['flujo YAML tal cual lo escribe JSON.stringify', `{"api_key":"${MATERIAL}"}`, 'x.yaml']
  ];
  /** @type {string[]} */
  const tragados = [];
  for (const [nombre, texto, fichero] of gemelos) {
    if (hallazgosDe(`${texto}\n`, fichero).length === 0) tragados.push(nombre);
  }
  assert.deepEqual(tragados, [], 'el clasificador se tragó material:\n' + tragados.join('\n'));
});

test('LÍMITE DECLARADO: una frase de paso con espacios LITERALES no se caza', () => {
  // Se fija en un test para que sea un límite CONOCIDO y no un descubrimiento.
  // El precio: con el valor entero delante, «tiene un espacio dentro» es la
  // señal que distingue prosa de material, y una frase de paso escrita con
  // espacios cae del lado de la prosa. Con guiones —como se escriben en un
  // fichero de configuración— sí se caza, y está arriba entre los gemelos.
  assert.deepEqual(hallazgosDe('clave: correct horse battery staple\n', 'x.yaml'), []);
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

test('TODA rotura del lexer de código se retira: la clase, no el caso', () => {
  // La contrarrevisión encontró un mutante VIVO: cambiar el `throw` del literal
  // de cadena sin cerrar por «sigue como si nada» dejaba la suite entera verde.
  // Es el modo de fallo exacto que la retirada existe para no tener —un lexer
  // desincronizado que dice «limpio»—, y sólo estaba cubierta una de las tres
  // ramas. Aquí se cubren las tres, y cada una se comprueba DOS veces: que
  // LANZA (o sea que se retira, no que se lo traga) y que por el camino real el
  // secreto que viene DESPUÉS de la rotura se sigue cazando.
  const roturas = [
    ['literal de cadena sin cerrar', "const a = 'sin cerrar\n"],
    ['comentario de bloque sin cerrar', '/* sin cerrar\n'],
    ['expresion regular sin cerrar', 'const re = /sin-cerrar\n']
  ];
  for (const [nombre, roto] of roturas) {
    assert.throws(
      () => camposDeCodigo(roto),
      NoEntiendo,
      `el lexer NO se retira ante: ${nombre} — un lexer desincronizado no puede decir «limpio»`
    );
    // Y por el camino real: se retira al barrido crudo y el material se caza.
    const conMaterial = `${roto}api_key = ${MATERIAL}\n`;
    assert.equal(
      hallazgosDe(conMaterial, 'x.mjs').length,
      1,
      `tras «${nombre}» se perdió el material que venía después: eso es silencio`
    );
  }
});

test('TODA rotura del analizador de JSON se retira igual', () => {
  // Cada caso trae su versión rota Y su versión rota CON material, escritas a
  // mano: derivar la segunda de la primera con un `replace` es cómo se cuela un
  // test que mide otra cosa (la primera versión de esto no sustituía nada en el
  // caso de comilla simple y fallaba por su propio defecto, no por el detector).
  const roturas = [
    ['llave sin cerrar', '{"a": "b"', `{"api_key": "${MATERIAL}"`],
    ['coma sobrante', '{"a": "b",}', `{"api_key": "${MATERIAL}",}`],
    ['comilla simple', "{'a': 'b'}", `{'api_key': '${MATERIAL}'}`],
    [
      'comentario estilo tsconfig',
      '{\n  // no es JSON\n  "a": "b"\n}',
      `{\n  // no es JSON\n  "api_key": "${MATERIAL}"\n}`
    ],
    ['cola tras el valor raiz', '{"a":"b"} sobra', `{"api_key":"${MATERIAL}"} sobra`]
  ];
  for (const [nombre, roto, conMaterial] of roturas) {
    assert.throws(() => camposDeJson(roto), NoEntiendo, `JSON no se retira ante: ${nombre}`);
    assert.throws(() => camposDeJson(conMaterial), NoEntiendo, `JSON no se retira ante: ${nombre} (con material)`);
    assert.ok(
      hallazgosDe(conMaterial, 'x.json').length >= 1,
      `tras «${nombre}» se perdió el material: eso es silencio, no retirada`
    );
  }
});

test('CADA `throw` añadido al arreglar B1/B2 tiene su guardián (m1)', () => {
  // La contrarrevisión encontró CINCO `throw` nuevos sin un solo test: los tres
  // de `flujoYaml` y los dos de Dockerfile. Cuatro son load-bearing —revertidos,
  // el material pasa de rojo a SILENCIO— y por la doctrina de esta casa una
  // regla que nadie puede matar no vigila nada. Cada uno se comprueba DOS veces:
  // que LANZA, y que por el camino real el material se sigue cazando.
  // `cargado` = load-bearing: revertir el `throw` convierte un hallazgo en
  // silencio. Los que no lo son se comprueban IGUAL de que lanzan (la retirada
  // es el contrato), pero no se les puede exigir un hallazgo: en su forma no hay
  // ningún nombre de identidad que cazar, y `main` tampoco caza nada.
  /** @type {[string, string, string, boolean][]} */
  const casos = [
    ['flujo: cola tras el cierre', `x: {"api_key":"${MATERIAL}"} cola\n`, 'x.yaml', true],
    ['flujo: sin equilibrar', `{"api_key":"${MATERIAL}",\n`, 'x.yaml', true],
    ['flujo: mal cerrado', `{"api_key":"${MATERIAL}"]\n`, 'x.yaml', true],
    ['Dockerfile: línea que no es instrucción', `FROM node:20\napi_key=${MATERIAL}\n`, 'Dockerfile', true],
    ['Dockerfile: trozo sin `=` en forma de pares', `FROM node:20\nENV A=1 ${MATERIAL}\n`, 'Dockerfile', false],
    ['YAML: `%` que no es directiva', `%foo: ${MATERIAL}\n`, 'x.yaml', false]
  ];
  for (const [nombre, texto, fichero, cargado] of casos) {
    const formato = fichero === 'Dockerfile' ? 'dockerfile' : 'yaml';
    assert.throws(
      () => camposDe(formato, texto),
      NoEntiendo,
      `no se retira ante: ${nombre} — sin excepción no hay retirada, y sin retirada hay silencio`
    );
    if (!cargado) continue;
    assert.ok(
      hallazgosDe(texto, fichero).length >= 1,
      `tras «${nombre}» se perdió el material por el camino real: eso es silencio`
    );
  }
  // Y una directiva DE VERDAD sigue saltándose sin ruido.
  assert.doesNotThrow(() => camposDe('yaml', '%YAML 1.2\n---\nid: demo\n'));
});

test('un blob de configuración dentro de un literal de código no es un punto ciego (B3)', () => {
  // El literal es OPACO: el lexer sabe que es una cadena, no qué hay dentro.
  // La primera versión sólo intentaba JSON, con un `catch` que se comía la duda
  // y un comentario que decía «el literal ya se juzgó por su propio nombre».
  // No basta: el nombre es `cfg`. Ocho formas pasaban en silencio.
  const blobs = [
    ['YAML en literal', `const cfg = 'api_key: ${MATERIAL}';\n`],
    ['JSON con coma final', `const cfg = '{"api_key":"${MATERIAL}",}';\n`],
    ['JSON con clave sin comillas', `const cfg = '{api_key:"${MATERIAL}"}';\n`],
    ['JSON con comentario dentro', `const cfg = '{/*x*/"api_key":"${MATERIAL}"}';\n`],
    ['casi-válido en plantilla', `const cfg = \`{"api_key":"${MATERIAL}",}\`;\n`],
    ['`.env` en literal', `const cfg = 'API_KEY=${MATERIAL}';\n`],
    ['YAML en plantilla multilínea', `const cfg = \`\nid: demo\napi_key: ${MATERIAL}\n\`;\n`],
    ['`.env` en plantilla multilínea', `const cfg = \`\nFOO=1\nAPI_KEY=${MATERIAL}\n\`;\n`]
  ];
  for (const [nombre, texto] of blobs) {
    assert.ok(hallazgosDe(texto, 'x.mjs').length >= 1, `blob perdido en silencio: ${nombre}`);
  }
  // El extra sigue vivo: un blob JSON VÁLIDO se analiza y da UN hallazgo, no dos
  // —el suelo opaco y el análisis no se doblan—.
  assert.equal(hallazgosDe(`const cfg = '{"api_key":"${MATERIAL}"}';\n`, 'x.mjs').length, 1);
});

test('un blob JSON válido en un literal se ENTIENDE, no sólo cae por el suelo opaco', () => {
  // El censo pilló que desactivar el análisis de JSON dentro del literal dejaba
  // la suite verde: el suelo opaco lo cazaba igual. O sea, seguridad cubierta y
  // PRECISIÓN no — sin el análisis, el hallazgo sale de un barrido a ciegas en
  // vez de traer el nombre del campo. Es el mismo patrón que M12 en la vuelta
  // anterior, y se vigila igual: exigiendo que se ENTIENDA.
  const campos = camposDeCodigo(`const cfg = '{"api_key":"${MATERIAL}","otro":1}';\n`);
  // Se filtra por valor NO vacío: cada clave produce además un campo de valor
  // vacío que sólo declara «la he consumido» (contabilidad de la ley de
  // conservación), y ése no es el que demuestra que se analizó el blob.
  const porNombre = campos.filter((c) => c.nombre === 'api_key' && c.valor !== '');
  assert.equal(porNombre.length, 1, `el blob JSON no se analizó como JSON: ${JSON.stringify(campos)}`);
  assert.equal(porNombre[0].valor, MATERIAL);
  assert.equal(porNombre[0].opaco, undefined, 'el campo analizado no debe venir marcado opaco');
  // y el suelo sigue estando debajo, marcado como tal
  assert.equal(campos.filter((c) => c.opaco === true).length, 1, 'falta el suelo opaco del literal');
});

test('el analizador de YAML se retira ante lo que declaró no modelar', () => {
  // Anclas, alias, etiquetas, claves complejas y de fusión. Se comprueba que
  // LANZA (y no que «sale limpio»), que es la diferencia entre retirarse y
  // mentir.
  for (const texto of ['a: &ancla 1\nb: *ancla\n', 'a: !!str 1\n', '? [a, b]\n: c\n', 'x:\n  <<: *base\n']) {
    assert.throws(() => camposDeYaml(texto), NoEntiendo, `no se retiró ante: ${JSON.stringify(texto)}`);
  }
});

// ---------------------------------------------------------------------------
// LA LEY DE CONSERVACIÓN
//
// Cuatro vueltas, cuatro veces el mismo fallo: una frase absoluta sobre una
// superficie que no había enumerado entera. Y el instrumento que puse para no
// repetirla —un test que CONTABA `return null` y `catch`— la repitió: contaba
// dos FORMAS SINTÁCTICAS, no las salidas. Un `catch {` sin paréntesis lo
// evadía, y también un `return campos;` en cualquier analizador.
//
// Contar sintaxis es la misma familia que la lista de nombres de U231:
// mientras el instrumento sea una lista, el mutante que la evade existe.
//
// Así que el instrumento ya NO MIRA EL CÓDIGO: mira el RESULTADO.
//
//   LEY 1 · cobertura. En un formato de DATOS todo token de la entrada tiene
//           que aparecer en el nombre o en el valor de alguna campo. Si el
//           analizador no lo mira, se perdió.
//   LEY 2 · anidamiento. Ninguna campo NO opaca puede llevar dentro una forma
//           `nombre: valor` con material sin que una campo OPACA la cubra.
//           Juzgar un documento como si fuera un átomo es no juzgarlo.
//
// Si el analizador LANZA, conserva por definición: quien llama se retira al
// barrido crudo y mira el fichero entero.
//
// Esto no se evade añadiendo una salida nueva, porque no hay lista que evadir.
// Y está DEMOSTRADO que caza: revirtiendo cada arreglo de este WP —B1 (las dos
// mitades), B3, B5 y m6— la ley enrojece los cuatro **sin conocerlos**, y no
// enrojece con media reversión, que no es un agujero. La demostración está en
// el reporte.
// ---------------------------------------------------------------------------

/**
 * Recorre unas entradas y devuelve las que violan la ley.
 *
 * ESTÁ EXTRAÍDO A PROPÓSITO. Con el bucle dentro del test, cambiar
 * `if (v.length > 0) malos.push(…)` por `if (false)` dejaba las 199 pruebas en
 * verde: la LEY estaba vigilada (§B8) pero su CONSUMO no. Un control que llama
 * a la función y no vigila la producción es la misma trampa una capa más
 * arriba. Sacándolo, el test de abajo puede ejercitarlo con una entrada que SÍ
 * viola y exigir que la recoja.
 *
 * @param {{ rel: string, texto: string, formato: string }[]} entradas
 * @returns {string[]}
 */
function violacionesDe(entradas) {
  const malos = [];
  for (const e of entradas) {
    const v = violacionesDeConservacion(e.texto, e.formato, e.analizar);
    if (v.length > 0) malos.push(`${e.rel}: ${v[0]}`);
  }
  return malos;
}

/** Las entradas del corpus real con formato conocido. */
function corpusConFormato() {
  const salida = spawnSync('git', ['--no-optional-locks', 'ls-files'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  assert.equal(salida.status, 0, 'no se pudo listar el corpus');
  const rutas = salida.stdout.split('\n').filter(Boolean);
  assert.ok(rutas.length > 1000, `corpus sospechosamente corto: ${rutas.length}`);
  const entradas = [];
  for (const rel of rutas) {
    const formato = formatoDe(path.basename(rel));
    if (!formato) continue;
    // Se llama `leido` y no `abs` a propósito: el guardián estático de
    // `arbol-inmutable.test.mjs` marca por NOMBRE, así que un `abs` derivado de
    // `REPO_ROOT` contaminaría los `abs` de los helpers de arriba.
    const leido = path.join(REPO_ROOT, rel);
    let st;
    try {
      st = fs.statSync(leido);
    } catch {
      continue;
    }
    if (!st.isFile() || st.size > 1024 * 1024) continue;
    entradas.push({ rel, texto: fs.readFileSync(leido).toString('utf8'), formato });
  }
  return entradas;
}

test('LEY DE CONSERVACIÓN: ningún token del CORPUS REAL se pierde', { timeout: 300_000 }, () => {
  // Sobre los ficheros trackeados de verdad, no sobre vectores escogidos. Fue
  // esta ley la que encontró que `parameters: []` y `position: { x: 4 }` dejaban
  // la CLAVE sin contabilizar, en seis ficheros de `spec/` que nadie miraba.
  const entradas = corpusConFormato();
  assert.ok(entradas.length > 500, `se miraron sólo ${entradas.length} ficheros`);
  const malos = violacionesDe(entradas);
  assert.deepEqual(malos.slice(0, 10), [], `la ley se rompe en ${malos.length} fichero(s)`);
});

test('EL CONSUMO de la ley está vigilado: una entrada que viola SE RECOGE', { timeout: 300_000 }, () => {
  // m14. Que la ley detecte no basta: hay que comprobar que quien la usa ACTÚA
  // sobre el resultado. Se mete en el mismo recorrido una entrada que viola de
  // verdad y se exige que salga en la lista. Si alguien neutraliza el `push`,
  // esto enrojece.
  const sembrada = {
    rel: 'SEMBRADA',
    texto: `id: demo\napi_key: ${MATERIAL}\n`,
    formato: 'yaml',
    // Analizador MUTILADO: ve la primera linea y se traga la segunda. La
    // violacion es real y la produce la ley de verdad; lo que se comprueba
    // aqui es que el RECORRIDO la recoge.
    analizar: () => [{ nombre: 'id', valor: 'demo', line: 1 }]
  };
  // Sin ella, el corpus sale limpio.
  const entradas = corpusConFormato();
  assert.deepEqual(violacionesDe(entradas), []);
  // Con ella, tiene que salir UNA y ser la suya.
  const conSembrada = violacionesDe([...entradas, sembrada]);
  assert.equal(
    conSembrada.length,
    1,
    `el recorrido no recogio la violacion sembrada: ${JSON.stringify(conSembrada)}`
  );
  assert.match(conSembrada[0], /^SEMBRADA: /);
});

test('LEY DE CONSERVACIÓN: las formas corrientes de configuración conservan', () => {
  // Formas genéricas, NO vectores de los agujeros conocidos: es la batería con
  // la que se demuestra que la ley caza B1/B3/B5/m6 al revertirlos.
  /** @type {[string, string][]} */
  const formas = [
    ['yaml', `id: demo\napi_key: ${MATERIAL}\n`],
    ['yaml', `cfg: {"host":"a.invalid","api_key":"${MATERIAL}"}\n`],
    ['yaml', `{"api_key":"${MATERIAL}"}\n`],
    ['yaml', `run: |\n  npm ci\n  export API_KEY=${MATERIAL}\n`],
    ['yaml', `# api_key: ${MATERIAL}\nid: demo\n`],
    ['yaml', `%foo: ${MATERIAL}\n`],
    ['json', `{"tokens":["${MATERIAL}"]}\n`],
    ['json', '{"api_key":' + '9'.repeat(20) + '}\n'],
    ['dockerfile', ['FROM node:20', `ENV API_KEY ${MATERIAL}`, ''].join('\n')],
    ['dockerfile', ['FROM node:20', 'ENV A=1 \\', `# api_key=${MATERIAL}`, '    B=2', ''].join('\n')],
    ['dockerfile', ['FROM node:20', `RUN export API_KEY=${MATERIAL}`, ''].join('\n')],
    ['codigo', `const cfg = 'api_key: ${MATERIAL}';\n`],
    ['codigo', `const cfg = '{"api_key":"${MATERIAL}"}';\n`],
    ['codigo', `// api_key = ${MATERIAL}\n`],
    ['codigo', `const token = '${MATERIAL}';\n`]
  ];
  /** @type {string[]} */
  const rotas = [];
  for (const [formato, texto] of formas) {
    const v = violacionesDeConservacion(texto, formato);
    if (v.length > 0) rotas.push(`${formato}: ${v[0]} — ${JSON.stringify(texto.slice(0, 44))}`);
  }
  assert.deepEqual(rotas, [], 'la ley de conservación se rompe:\n' + rotas.join('\n'));
});

test('MATAR A LA LEY se nota: analizador mutilado -> ley 1 enrojece', () => {
  // B8. El control positivo anterior NO llamaba a la funcion: simulaba la idea
  // con un `heno` escrito a mano. Por eso la ley entera se podia sustituir por
  // `return []` con las 96 pruebas en verde. Esto llama a la funcion DE VERDAD
  // con un analizador mutilado, asi que:
  //   · si alguien devuelve `[]` desde la ley, este test enrojece;
  //   · si alguien apaga la ley 1, este test enrojece.
  const texto = `id: demo\napi_key: ${MATERIAL}\n`;
  // El analizador de verdad conserva.
  assert.deepEqual(violacionesDeConservacion(texto, 'yaml'), []);
  // Uno que se traga la segunda linea, NO.
  const mutilado = () => [{ nombre: 'id', valor: 'demo', line: 1 }];
  const v = violacionesDeConservacion(texto, 'yaml', mutilado);
  assert.ok(
    v.length > 0,
    'la LEY 1 no ve una linea entera perdida: o esta apagada o devuelve vacio'
  );
  assert.match(v[0], /^L1 /, `la violacion no viene de la ley 1: ${JSON.stringify(v)}`);
});

test('MATAR A LA LEY se nota: blob juzgado como atomo -> ley 2 enrojece', () => {
  // El gemelo del anterior para la LEY 2, que es la unica que cubre el codigo.
  // Si alguien la apaga, esto enrojece; si alguien devuelve `[]`, tambien.
  const texto = `const cfg = 'api_key: ${MATERIAL}';\n`;
  assert.deepEqual(violacionesDeConservacion(texto, 'codigo'), []);
  // Un analizador que ve el blob pero lo juzga como si fuera un atomo: ni lo
  // analiza ni lo marca opaco. Es exactamente la forma de B3.
  const comoAtomo = () => [{ nombre: 'cfg', valor: `api_key: ${MATERIAL}`, line: 1 }];
  const v = violacionesDeConservacion(texto, 'codigo', comoAtomo);
  assert.ok(
    v.length > 0,
    'la LEY 2 no ve un documento juzgado como atomo: o esta apagada o devuelve vacio'
  );
  assert.match(v[0], /^L2 /, `la violacion no viene de la ley 2: ${JSON.stringify(v)}`);
});

test('la ley se retira cuando el analizador lanza, y eso NO es conservar por vacio', () => {
  // Que lanzar cuente como conservar es correcto —quien llama barre en crudo—
  // pero tiene que ser por LANZAR, no porque la ley no mire. Se comprueba que
  // el mismo texto con un analizador que NO lanza si viola.
  const texto = `id: demo\napi_key: ${MATERIAL}\n`;
  const queLanza = () => {
    throw new NoEntiendo('de mentira');
  };
  assert.deepEqual(violacionesDeConservacion(texto, 'yaml', queLanza), []);
  const queCalla = () => [];
  assert.ok(
    violacionesDeConservacion(texto, 'yaml', queCalla).length > 0,
    'devolver cero campos EN SILENCIO tiene que violar la ley'
  );
});

test('la clave de deduplicacion lleva la LINEA: dos fugas no se funden en una', () => {
  // m11. Quitar la linea de la clave de deduplicacion dejaba la suite verde y
  // bajaba el corpus de 83 a 61 sobre los MISMOS 49 ficheros: no se pierde
  // seguridad —el gate sigue rojo— pero se pierde INFORME, y el operador se
  // queda sin saber cuantas fugas hay ni donde. Pieza con carga y sin guardian.
  const texto = `api_key: ${MATERIAL}\notro: 1\ntoken: ${MATERIAL}\n`;
  const h = hallazgosDe(texto, 'x.yaml');
  assert.equal(h.length, 2, `dos campos de identidad en lineas distintas son DOS hallazgos: ${JSON.stringify(h)}`);
  assert.deepEqual(h.map((x) => x.line), [1, 3]);
  assert.deepEqual(new Set(h.map((x) => x.id)), new Set(['campo-identidad']));
});

test('B9: toda rama del lexer que CONSUME entrada emite, marca opaco o lanza', () => {
  // La sexta devolucion trajo TRES FAMILIAS y DIEZ FORMAS, todas en codigo,
  // todas en silencio y todas invisibles para la ley: la ley 1 salta el codigo
  // y la ley 2 solo mira valores de campos. No se cierran con un cuarto
  // canario, sino dandole al lexer la misma invariante que ya tienen los
  // formatos de datos. Este test es el censo de esa invariante.
  const casos = [
    // FAMILIA 1 - regex que la heuristica toma por division. El tramo ambiguo
    // entre dos `/` de la misma linea se marca OPACO: lo ambiguo se barre.
    ['tras parentesis', `const s='';\nif (s) /api_key=${MATERIAL}/.test(s);\n`],
    ['tras corchete', `const a=[1];\na[0] /api_key=${MATERIAL}/;\n`],
    ['tras identificador', `let x=1;\nx /api_key=${MATERIAL}/g;\n`],
    ['tras llamada', `function f(){}\nf() /api_key=${MATERIAL}/.test(y);\n`],
    // FAMILIA 2 - literales que no son cadena. La asimetria la cree yo: en la
    // 3a vuelta arregle esto MISMO para JSON y no para codigo.
    ['numero decimal', `const api_key = 123456789012345678;\n`],
    ['numero hexadecimal', `const api_key = 0xABCDEF1234567890;\n`],
    ['numero con separador', `const api_key = 123_456_789_012_345;\n`],
    ['BigInt', `const api_key = 123456789012345678n;\n`],
    // FAMILIA 3 - plantillas anidada y etiquetada. Se escriben con comillas
    // simples y concatenacion para que los acentos graves de dentro sean
    // texto y no sintaxis de este fichero.
    ['plantilla anidada', 'const api_key = `${`' + MATERIAL + '`}`;\n'],
    ['plantilla etiquetada', 'const api_key = tag`' + MATERIAL + '`;\n']
  ];
  const perdidas = [];
  for (const [nombre, texto] of casos) {
    if (hallazgosDe(texto, 'x.mjs').length === 0) perdidas.push(nombre);
  }
  assert.deepEqual(perdidas, [], 'ramas del lexer que consumen y callan:\n' + perdidas.join('\n'));
});

test('B9: la division de verdad NO se convierte en falso positivo', () => {
  // El precio de barrer el tramo ambiguo entre dos `/` tiene que ser cero
  // sobre aritmetica corriente.
  for (const l of ['const x = (a+b)/c;', 'const y = a / b / c;', 'const z = total/n;']) {
    assert.deepEqual(hallazgosDe(l + '\n', 'x.mjs'), [], l);
  }
});

test('la ley SIGUE ATADA a la suite: `conservacion.mjs` no casa con el glob de CI', () => {
  // m16. `npm run test:gates` glob-ea `test/gates/*.test.mjs`, y
  // `conservacion.mjs` NO casa: entra en CI solo porque este fichero la
  // importa. Esta bien que sea biblioteca y no suite —por eso se saco del
  // test, para que la demostracion externa use la MISMA ley y no una copia—
  // pero si esa importacion desaparece, la ley deja de correr y nada lo dice.
  // Esto lo dice.
  const dir = path.resolve(AQUI);
  const suites = fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs'));
  assert.ok(suites.length >= 4, `suites sospechosamente pocas: ${suites.length}`);
  const importan = suites.filter((f) =>
    /from\s+['`\"]\.\/conservacion\.mjs['`\"]/.test(fs.readFileSync(path.join(dir, f), 'utf8'))
  );
  assert.ok(
    importan.length >= 1,
    'ninguna suite de `test/gates/*.test.mjs` importa `conservacion.mjs`: la ley de ' +
      'conservacion ha dejado de correr en CI y nadie se ha enterado'
  );
});

test('la ley NO sustituye a la vigilancia de sintaxis: las dos clases siguen contadas', () => {
  // La ley de conservación es el instrumento PRINCIPAL y es el que no se evade.
  // Esto es el cinturón además de los tirantes, y con el alcance dicho en el
  // título: cuenta DOS FORMAS SINTÁCTICAS, no «las salidas». Se mantiene porque
  // avisa antes —al escribir el código, no al correr el corpus— y porque las
  // expresiones van ensanchadas tras la evasión que encontró la contrarrevisión:
  // `catch {` sin paréntesis (binding opcional, ES2019) era invisible.
  const src = fs.readFileSync(path.resolve(AQUI, '../../scripts/gates/formatos.mjs'), 'utf8').split('\n');
  const util = src.filter((l) => !/^\s*(\*|\/\/)/.test(l));
  const cuenta = (re) => util.filter((l) => re.test(l)).length;

  assert.equal(cuenta(/^\s*(if\s*\(.*\)\s*)?return null;/), 3, 'cambió el número de `return null`');
  // `catch (e)` y `catch {`: las dos formas.
  assert.equal(cuenta(/catch\s*[({]/), 1, 'apareció un `catch` nuevo (con o sin paréntesis)');
  assert.equal(cuenta(/opaco: true/), 10, 'cambió el número de valores marcados OPACOS');
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
  // este árbol cuesta 36 falsos positivos POR EL CAMINO ESTRUCTURAL —muchos en
  // campos `author`, que son identidad PÚBLICA—. En `main` el mismo bug no
  // producía ninguno: su único consumidor era `censarVolumenes`. O sea que el
  // arreglo no limpia deuda ajena, evita que la propia se dispare.
  // El arreglo es un `(?:…)`; este test lo fija.
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
  const h = hallazgosDe(texto, 'x.yaml');
  assert.equal(h.length, 1, `un bloque con dos líneas de material es UNA fuga: ${JSON.stringify(h)}`);
  assert.equal(h[0].id, 'campo-identidad');
  assert.equal(h[0].line, 2, 'la línea señalada no es la primera del cuerpo');
});

test('el cuerpo de un bloque NO se lee como pares `clave: valor`', () => {
  // `notas` no es un nombre de identidad y el cuerpo es TEXTO: la línea de
  // dentro no es un campo. Sin análisis de bloque, `api_key` de ahí dentro se
  // leería como un campo y sería un falso positivo sobre documentación.
  const texto = 'notas: |\n  el campo api_key: se documenta en la guia de rotacion\n';
  assert.deepEqual(hallazgosDe(texto, 'x.yaml'), []);
});

test('pero el cuerpo OPACO se sigue barriendo en crudo: un `run: |` de CI no se tapa', () => {
  // El análisis no puede tapar lo que no entiende. El cuerpo de un bloque es
  // shell, no YAML, y el shell de CI es donde viven los secretos.
  const texto = `run: |\n  npm ci\n  export API_KEY=${MATERIAL}\n`;
  const h = hallazgosDe(texto, 'x.yaml');
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
    assert.deepEqual(hallazgosDe(`${l}\n`, 'x.mjs'), [], l);
  }
  // y el gemelo: el MISMO nombre con un literal de verdad SÍ cae
  assert.equal(hallazgosDe(`const token = '${MATERIAL}';\n`, 'x.mjs').length, 1);
  assert.equal(hallazgosDe(`  secret: '${MATERIAL}',\n`, 'x.mjs').length, 1);
});

test('el lexer distingue comentario, plantilla y expresión regular', () => {
  // El lexer SEPARA el comentario del código; lo que hace con él es otra cosa
  // (abajo). Aquí se mide que no se desincroniza.
  //
  // Una expresión regular con comillas dentro NO debe desincronizar el lexer:
  // si lo hiciera, el literal de después se perdería y eso sería un silencio.
  const conRegex = `const re = /['"]:/;\nconst token = '${MATERIAL}';\n`;
  const h = hallazgosDe(conRegex, 'x.mjs');
  assert.equal(h.length, 1, `el lexer se desincronizó con la expresión regular: ${JSON.stringify(h)}`);
  assert.equal(h[0].line, 2);
  // Una división NO abre expresión regular.
  assert.equal(hallazgosDe(`const x = a / b;\nconst token = '${MATERIAL}';\n`, 'x.mjs').length, 1);
  // Una plantilla con una comilla dentro tampoco desincroniza: el literal que
  // viene después se sigue viendo.
  const conPlantilla = 'const t = `no es \'un\' problema`;\n' + `const token = '${MATERIAL}';\n`;
  const h2 = hallazgosDe(conPlantilla, 'x.mjs');
  assert.equal(h2.length, 1, `el lexer se desincronizó con la plantilla: ${JSON.stringify(h2)}`);
  assert.equal(h2[0].line, 2);
});

test('un comentario NO es un punto ciego: se barre en crudo (era pérdida frente a U231)', () => {
  // La primera versión de este WP tiraba los comentarios y lo declaraba como
  // límite. Era una pérdida real —«lo dejo comentado por si acaso» es donde se
  // queda un secreto— y además una pérdida MÁS ANCHA de lo declarado: no sólo
  // en código, también en YAML y en Dockerfile. Ahora el comentario sale OPACO
  // y se barre en crudo, que es la lectura conservadora.
  assert.equal(hallazgosDe(`// api_key = ${MATERIAL}\n`, 'x.mjs').length, 1);
  assert.equal(hallazgosDe(`/* api_key: '${MATERIAL}' */\n`, 'x.mjs').length, 1);
  assert.equal(hallazgosDe(`# api_key: ${MATERIAL}\nid: demo\n`, 'x.yaml').length, 1);
  assert.equal(hallazgosDe(`FROM node:20\n# api_key=${MATERIAL}\n`, 'Dockerfile').length, 1);
  // Y los patrones por FORMA siguen barriendo el texto entero, como siempre.
  const jwt = `${'ey'}${'J'}${'NOESUNTOKENSINTETICO'}.${'ZWpwbG9zaW50ZXRpY28'}.${'firma-sintetica'}`;
  const h = hallazgosDe(`// ${jwt}\n`, 'x.mjs');
  assert.equal(h.length, 1, 'un JWT comentado SÍ se tiene que seguir cazando');
  assert.equal(h[0].id, 'jwt');
});

test('cerrar el ancla NO puede costar nombres compuestos del programador', () => {
  // La contrarrevisión midió que el arreglo del ancla, tal cual, dejaba de casar
  // DOCE nombres de identidad: el ancla exige frontera no alfanumérica y en
  // `authToken` la frontera es un cambio de caja. Arreglar un fallo abriendo
  // otro no es arreglarlo. `esNombreDeIdentidad` parte el nombre en palabras.
  for (const n of [
    'authToken', 'accessToken', 'userToken', 'apiSecret', 'tokenValue',
    'secretValue', 'clave1', 'claveAdmin', 'password2', 'passwordHash'
  ]) {
    assert.equal(esNombreDeIdentidad(n), true, `\`${n}\` es un nombre de identidad y no se reconoce`);
  }
  // los COMPUESTOS DEL LÉXICO siguen dentro (partidos en palabras no casarían:
  // ni `api` ni `key` están en el léxico por separado)
  for (const n of ['api_key', 'secret_key', 'private_key', 'access_key', 'apiKey']) {
    assert.equal(esNombreDeIdentidad(n), true, n);
  }
  // y lo que NO es identidad sigue fuera, que es el punto del arreglo
  for (const n of ['author', 'authors', 'AUTHOR', 'tokenizer', 'secretaria', 'xxpwdyy', 'passenger']) {
    assert.equal(esNombreDeIdentidad(n), false, `\`${n}\` NO es un nombre de identidad`);
  }
});

test('LÍMITE DECLARADO: una tirada en MAYÚSCULAS sin separador no se puede partir', () => {
  // `AUTHTOKEN` y `AUTHOR` son el mismo problema —una tirada de mayúsculas sin
  // frontera— y sólo un diccionario los distingue. Se prefiere perder el primero
  // a recuperar el segundo: un autor es identidad PÚBLICA y recuperarlo cuesta
  // 36 hallazgos por el camino estructural. Con separador se caza sin problema,
  // y eso también se fija.
  assert.equal(esNombreDeIdentidad('AUTHTOKEN'), false);
  assert.equal(esNombreDeIdentidad('ZEUS_AUTHTOKEN'), false);
  assert.equal(esNombreDeIdentidad('ZEUS_AUTH_TOKEN'), true, 'con separador SÍ se tiene que cazar');
  assert.equal(esNombreDeIdentidad('ZEUS_AUTHTOKEN'.replace('AUTHTOKEN', 'AuthToken')), true);
});

test('un campo `author` con su identidad pública NO es un hallazgo', () => {
  // El caso real: `packages/mesh/ssb-system/fixtures/ssb-log.json`. Un autor de
  // SSB es una clave PÚBLICA; denunciarla es ruido sobre datos correctos.
  assert.deepEqual(hallazgosDe('{"author":"@alice.ed25519"}', 'x.json'), []);
  assert.deepEqual(hallazgosDe('{"author":"escrivivir-co"}', 'x.json'), []);
});
