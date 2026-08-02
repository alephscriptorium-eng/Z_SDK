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
import { REPO_ROOT, runAllGates } from '../../scripts/gates/scan.mjs';
import { EXCEPTIONS } from '../../scripts/gates/exceptions.mjs';
import {
  PATRONES_IDENTIDAD,
  TOPE_BYTES,
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
  jwt: `authorization = ${'ey'}${'J'}${'NOESUNTOKENSINTETICO'}.${'ZWpwbG9zaW50ZXRpY28'}.${'firma-sintetica-invalida'}`,
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

test('contraprueba: un env LOCALIZADOR (root, path, url) no es una identidad', () => {
  const censo = censarVolumenes({ repoRoot: REPO_ROOT });
  assert.deepEqual(
    censo.envsDeCodigo.map((e) => `${e.name}:${e.clase}`),
    ['ZEUS_VOLUMES_ROOT:localizador'],
    'el contrato de lectura real cambió de superficie de env; recontar'
  );
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

test('CA rojo: .dockerignore que excluye y luego RE-INCLUYE con `!` (la última gana)', () => {
  const dir = arbol(({ fichero }) => {
    fichero('Dockerfile', 'FROM node:22\n');
    fichero('.dockerignore', '.env\nVOLUMES/**\n!VOLUMES/DISK_01/semillas\nVOLUMES/DISK_04\n');
  });
  con(dir, () => {
    const ofensas = scanContextoImagen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /RE-INCLUYE/);
    assert.match(ofensas[0].detail, /DISK_01/);
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

test('omite: fichero por encima del tope NO se salta en silencio — se denuncia', () => {
  const dir = arbol(({ fichero }) => {
    fichero('VOLUMES/DISK_09/DEMO/gordo.bin', 'x'.repeat(TOPE_BYTES + 1));
  });
  con(dir, () => {
    const ofensas = scanClaveEnVolumen({ repoRoot: dir });
    assert.equal(ofensas.length, 1, JSON.stringify(ofensas, null, 2));
    assert.match(ofensas[0].detail, /tope de inspección/);
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
