/**
 * WP-U231 — guardián del invariante de secretos en el plano de datos.
 *
 * NINGÚN SECRETO REAL VIVE EN ESTE FICHERO. Todos los vectores se COMPONEN por
 * concatenación en tiempo de ejecución (`'AKIA' + 'Z'.repeat(16)`), de modo que
 * la cadena con forma de credencial no queda escrita en el árbol ni en el
 * historial, y ningún servicio la reconocería: los hosts son `.invalid` (TLD
 * reservado, RFC 2606) y los cuerpos son relleno de una sola letra.
 *
 * Y NINGÚN VECTOR TOCA `VOLUMES/`. Todo se planta en árboles temporales; el
 * árbol de datos real del repo sólo se lee, para medir la CA de cero falsos
 * positivos.
 *
 * Los cuatro frentes, en este orden:
 *   1. VERDE MEDIDO sobre el árbol de hoy — si enrojece en limpio, no sirve.
 *   2. ROJO CON VECTOR PLANTADO — las dos mitades del enunciado.
 *   3. HOSTIL-OMITE — la ausencia (árbol, manifiesto, patrón, segunda puerta)
 *      tiene que denegar o fallar ruidoso. Nunca pasar de largo.
 *   4. CENSO DE MUTACIÓN — cada patrón, desactivado, deja escapar SU caso. Un
 *      patrón que al matarlo no cambia nada es decorado, no vigilancia.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, runAllGates } from '../../scripts/gates/scan.mjs';
import { EXCEPTIONS } from '../../scripts/gates/exceptions.mjs';
import {
  PATRONES_IDENTIDAD,
  buscarDockerfiles,
  censarVolumenes,
  esHueco,
  formatearCenso,
  hallazgosEnTexto,
  motivosDeExcepcionProhibida,
  scanClaveEnVolumen,
  scanContextoImagen,
  scanVolumenExigeSecreto
} from '../../scripts/gates/claves.mjs';

// ---------------------------------------------------------------------------
// Utillería: árboles sintéticos
// ---------------------------------------------------------------------------

/**
 * @param {(api: { dir: string, fichero: (rel: string, contenido: string) => string }) => void} escribir
 * @returns {string}
 */
function arbol(escribir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u231-'));
  const fichero = (rel, contenido) => {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contenido);
    return abs;
  };
  // Todo árbol sintético trae el contrato de lectura mínimo: sin él, el censo
  // enrojece POR SU AUSENCIA, que es una rama distinta y tiene su propio test.
  fichero(
    'packages/engine/presets-sdk/src/volumes/resolve.mjs',
    'export const root = () => process.env.ZEUS_VOLUMES_ROOT;\n'
  );
  fichero('VOLUMES/volumes.json', JSON.stringify({ volumes: { demo: { disk: 'DISK_09', path: 'DISK_09/DEMO' } } }, null, 2));
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

// ---------------------------------------------------------------------------
// Vectores sintéticos, uno por patrón. Compuestos, nunca escritos enteros.
// ---------------------------------------------------------------------------

/** @type {Record<string, string>} */
const VECTORES = {
  'pem-privada': `${'-----BEGIN'} PRIVATE ${'KEY-----'}\n${'A'.repeat(64)}\n${'-----END'} PRIVATE ${'KEY-----'}`,
  // El JWT va SOLO en su línea, sin campo que lo nombre: con `authorization`
  // delante lo cazaba también `campo-identidad` y el censo de mutación lo
  // denunciaba con razón —un vector que cazan dos patrones no mide a ninguno—.
  jwt: `${'ey'}${'J'}${'NOESUNTOKENSINTETICO'}.${'ZWpwbG9zaW50ZXRpY28'}.${'firma-sintetica-invalida'}`,
  'url-con-credencial': `dsn = ${'postgres://'}usuario:${'clave-sintetica-u231'}@base.invalid/db`,
  'ssb-privada': `{"curve":"ed25519","${'private'}": "${'A'.repeat(43)}.ed25519"}`,
  'ssb-invitacion': `pub.invalid:8008:@${'B'.repeat(43)}.ed25519~${'C'.repeat(43)}`,
  'token-de-proveedor': `deploy = ${'AKIA'}${'Z'.repeat(16)}`,
  'campo-identidad': `${'api_key'}: ${'valor-sintetico-que-ningun-servicio-conoce'}`
};

test('los vectores cubren TODOS los patrones — un patrón sin vector no se mide', () => {
  assert.deepEqual(
    PATRONES_IDENTIDAD.map((p) => p.id).sort(),
    Object.keys(VECTORES).sort(),
    'hay patrones sin vector (o vectores sin patrón): el censo de mutación de abajo dejaría de ser un censo'
  );
  assert.ok(PATRONES_IDENTIDAD.length >= 7, 'lista de patrones sospechosamente corta');
});

// ---------------------------------------------------------------------------
// 1 · VERDE MEDIDO sobre el árbol de hoy
// ---------------------------------------------------------------------------

test('CA verde: el árbol de datos de hoy no tiene ni un hallazgo', () => {
  const ofensas = scanClaveEnVolumen({ repoRoot: REPO_ROOT });
  assert.deepEqual(
    ofensas,
    [],
    `falso positivo sobre el árbol limpio — un gate que enrojece en verde se desactiva a la semana:\n${JSON.stringify(ofensas, null, 2)}`
  );
});

test('CA verde: ningún volumen de hoy exige una identidad para leerse', () => {
  const ofensas = scanVolumenExigeSecreto({ repoRoot: REPO_ROOT });
  assert.deepEqual(ofensas, [], JSON.stringify(ofensas, null, 2));
});

test('CA verde: el contexto de imagen de hoy no tiene ofensas', () => {
  const ofensas = scanContextoImagen({ repoRoot: REPO_ROOT });
  assert.deepEqual(ofensas, [], JSON.stringify(ofensas, null, 2));
});

test('CA verde: `npm run gates` sigue limpio con las tres reglas dadas de alta', { timeout: 120_000 }, () => {
  const { ok, offenders } = runAllGates({ repoRoot: REPO_ROOT });
  assert.equal(ok, true, JSON.stringify(offenders, null, 2));
});

test('los hashes legítimos del árbol NO son un hallazgo (por qué no hay entropía)', () => {
  // `packHash`, `hashes`, `snapshot`, `manifestSha256`: sha256 por todas partes.
  // Un umbral de entropía sobre hex/base64 los pintaría a todos de rojo. Aquí
  // se comprueba que la línea real del manifiesto pasa limpia.
  const linea = '"packHash": "26f215e8d111b44babcc7b033fd48ee76d06c6e5dd863e7f1fc0bd5b2245ea89",';
  assert.deepEqual(hallazgosEnTexto(linea), []);
  const ledger =
    '{"v":1,"seq":1,"actorId":"sello-root","manifestSha256":{"before":"a4a4b183b909857ffe5b89397d5a9e007c07ee98b604be089f2777c84f3ac9c1"}}';
  assert.deepEqual(hallazgosEnTexto(ledger), []);
});

test('un `${VAR}` de plantilla NO es un secreto — es la forma que usa volumes.json', () => {
  assert.deepEqual(hallazgosEnTexto('"pubUrl": "${ZEUS_SSB_PUB_URL}"'), []);
  assert.deepEqual(hallazgosEnTexto('"token": "${ZEUS_ALGO_TOKEN}"'), []);
  assert.deepEqual(hallazgosEnTexto('password=<pon-aqui-la-tuya>'), []);
  assert.deepEqual(hallazgosEnTexto('api_key = changeme'), []);
  assert.ok(esHueco('${X}') && esHueco('<algo>') && esHueco('corto'));
  assert.ok(!esHueco('valor-sintetico-que-ningun-servicio-conoce'));
});

// ---------------------------------------------------------------------------
// 1 bis · LOS SIETE FALSOS POSITIVOS CENSADOS.
//
// El arreglo anterior de esta clase cerró EL CASO que tenía delante —`${VAR}`—
// y no LA CLASE. Estos siete son configuración corriente y correcta; cada uno
// enrojecía. Un gate que pinta de rojo lo bueno se desactiva, y entonces deja
// de vigilar también lo malo: por eso van antes que cualquier ampliación.
// ---------------------------------------------------------------------------

/** @type {[string, string][]} */
const FALSOS_POSITIVOS = [
  ['plantilla de llaves dobles (Helm, Jinja, Actions)', 'password: {{DB_PASSWORD}}'],
  ['plantilla de paréntesis (Make, Azure)', 'password: $(DB_PASSWORD)'],
  ['plantilla de porcentajes (cmd)', 'password: %DB_PASSWORD%'],
  ['referencia a otra configuración', 'password: .Values.global.registrySecretName'],
  ['URL de documentación sobre rotación', 'secret: https://docs.example.invalid/guia/rotacion-de-claves'],
  ['valor centinela de un enum', 'credentials: inherit-from-operator-env'],
  ['texto de i18n que repite su etiqueta', '"contraseña": "Contraseña olvidada, revise su correo"']
];

test('contraprueba: los siete falsos positivos censados salen limpios', () => {
  /** @type {string[]} */
  const rojos = [];
  for (const [nombre, texto] of FALSOS_POSITIVOS) {
    const h = hallazgosEnTexto(texto);
    if (h.length > 0) rojos.push(`${nombre} — cazado por [${h.map((x) => x.id).join(', ')}]: ${texto}`);
  }
  assert.deepEqual(
    rojos,
    [],
    'vuelve a haber falsos positivos sobre configuración correcta:\n' + rojos.join('\n')
  );
});

test('contraprueba: los siete siguen limpios POR EL GATE, sembrados en un volumen', () => {
  // El helper puro y el escáner pueden divergir; aquí se mide el camino real.
  for (const [nombre, texto] of FALSOS_POSITIVOS) {
    const dir = arbol(({ fichero }) => fichero('VOLUMES/DISK_09/DEMO/config.yaml', `${texto}\n`));
    con(dir, () => {
      assert.deepEqual(scanClaveEnVolumen({ repoRoot: dir }), [], `falso positivo por el gate: ${nombre}`);
    });
  }
});

test('la precisión NO se compró aflojando: cada hueco tiene su gemelo que SÍ cae', () => {
  // Un clasificador de huecos demasiado ancho es un agujero con otro nombre.
  // Para cada clase de hueco, un valor de la MISMA forma que sí es material.
  const gemelos = [
    // URL: sin material es referencia; con un tramo de 24 caracteres es la credencial
    ['url con material', `secret: https://hooks.example.invalid/servicios/T00/B00/${'Xk29fJqLm4Tz8vBn1QwErT'}`],
    // kebab: sin palabra de configuración no es centinela
    ['kebab sin centinela', 'password: correct-horse-battery-staple'],
    // referencia: sin el punto inicial no es una ruta de configuración
    ['dotted sin punto inicial', 'password: Values.global.registrySecretName'],
    // i18n: sólo se perdona si el valor ES la etiqueta
    ['texto que no repite la etiqueta', '"contraseña": "Xk29fJqLm4Tz8vBn1QwErTyU"']
  ];
  for (const [nombre, texto] of gemelos) {
    assert.ok(hallazgosEnTexto(texto).length > 0, `el clasificador de huecos se tragó material: ${nombre}`);
  }
});

// ---------------------------------------------------------------------------
// 1 ter · EL LÉXICO, EN LOS DOS IDIOMAS.
//
// Estaba sólo en inglés, en un repo escrito en castellano cuya regla se llama
// `clave-en-volumen` y cuya doctrina dice «claves de pub, tokens de registry,
// credenciales de VPS». Dos de esas tres palabras no las reconocía nadie.
// ---------------------------------------------------------------------------

/** Las trece que se fugaban, medidas con el gate real antes de cerrarlas. */
const SE_FUGABAN = [
  'clave',
  'contraseña',
  'contrasena',
  'secreto',
  'credencial',
  'credenciales',
  'auth',
  'authorization',
  'privkey',
  'clave_privada',
  'clave_secreta',
  'claveApi',
  'semilla'
];

test('el léxico reconoce identidad en castellano, no sólo en inglés', () => {
  const material = 'Xk29fJqLm4Tz8vBn1QwErTyU';
  /** @type {string[]} */
  const fugas = [];
  for (const campo of SE_FUGABAN) {
    if (hallazgosEnTexto(`${campo}: ${material}`).length === 0) fugas.push(campo);
  }
  assert.deepEqual(fugas, [], `nombres de identidad que el detector no reconoce:\n${fugas.join('\n')}`);
});

test('el léxico en castellano también caza POR EL GATE, sembrado en un volumen', () => {
  for (const campo of SE_FUGABAN) {
    const dir = arbol(({ fichero }) => {
      fichero('VOLUMES/DISK_09/DEMO/x.yaml', `${campo}: Xk29fJqLm4Tz8vBn1QwErTyU\n`);
    });
    con(dir, () => {
      assert.equal(scanClaveEnVolumen({ repoRoot: dir }).length, 1, `el gate no caza \`${campo}\``);
    });
  }
});

test('`key` a secas sigue FUERA del léxico, y `clave` a secas DENTRO', () => {
  // La asimetría es medida, no de gusto: RE-MEDIDA en WP-U269 sobre los 1759
  // ficheros trackeados de hoy y con los analizadores puestos, `clave` cuesta
  // +5 hallazgos y `key` +132 (con el barrido de U231 eran +17 y +196 sobre
  // 1741 ficheros). Parsear bajó las tres cifras y no cambió la decisión. Las
  // cifras y su comando están en el reporte. Si alguien mete `key`, este test
  // se lo recuerda.
  assert.equal(hallazgosEnTexto('key: Xk29fJqLm4Tz8vBn1QwErTyU').length, 0, '`key` a secas volvió al léxico');
  assert.ok(hallazgosEnTexto('clave: Xk29fJqLm4Tz8vBn1QwErTyU').length > 0);
  // y los compuestos de `key` siguen dentro, que es lo que hace tolerable excluirla
  for (const campo of ['api_key', 'secret_key', 'private_key', 'access_key']) {
    assert.ok(hallazgosEnTexto(`${campo}: Xk29fJqLm4Tz8vBn1QwErTyU`).length > 0, campo);
  }
});

// ---------------------------------------------------------------------------
// 2 · ROJO CON VECTOR PLANTADO — mitad A: identidad DENTRO de un volumen
// ---------------------------------------------------------------------------

test('CA rojo: un secreto sintético sembrado en un volumen pone el gate rojo', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/config.json', `{\n  "nota": "fixture",\n  ${VECTORES['url-con-credencial']}\n}\n`);
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.equal(ofensas[0].rule, 'clave-en-volumen');
    assert.equal(ofensas[0].path, 'VOLUMES/DISK_09/DEMO/config.json');
    assert.equal(ofensas[0].line, 3);
    assert.match(ofensas[0].detail, /url-con-credencial/);
  });
});

test('el informe NO transcribe el secreto que caza (no lo publica una segunda vez)', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/secreto.yaml', `${VECTORES['campo-identidad']}\n`);
  });
  con(dir, () => {
    const [ofensa] = scanClaveEnVolumen({ repoRoot: dir });
    assert.ok(ofensa, 'no cazó el vector');
    assert.doesNotMatch(
      ofensa.detail,
      /valor-sintetico-que-ningun-servicio-conoce/,
      'el detalle del gate va a los logs de CI: si transcribe el valor, lo publica otra vez'
    );
    assert.match(ofensa.detail, /no transcrito/);
  });
});

test('el barrido alcanza extensiones que `scan.mjs` no mira (.yaml, .jsonl, sin extensión)', () => {
  // Los 16 ficheros de VOLUMES son .json/.yaml/.md/.jsonl: `SOURCE_EXT` de
  // scan.mjs no ve NI UNO. Si este gate heredase aquel filtro, no vigilaría nada.
  for (const nombre of ['datos.yaml', 'ledger.jsonl', 'sin-extension', 'notas.md', 'a.bin']) {
    const dir = arbol(({ fichero }) => {
      fichero(`VOLUMES/DISK_09/DEMO/${nombre}`, `${VECTORES['token-de-proveedor']}\n`);
    });
    con(dir, () => {
      const ofensas = scanClaveEnVolumen({ repoRoot: dir });
      assert.equal(ofensas.length, 1, `no barrió ${nombre}: ${JSON.stringify(ofensas)}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 2 · ROJO CON VECTOR PLANTADO — mitad B: el volumen que EXIGE un secreto
//     (la del enunciado, la más fácil de olvidar)
// ---------------------------------------------------------------------------

test('CA rojo: un volumen cuya lectura depende de un env de identidad', () => {
  const dir = arbol(({ fichero }) => {
    fichero(
      'VOLUMES/volumes.json',
      JSON.stringify(
        {
          volumes: {
            demo: { disk: 'DISK_09', path: 'DISK_09/DEMO' },
            cerrado: { disk: 'DISK_10', path: 'DISK_10/X', source: { remotePath: '${ZEUS_PUB_PRIVATE_KEY}' } }
          }
        },
        null,
        2
      )
    );
  });
  con(dir, () => {
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.equal(ofensas[0].rule, 'volumen-exige-secreto');
    assert.match(ofensas[0].detail, /«cerrado»/);
    assert.match(ofensas[0].detail, /ZEUS_PUB_PRIVATE_KEY/);
    // y el censo lo dice con lista, no con impresión
    const censo = censarVolumenes({ repoRoot: dir });
    assert.deepEqual(
      censo.filas.filter((f) => f.identidades.length > 0).map((f) => f.id),
      ['cerrado']
    );
    assert.match(formatearCenso(censo), /EXIGEN una identidad para leerse: cerrado/);
  });
});

test('CA rojo: un volumen que declara un campo de identidad en su contrato', () => {
  const dir = arbol(({ fichero }) => {
    fichero(
      'VOLUMES/volumes.json',
      JSON.stringify({ volumes: { demo: { path: 'D/X', source: { credentials: { user: 'a' } } } } }, null, 2)
    );
  });
  con(dir, () => {
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /campo:demo\.source\.credentials/);
  });
});

test('CA rojo: el CÓDIGO de lectura que pide una credencial para abrir un volumen', () => {
  const dir = arbol(({ fichero }) => {
    fichero(
      'packages/engine/presets-sdk/src/volumes/resolve.mjs',
      'export const root = () => process.env.ZEUS_VOLUMES_ROOT;\n' +
        'export const auth = () => process.env.ZEUS_VOLUMES_ACCESS_TOKEN;\n'
    );
  });
  con(dir, () => {
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.equal(ofensas[0].line, 2);
    assert.match(ofensas[0].detail, /ZEUS_VOLUMES_ACCESS_TOKEN/);
  });
});

test('la superficie de env del contrato de lectura NO es enumerable, y se dice', () => {
  // ESTE TEST CERTIFICABA UN PUNTO CIEGO. Fijaba la lista en un solo elemento
  // —`ZEUS_VOLUMES_ROOT`— porque el censo sólo sabía leer `process.env.X`
  // literal. `resolve.mjs:71` hace `process.env[envKey]`, con la clave decidida
  // por el manifiesto: la superficie real no se puede enumerar leyendo código.
  // Un test verde sobre un subconteo es peor que no tener test.
  const censo = censarVolumenes({ repoRoot: REPO_ROOT });
  assert.deepEqual(
    censo.envsDeCodigo.map((e) => `${e.name}:${e.clase}`),
    ['ZEUS_VOLUMES_ROOT:localizador', '[envKey]:dinamico'],
    'el contrato de lectura real cambió de superficie de env; recontar'
  );
  assert.equal(censo.enumerable, false, 'hay lectura dinámica: el censo no puede decirse exhaustivo');
  assert.match(formatearCenso(censo), /NO es enumerable/);
  // y ninguna de las dos es una identidad, que es lo que se quería afirmar
  assert.deepEqual(censo.envsDeCodigo.filter((e) => e.clase === 'identidad'), []);
  const porVolumen = Object.fromEntries(censo.filas.map((f) => [f.id, f.envs]));
  assert.deepEqual(porVolumen, {
    firehose: ['ZEUS_FIREHOSE_REMOTE_PATH'],
    lineas: [],
    forces: [],
    ssb: ['ZEUS_SSB_LOG_PATH', 'ZEUS_SSB_PUB_URL']
  });
});

// ---------------------------------------------------------------------------
// 2 · ROJO CON VECTOR PLANTADO — el contexto de construcción de una imagen
// ---------------------------------------------------------------------------

test('hoy NO hay ninguna receta de imagen en este árbol — medido, no supuesto', () => {
  // La afirmación que sostiene «regla armada y sin disparar» del reporte.
  assert.deepEqual(scanContextoImagen({ repoRoot: REPO_ROOT }), []);
  assert.equal(fs.existsSync(path.join(REPO_ROOT, '.dockerignore')), false);
});

test('CA rojo: identidad escrita dentro de la receta de imagen', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', `FROM node:22\nENV ${VECTORES['token-de-proveedor']}\n`);
    fichero('.dockerignore', '.env\nVOLUMES/DISK_01/\nVOLUMES/DISK_04/\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.equal(ofensas[0].rule, 'contexto-imagen');
    assert.equal(ofensas[0].path, 'Dockerfile');
    assert.match(ofensas[0].detail, /token-de-proveedor/);
  });
});

test('CA rojo: la SEGUNDA PUERTA — Dockerfile sin .dockerignore', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\nCOPY . /app\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /segunda puerta/);
  });
});

test('CA rojo: .dockerignore que no cubre .env ni los DISK vivos', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\n');
    fichero('.dockerignore', '# solo lo cómodo\nnode_modules\ndist\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 3, JSON.stringify(ofensas, null, 2));
    assert.deepEqual(
      ofensas.map((o) => o.detail.match(/`([^`]+)`/)[1]).sort(),
      ['.env', 'VOLUMES/DISK_01', 'VOLUMES/DISK_04']
    );
  });
});

test('CA rojo: re-inclusión de un TROZO de un disco vivo, después de excluirlo', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\n');
    fichero('.dockerignore', '.env\nVOLUMES/**\n!VOLUMES/DISK_01/semillas\nVOLUMES/DISK_04\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /DENTRO del contexto/);
    assert.match(ofensas[0].detail, /DISK_01/);
    // el informe nombra la regla que decide: sin eso, el operador no sabe cuál
    // de las quince líneas de su .dockerignore tiene que tocar
    assert.match(ofensas[0].detail, /!VOLUMES\/DISK_01\/semillas/);
  });
});

test('contraprueba: la re-inclusión ANTES de la exclusión no es un agujero (gana la última)', () => {
  // Docker aplica la ÚLTIMA regla que casa. Este `.dockerignore` es CORRECTO.
  // El modelo de dos `some()` independientes lo pintaba de rojo: falso positivo
  // sobre configuración buena, que es la clase que obliga a desactivar un gate.
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\n');
    fichero('.dockerignore', '!VOLUMES/DISK_01\n.env\nVOLUMES/DISK_01\nVOLUMES/DISK_04\n');
  });
  con(dir, () => {
    assert.deepEqual(scanContextoImagen({ repoRoot: dir }), []);
  });
});

test('contraprueba: una clase de caracteres `[14]` SÍ cubre lo que dice cubrir', () => {
  // `[...]` es sintaxis de Go filepath.Match, que es la que usa Docker.
  // Escaparla como literal leía `DISK_0[14]` como «no excluye DISK_01» y salía
  // rojo sobre un .dockerignore correcto y más preciso que el nuestro.
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\n');
    fichero('.dockerignore', '.env\nVOLUMES/DISK_0[14]\n');
  });
  con(dir, () => {
    assert.deepEqual(scanContextoImagen({ repoRoot: dir }), []);
  });
});

test('CA rojo: el contexto NO se adivina — los dos plausibles tienen que estar cerrados', () => {
  // `ops/.dockerignore` presente y la raíz sin nada. Un
  // `docker build -f ops/Dockerfile .` usa la RAÍZ como contexto y ni abre el
  // de `ops/`. La primera versión asumía «el directorio del Dockerfile» y
  // certificaba VERDE justo ese caso: no es «no mirar», es mirar el fichero
  // equivocado y decir OK.
  const dir = arbol(({ fichero }) => {
    fichero('ops/Dockerfile', 'FROM node:22\n');
    fichero('ops/.dockerignore', '.env\nVOLUMES/DISK_01\nVOLUMES/DISK_04\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /contexto plausible/);
    assert.match(ofensas[0].detail, /docker build -f ops\/Dockerfile \./);
  });
});

test('contraprueba: un .dockerignore que sí cierra la puerta pasa limpio', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\nCOPY package.json /app/\n');
    fichero('.dockerignore', '**/.env\nVOLUMES/DISK_*\n');
  });
  con(dir, () => {
    assert.deepEqual(scanContextoImagen({ repoRoot: dir }), []);
  });
});

test('la receta se reconoce en sus varios nombres, no sólo `Dockerfile`', () => {
  for (const nombre of ['Dockerfile', 'Dockerfile.prod', 'app.dockerfile', 'Containerfile', 'ops/Dockerfile']) {
    const dir = arbol(({ fichero }) => {
      fichero(nombre, 'FROM node:22\n');
    });
    con(dir, () => {
      const ofensas = scanContextoImagen({ repoRoot: dir });
      assert.ok(ofensas.length >= 1, `receta no reconocida: ${nombre}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 3 · HOSTIL-OMITE. La ausencia deniega o falla ruidoso. Nunca pasa de largo.
//     En este programa un gate fail-open ya costó una devolución entera.
// ---------------------------------------------------------------------------

test('omite: el árbol de volúmenes AUSENTE es rojo, no «cero hallazgos»', () => {
  const dir = arbol(() => {});
  fs.rmSync(path.join(dir, 'VOLUMES'), { recursive: true, force: true });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.equal(ofensas[0].rule, 'clave-en-volumen');
    assert.match(ofensas[0].detail, /no es «cero secretos»/);
  });
});

test('omite: el manifiesto AUSENTE es rojo — un censo sin sujeto no es un censo', () => {
  const dir = arbol(({ dir: d }) => {
    fs.rmSync(path.join(d, 'VOLUMES', 'volumes.json'));
  });
  con(dir, () => {
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /Rojo por ausencia/);
    assert.equal(censarVolumenes({ repoRoot: dir }).estado, 'ausente');
  });
});

test('omite: manifiesto ilegible y manifiesto sin mapa `volumes` son rojos distintos', () => {
  const roto = arbol(({ fichero }) => fichero('VOLUMES/volumes.json', '{ esto no es json'));
  con(roto, () => {
    assert.equal(censarVolumenes({ repoRoot: roto }).estado, 'ilegible');
    assert.equal(scanVolumenExigeSecreto({ repoRoot: roto }).length, 1);
  });
  const vacio = arbol(({ fichero }) => fichero('VOLUMES/volumes.json', '{"root":"."}'));
  con(vacio, () => {
    assert.equal(censarVolumenes({ repoRoot: vacio }).estado, 'malformado');
    const ofensas = scanVolumenExigeSecreto({ repoRoot: vacio });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /no es un censo limpio, es un censo que no se hizo/);
  });
});

test('omite: el contrato de lectura AUSENTE es rojo — no se puede afirmar lo que no se leyó', () => {
  const dir = arbol(({ dir: d }) => {
    fs.rmSync(path.join(d, 'packages'), { recursive: true, force: true });
  });
  con(dir, () => {
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /Rojo por ausencia/);
  });
});

test('omite: lista de patrones VACÍA — el helper LANZA y el escáner enrojece', () => {
  assert.throws(() => hallazgosEnTexto(VECTORES.jwt, []), /VACÍA/);
  assert.throws(() => hallazgosEnTexto(VECTORES.jwt, null), /no es una lista/);
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/x.json', `${VECTORES.jwt}\n`);
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir, patrones: [] });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /no miré/);
    // lo que NO puede pasar: cero patrones y cero ofensas, que se lee «limpio»
    assert.notDeepEqual(ofensas, []);
  });
});

test('omite: un patrón malformado LANZA en vez de barrerse a sí mismo', () => {
  assert.throws(() => hallazgosEnTexto('x', [{ id: 'roto' }]), /malformado/);
  assert.throws(() => hallazgosEnTexto('x', [null]), /malformado/);
});

test('un fichero GRANDE se inspecciona entero, no se denuncia por grande', () => {
  // Había un tope de 8 MB que denunciaba el fichero en vez de leerlo. El README
  // de este árbol cifra el firehose en 38 MB y `.gitignore:51` da por hecho que
  // ese DISK puede aparecer localmente: el gate enrojecía sobre estado local
  // normal y SIN secretos, por algo que el operador no puede arreglar. Ésa es
  // la presión de desactivación contra la que avisa la cabecera del módulo.
  const relleno = `${'linea de relleno sin nada interesante\n'.repeat(60_000)}`; // ~2,2 MB
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/gordo.log', `${relleno}${VECTORES['token-de-proveedor']}\n${relleno}`);
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /token-de-proveedor/);
    assert.doesNotMatch(ofensas[0].detail, /tope/, 'volvió a haber tope: leer el porqué en TOPE_BYTES');
    // y el número de línea sobrevive al troceado
    assert.equal(ofensas[0].line, 60_001);
  });
});

test('un fichero grande y LIMPIO no inventa hallazgos al trocearlo', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/limpio.log', 'nada que ver aqui, de verdad\n'.repeat(80_000));
  });
  con(dir, () => {
    assert.deepEqual(scanClaveEnVolumen({ repoRoot: dir }), []);
  });
});

test('omite: un árbol de volúmenes SIN ficheros es rojo — «cero barridos» no es «cero secretos»', () => {
  // Modo de fallo natural de `--root`: apuntar a la carpeta de al lado.
  const dir = arbol(({ dir: d }) => {
    fs.rmSync(path.join(d, 'VOLUMES', 'volumes.json'));
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /ni un fichero que barrer/);
  });
});

test('omite: lo que no es fichero ni directorio dentro de un volumen se denuncia', () => {
  const dir = arbol(({ dir: d }) => {
    fs.mkdirSync(path.join(d, 'fuera'), { recursive: true });
    // 'junction' funciona en Windows sin privilegios y en POSIX se ignora el
    // tipo: el enlace se crea igual. Un enlace a ~/.ssh dentro de un volumen es
    // el vector exacto de este WP y saltarlo callando sería fallo en abierto.
    fs.symlinkSync(path.join(d, 'fuera'), path.join(d, 'VOLUMES', 'DISK_09'), 'junction');
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /enlace simbólico/);
  });
});

test('omite: un directorio de los excluidos, DENTRO de un volumen, se denuncia', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/node_modules/paquete/x.json', '{}');
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /no debería existir aquí/);
  });
});

// ---------------------------------------------------------------------------
// 3 bis · La excepción prohibida. «Sin razón es un agujero con permiso»; aquí
//         ni siquiera con razón: la doctrina citada dice «sin excepción».
// ---------------------------------------------------------------------------

test('omite: una excepción anotada para esta regla NO exime — es ella la ofensa', () => {
  const intrusa = {
    path: 'VOLUMES/DISK_09/DEMO/x.json',
    rule: 'clave-en-volumen',
    reason: 'motivo perfectamente redactado, y aun así no vale'
  };
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/x.json', `${VECTORES['ssb-privada']}\n`);
  });
  EXCEPTIONS.push(intrusa);
  try {
    con(dir, () => {
      const ofensas = scanClaveEnVolumen({ repoRoot: dir });
      // el hallazgo sigue en pie Y la excepción se denuncia: 2, no 0
      assert.equal(ofensas.length, 2, JSON.stringify(ofensas, null, 2));
      const denuncia = ofensas.find((o) => o.path === 'scripts/gates/exceptions.mjs');
      assert.ok(denuncia, 'la excepción prohibida no se denunció');
      assert.match(denuncia.detail, /NO admite excepción/);
    });
  } finally {
    EXCEPTIONS.splice(EXCEPTIONS.indexOf(intrusa), 1);
  }
  assert.equal(
    EXCEPTIONS.includes(intrusa),
    false,
    'el test dejó sucia la lista real de excepciones'
  );
});

test('la prohibición de eximir cubre LAS TRES reglas, no sólo una', () => {
  // Cobertura desigual: sólo `clave-en-volumen` tenía vector rojo. Una regla
  // cuya prohibición no está probada es una regla cuya prohibición nadie sabe
  // si funciona — y son las tres las que la doctrina declara sin excepción.
  const casos = [
    {
      regla: 'volumen-exige-secreto',
      escanea: (dir) => scanVolumenExigeSecreto({ repoRoot: dir })
    },
    {
      regla: 'contexto-imagen',
      escanea: (dir) => scanContextoImagen({ repoRoot: dir })
    }
  ];
  for (const { regla, escanea } of casos) {
    const intrusa = { path: 'VOLUMES/lo-que-sea', rule: regla, reason: 'motivo impecable, e igual de inválido' };
    const dir = arbol(() => {});
    EXCEPTIONS.push(intrusa);
    try {
      con(dir, () => {
        const denuncia = escanea(dir).find((o) => o.path === 'scripts/gates/exceptions.mjs');
        assert.ok(denuncia, `la excepción prohibida para \`${regla}\` no se denunció`);
        assert.match(denuncia.detail, /NO admite excepción/);
      });
    } finally {
      EXCEPTIONS.splice(EXCEPTIONS.indexOf(intrusa), 1);
    }
    assert.equal(EXCEPTIONS.includes(intrusa), false, 'el test dejó sucia la lista real');
  }
});

test('omite: una lista de excepciones INSERVIBLE no se lee como «nadie eximió nada»', () => {
  // La rama que nunca se recorre en producción y que por eso hay que poder
  // demostrar: si `EXCEPTIONS` dejara de ser una lista, el gate no puede
  // concluir «limpio». Un módulo AUSENTE es otra cosa y ya es ruidoso solo: el
  // `import` estático revienta y `npm run gates` muere.
  // `undefined` NO va en esta lista y conviene decir por qué: un parámetro por
  // defecto se dispara justo con `undefined`, así que omitir el argumento es
  // «usa la lista real», no «no hay lista». Meterlo aquí probaría lo contrario
  // de lo que dice el nombre del test.
  for (const inservible of [null, {}, 'no soy una lista', 42]) {
    const motivos = motivosDeExcepcionProhibida('clave-en-volumen', inservible);
    assert.equal(motivos.length, 1, `se tragó una lista ${JSON.stringify(inservible)}`);
    assert.match(motivos[0], /hostil-omite/);
  }
  // y con la lista real, silencio: hoy nadie eximió nada
  assert.deepEqual(motivosDeExcepcionProhibida('volumen-exige-secreto'), []);
});

test('contraprueba: una excepción de OTRA regla no ensucia estas', () => {
  const ajena = { path: 'packages/x/src/y.mjs', rule: 'ports', reason: 'fallback pre-U00 de mentira' };
  EXCEPTIONS.push(ajena);
  try {
    assert.deepEqual(scanClaveEnVolumen({ repoRoot: REPO_ROOT }), []);
    assert.deepEqual(scanVolumenExigeSecreto({ repoRoot: REPO_ROOT }), []);
  } finally {
    EXCEPTIONS.splice(EXCEPTIONS.indexOf(ajena), 1);
  }
});

test('hoy la lista real de excepciones no exime ninguna de las tres reglas', () => {
  // La afirmación «cero excepciones» del reporte, medida y no prometida.
  const mias = new Set(['clave-en-volumen', 'volumen-exige-secreto']);
  mias.add('contexto-imagen');
  assert.deepEqual(
    EXCEPTIONS.filter((ex) => mias.has(ex.rule)),
    [],
    'alguien anotó una excepción para el invariante de secretos'
  );
});

// ---------------------------------------------------------------------------
// 4 · CENSO DE MUTACIÓN. Cada patrón, desactivado, deja escapar SU caso.
// ---------------------------------------------------------------------------

test('censo de mutación: matar un patrón deja pasar su vector, y sólo el suyo', () => {
  /** @type {string[]} */
  const inmortales = [];
  for (const patron of PATRONES_IDENTIDAD) {
    const vector = VECTORES[patron.id];
    const vivo = hallazgosEnTexto(vector);
    assert.ok(
      vivo.some((h) => h.id === patron.id),
      `con todos los patrones vivos, el vector de ${patron.id} no lo caza NADIE: el vector es malo`
    );
    const mutado = PATRONES_IDENTIDAD.filter((p) => p.id !== patron.id);
    const muerto = hallazgosEnTexto(vector, mutado);
    if (muerto.length !== 0) {
      inmortales.push(
        `${patron.id}: desactivado, su vector sigue cazado por [${muerto.map((h) => h.id).join(', ')}] — ` +
          'o el patrón es redundante o el vector no es suyo'
      );
    }
  }
  assert.deepEqual(
    inmortales,
    [],
    'un patrón que al matarlo no cambia nada no vigila nada:\n' + inmortales.join('\n')
  );
});

test('censo de mutación: cada patrón, desactivado, deja pasar el vector POR EL GATE', () => {
  // El censo de arriba mide el helper puro. Éste mide el camino real: fichero
  // sembrado en un volumen y escáner completo. Si un patrón sólo estuviera
  // cableado en el helper y no en el escáner, aquí se vería.
  for (const patron of PATRONES_IDENTIDAD) {
    const dir = arbol(({ fichero }) => {
      fichero('VOLUMES/DISK_09/DEMO/vector.txt', `${VECTORES[patron.id]}\n`);
    });
    con(dir, () => {
      assert.equal(
        scanClaveEnVolumen({ repoRoot: dir }).length,
        1,
        `el gate no caza el vector de ${patron.id}`
      );
      const mutado = PATRONES_IDENTIDAD.filter((p) => p.id !== patron.id);
      assert.equal(
        scanClaveEnVolumen({ repoRoot: dir, patrones: mutado }).length,
        0,
        `desactivado ${patron.id}, el gate sigue rojo: el patrón no es quien caza su caso`
      );
    });
  }
});

test('censo de mutación: matar una ruta obligatoria del contexto deja pasar su caso', () => {
  // El equivalente para la regla de imagen: cada ruta de
  // RUTAS_FUERA_DEL_CONTEXTO tiene que ser la única responsable de su ofensa.
  const rutas = ['.env', 'VOLUMES/DISK_01', 'VOLUMES/DISK_04'];
  for (const ruta of rutas) {
    const otras = rutas.filter((r) => r !== ruta);
    const dir = arbol(({ fichero }) => {
      fichero('Dockerfile', 'FROM node:22\n');
      fichero('.dockerignore', `${otras.join('\n')}\n`);
    });
    con(dir, () => {
      const ofensas = scanContextoImagen({ repoRoot: dir });
      assert.equal(ofensas.length, 1, `omitir ${ruta} debería dar exactamente una ofensa`);
      assert.match(ofensas[0].detail, new RegExp(ruta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
  }
});

// ---------------------------------------------------------------------------
// 4 bis · EL CAMINO DEL ROOT DE OPERADOR, DE PUNTA A PUNTA.
//
// Es la mitigación que el módulo y `VOLUMES/README.md` le ofrecen al operador
// para el límite grande —el árbol de datos vivo vive fuera del repo—. Antes se
// afirmaba sin ejercerse: `--root` sólo estaba cableado al censo, que es CA2, y
// el barrido de CONTENIDO no tenía CLI. Resultado: respondía VERDE sobre un
// root con una clave sembrada. Un límite declarado sobre una mitigación que no
// existe no es un límite declarado. Estos tests recorren el CLI de verdad.
// ---------------------------------------------------------------------------

const CLI = path.join(REPO_ROOT, 'scripts', 'gates', 'claves.mjs');

/** @param {string[]} args */
function cli(args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

/** Un root de operador: es YA el árbol de volúmenes, no tiene `VOLUMES/` dentro. */
function rootDeOperador(escribir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeus-u231-root-'));
  const fichero = (rel, contenido) => {
    const abs = path.join(dir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, contenido);
  };
  fichero('volumes.json', JSON.stringify({ volumes: { ssb: { disk: 'DISK_04', path: 'DISK_04/SSB' } } }, null, 2));
  escribir({ dir, fichero });
  return dir;
}

test('CLI: `--barrido --root` encuentra la clave sembrada en un root de operador', () => {
  const root = rootDeOperador(({ fichero }) => {
    fichero('DISK_04/SSB/secret', `${VECTORES['ssb-privada']}\n`);
  });
  con(root, () => {
    const { code, out } = cli(['--barrido', '--root', root]);
    assert.equal(code, 1, `debía salir 1 y salió ${code}:\n${out}`);
    assert.match(out, /1 hallazgo/);
    assert.match(out, /DISK_04\/SSB\/secret/);
    assert.match(out, /ssb-privada/);
    // y la ruta sale relativa al root apuntado, no como `../../../Users/…`
    assert.doesNotMatch(out, /\.\.\/\.\.\//, 'rutas en `../../..`: el informe no sabe contra qué imprime');
  });
});

test('CLI: `--root` a secas hace censo Y barrido', () => {
  const root = rootDeOperador(({ fichero }) => {
    fichero('DISK_04/SSB/secret', `${VECTORES['ssb-privada']}\n`);
  });
  con(root, () => {
    const { code, out } = cli(['--root', root]);
    assert.equal(code, 1, out);
    assert.match(out, /volumen\s+\|/, 'falta el censo');
    assert.match(out, /barrido de identidad/, 'falta el barrido');
  });
});

test('CLI: un root de operador LIMPIO sale 0 y lo dice', () => {
  const root = rootDeOperador(({ fichero }) => {
    fichero('DISK_04/SSB/registry.json', '{"entradas": []}\n');
  });
  con(root, () => {
    const { code, out } = cli(['--barrido', '--root', root]);
    assert.equal(code, 0, out);
    assert.match(out, /limpio \(0 hallazgos\)/);
  });
});

test('CLI: `--root` sin valor contesta con el uso, no con una traza', () => {
  const { code, out } = cli(['--censo', '--root']);
  assert.equal(code, 2, out);
  assert.match(out, /`--root` necesita una ruta/);
  assert.doesNotMatch(out, /TypeError|ERR_INVALID_ARG_TYPE/, 'una traza de node no es un mensaje de uso');
});

test('CLI: `--root` a una ruta que no existe se queja en vez de barrer la nada', () => {
  const { code, out } = cli(['--barrido', '--root', path.join(os.tmpdir(), 'no-existe-u231-xyz')]);
  assert.equal(code, 2, out);
  assert.match(out, /no existe/);
});

test('CLI: sin banderas, imprime el uso y sale 2', () => {
  const { code, out } = cli([]);
  assert.equal(code, 2);
  assert.match(out, /--barrido/, 'el uso tiene que anunciar el barrido, no sólo el censo');
});

// ---------------------------------------------------------------------------
// 4 ter · Higiene del propio gate
// ---------------------------------------------------------------------------

test('ningún fichero de gates lleva espacios en blanco irregulares', () => {
  // `npm run lint` no se puede correr aquí (este worktree no tiene
  // node_modules) y por ese hueco se coló un U+200B metido dentro de un JSDoc
  // para que la secuencia de comodines no cerrase el comentario: invisible al
  // leer, y `no-irregular-whitespace` —que es ERROR en la config recomendada—
  // sobre el único fichero de `scripts/gates/` que rompía la línea base.
  // Este guardián no necesita node_modules.
  // Escrito en ESCAPES y no en caracteres literales, por dos razones: uno,
  // ponerlos a pelo mete en este fichero justo lo que el test persigue; y dos,
  // U+2028 es terminador de linea para el parser, asi que la primera version de
  // esta linea —con los caracteres literales— ni siquiera compilaba. El defecto
  // que caza es de la misma clase que el que cometio al nacer.
  // Alternancia y no clase de caracteres: `no-misleading-character-class` marca
  // como error meter un ZWJ dentro de un `[...]` porque puede unir lo de al lado.
  // Lo dijo el propio lint prestado, sobre este mismo guardian.
  const RAROS = /\u200b|\u200c|\u200d|\ufeff|\u00a0|\u2007|\u202f|\u2028|\u2029/;
  /** @type {string[]} */
  const ofensas = [];
  for (const dir of ['scripts/gates', 'test/gates']) {
    const base = path.join(REPO_ROOT, dir);
    for (const nombre of fs.readdirSync(base)) {
      if (!nombre.endsWith('.mjs')) continue;
      const rel = `${dir}/${nombre}`;
      fs.readFileSync(path.join(base, nombre), 'utf8')
        .split('\n')
        .forEach((l, i) => {
          if (!RAROS.test(l)) return;
          const col = l.search(RAROS);
          ofensas.push(`${rel}:${i + 1}:${col + 1} U+${l.codePointAt(col).toString(16).toUpperCase()}`);
        });
    }
  }
  assert.deepEqual(ofensas, [], `espacio en blanco irregular (rompe \`npm run lint\`):\n${ofensas.join('\n')}`);
});

test('un id de volumen con metacaracteres no tumba las diez reglas', () => {
  // `new RegExp(\`"${id}"…\`)` sin escapar: un volumen llamado `demo(` lanza
  // SyntaxError y se lleva por delante el arnés entero. Es el fallo en abierto
  // contra el que argumenta el propio módulo, cometido dentro de él.
  const dir = arbol(({ fichero }) => {
    fichero(
      'VOLUMES/volumes.json',
      JSON.stringify({ volumes: { 'demo(': { path: 'D/X' }, 'a[b': { path: 'D/Y' }, 'c*d': { path: 'D/Z' } } }, null, 2)
    );
  });
  con(dir, () => {
    assert.doesNotThrow(() => censarVolumenes({ repoRoot: dir }));
    const censo = censarVolumenes({ repoRoot: dir });
    assert.deepEqual(censo.filas.map((f) => f.id), ['demo(', 'a[b', 'c*d']);
    assert.doesNotThrow(() => runAllGates({ repoRoot: dir, files: [] }));
  });
});

test('un directorio ilegible NO se traga en silencio al buscar recetas de imagen', () => {
  // Asimétrico con `recorrerVolumen`, que denuncia toda rareza: `catch { return }`
  // convierte «no pude mirar» en «no hay nada».
  const inexistente = path.join(os.tmpdir(), 'u231-no-existe-jamas');
  const { recetas, rarezas } = buscarDockerfiles(inexistente);
  assert.deepEqual(recetas, []);
  assert.equal(rarezas.length, 1, JSON.stringify(rarezas));
  assert.match(rarezas[0].detail, /ilegible/);
});

test('el censo ve las cuatro formas de leer el entorno, no sólo la literal', () => {
  const dir = arbol(({ fichero }) => {
    fichero(
      'packages/engine/presets-sdk/src/volumes/resolve.mjs',
      'export const a = () => process.env.ZEUS_VOLUMES_ROOT;\n' +
        "export const b = () => process.env['ZEUS_OTRO_PATH'];\n" +
        'export const c = () => process.env?.ZEUS_TERCER_TOKEN;\n' +
        'const { ZEUS_CUARTO_SECRET, ZEUS_QUINTO_PATH } = process.env;\n' +
        'export const d = (k) => process.env[k];\n'
    );
    // y un submódulo, y un .ts: el censo plano y sólo-.mjs no los veía
    fichero('packages/engine/presets-sdk/src/volumes/sub/hondo.ts', 'export const e = () => process.env.ZEUS_HONDO_PASSWORD;\n');
  });
  con(dir, () => {
    const censo = censarVolumenes({ repoRoot: dir });
    const vistos = censo.envsDeCodigo.map((e) => `${e.name}:${e.clase}`).sort();
    assert.deepEqual(vistos, [
      'ZEUS_CUARTO_SECRET:identidad',
      'ZEUS_HONDO_PASSWORD:identidad',
      'ZEUS_OTRO_PATH:localizador',
      'ZEUS_QUINTO_PATH:localizador',
      'ZEUS_TERCER_TOKEN:identidad',
      'ZEUS_VOLUMES_ROOT:localizador',
      '[k]:dinamico'
    ]);
    assert.equal(censo.enumerable, false);
    // las tres identidades son ofensa
    const ofensas = scanVolumenExigeSecreto({ repoRoot: dir });
    assert.equal(ofensas.length, 3, JSON.stringify(ofensas, null, 2));
  });
});

// ---------------------------------------------------------------------------
// 5 · Cableado: las ofensas llegan al informe de `npm run gates`
// ---------------------------------------------------------------------------

test('las tres reglas tienen cubo propio en el informe y las ofensas llegan a él', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/x.json', `${VECTORES['pem-privada']}\n`);
    fichero('Dockerfile', 'FROM node:22\n');
    fichero(
      'VOLUMES/volumes.json',
      JSON.stringify({ volumes: { d: { path: 'D', source: { remotePath: '${MI_API_KEY}' } } } }, null, 2)
    );
  });
  con(dir, () => {
    const { ok, byRule } = runAllGates({ repoRoot: dir, files: [] });
    assert.equal(ok, false, 'el arnés completo no vio ninguna de las tres siembras');
    assert.equal(byRule['clave-en-volumen'].length, 1);
    assert.ok(byRule['volumen-exige-secreto'].length >= 1);
    assert.ok(byRule['contexto-imagen'].length >= 1);
  });
});
