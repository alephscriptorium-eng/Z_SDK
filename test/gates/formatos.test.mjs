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
  camposDeCodigo,
  camposDeJson,
  camposDeYaml,
  formatoDe
} from '../../scripts/gates/formatos.mjs';

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
    ['valor NUMÉRICO en JSON', `{"api_key": ${'9'.repeat(20)}}`, 'x.json'],
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
  // a recuperar el segundo: un autor es identidad PÚBLICA y sale once veces en
  // este árbol. Con separador se caza sin problema, y eso también se fija.
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
