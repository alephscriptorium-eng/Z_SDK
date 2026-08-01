/**
 * WP-U252 — guardián: la suite de gates NO muta el árbol de trabajo.
 *
 * Por qué existe. `test/gates/matriz-51.test.mjs` renombaba fuera de sitio el
 * manifiesto rastreado `packages/mesh/blob-sync-harness/package.json` y plantaba
 * una pieza fantasma bajo `packages/mesh/` para sus fail-probes, revirtiendo
 * ambas en `finally`. Como `node --test` corre los ficheros EN PARALELO, durante
 * ~1 s ese manifiesto no estaba en el disco y `test/gates/gates.test.mjs:34`
 * —que sí mira el árbol vivo— lo veía ausente y fallaba. El defecto estuvo
 * latente meses: nadie observaba esa ausencia. Arreglar la mutación sin dejar
 * un observador puesto deja el repo a una línea de recaer.
 *
 * Dos guardianes, con alcances distintos y declarados:
 *
 *   1. ESTÁTICO — lee el fuente de cada `test/gates/*.test.mjs` y busca la
 *      OPERACIÓN (escribir, renombrar, borrar, crear) sobre una ruta anclada al
 *      repo, propagando taint por asignaciones. Determinista y sin ventana
 *      temporal, pero rodeable: ver LÍMITES abajo, y los vectores de fuga están
 *      escritos y aseverados como fuga, no ocultos.
 *
 *   2. DINÁMICO — corre el resto de la suite en un hijo y censa el conjunto de
 *      lectura del gate mientras corre. Cachea el defecto por su EFECTO, así que
 *      no lo rodea ninguna indirección de código; a cambio muestrea, y una
 *      mutación más corta que su intervalo puede escapársele. El test declara
 *      cuántas muestras tomó en vez de afirmar que vigiló «siempre».
 *
 * Ninguno de los dos es completo por separado. Juntos cubren la fuga del otro.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { CAZADOS, LIMPIOS, FUGAS } from './fixtures/vectores-mutacion-u252.mjs';

const AQUI = fileURLToPath(import.meta.url);
const DIR_GATES = path.dirname(AQUI);
const REPO = path.resolve(DIR_GATES, '../..');

// ---------------------------------------------------------------------------
// 1 · Guardián estático: la operación, no el nombre de la función
// ---------------------------------------------------------------------------

/** APIs de `node:fs` que ESCRIBEN. Se reconocen como `fs.X(` y como `X(` suelto
 *  (import con nombre), porque el import es un detalle de estilo, no una excusa. */
const MUTADORES = [
  'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'writev', 'writevSync',
  'rename', 'renameSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync', 'unlink', 'unlinkSync',
  'mkdir', 'mkdirSync', 'mkdtemp', 'mkdtempSync', 'cp', 'cpSync', 'copyFile', 'copyFileSync',
  'symlink', 'symlinkSync', 'link', 'linkSync', 'truncate', 'truncateSync', 'ftruncateSync',
  'chmod', 'chmodSync', 'chown', 'chownSync', 'utimes', 'utimesSync', 'lutimesSync',
  'createWriteStream', 'open', 'openSync', 'opendirSync'
];

/** Operaciones cuyos DOS primeros argumentos son rutas (origen y destino). En
 *  el resto sólo el primero lo es. */
const DOS_RUTAS = new Set([
  'rename', 'renameSync', 'cp', 'cpSync', 'copyFile', 'copyFileSync',
  'link', 'linkSync', 'symlink', 'symlinkSync'
]);

/** Expresiones que anclan una ruta al repo de trabajo. `mkdtempSync` sobre
 *  cualquiera de éstas NO es temporal: es un directorio dentro del repo. */
const SEMILLAS = ['REPO_ROOT', 'import.meta.url', 'import.meta.dirname', 'import.meta.filename',
  '__dirname', '__filename', 'process.cwd()'];

/** Subcomandos que hacen que un `git`/`npm` invocado desde un test escriba. */
const VERBOS_ESCRITORES = [
  ['git', /\b(checkout|apply|add|rm|mv|stash|reset|clean|restore|commit|switch)\b/],
  ['npm', /\b(install|ci|link|dedupe|prune|pkg)\b/]
];

/** Primeros segmentos rastreados por git en la raíz: el vocabulario de una ruta
 *  literal «del repo». Derivado del índice, no transcrito a mano. */
function segmentosRaizRastreados() {
  return new Set(
    execFileSync('git', ['ls-files', '-z'], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\0')
      .filter(Boolean)
      .map((p) => p.split('/')[0])
  );
}

/** Quita comentarios conservando longitud Y saltos de línea (si no, los números
 *  de línea del informe apuntarían a otro sitio del fichero). */
function sinComentarios(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:\\])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/**
 * Borra los bloques `{…}` de objeto literal, respetando `${…}` de plantilla.
 * Sin esto, un `{ cwd: REPO_ROOT }` de una llamada de SÓLO LECTURA anclaría su
 * resultado —`const out = execFileSync('git', ['cat-file'…], { cwd: REPO_ROOT })`
 * marcaría `out`, que es CONTENIDO, no ruta— y el guardián acabaría marcando
 * arnés correcto. El repo es el `cwd` de casi todo; no es una ruta de destino.
 */
function sinObjetosLiterales(texto) {
  let salida = '';
  let prof = 0;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '{' && texto[i - 1] !== '$') {
      prof++;
      continue;
    }
    if (c === '}' && prof > 0) {
      prof--;
      continue;
    }
    if (prof === 0) salida += c;
  }
  return salida;
}

/**
 * Parte una lista de argumentos por las comas de nivel 0.
 * @param {string} args @returns {string[]}
 */
function porArgumentos(args) {
  const partes = [];
  let prof = 0;
  let actual = '';
  for (const c of args) {
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') prof--;
    if (c === ',' && prof === 0) {
      partes.push(actual);
      actual = '';
      continue;
    }
    actual += c;
  }
  if (actual.trim()) partes.push(actual);
  return partes;
}

/**
 * Desde `desde`, devuelve el texto hasta cerrar el paréntesis/corchete abierto.
 * @param {string} src @param {number} desde índice del `(` @returns {string}
 */
function argumentos(src, desde) {
  let prof = 0;
  for (let i = desde; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') {
      prof--;
      if (prof === 0) return src.slice(desde + 1, i);
    }
  }
  return src.slice(desde + 1);
}

/**
 * Lado derecho de una asignación: hasta `;` o fin de línea a profundidad 0.
 * @param {string} src @param {number} desde índice del `=`
 */
function ladoDerecho(src, desde) {
  let prof = 0;
  for (let i = desde + 1; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') prof++;
    else if (c === ')' || c === ']' || c === '}') {
      if (prof === 0) return src.slice(desde + 1, i);
      prof--;
    } else if (prof === 0 && (c === ';' || c === '\n')) return src.slice(desde + 1, i);
  }
  return src.slice(desde + 1);
}

/**
 * Trozos de una expresión donde un valor se usa CONSTRUYENDO una ruta.
 *
 * Sin este filtro el ancla se propagaría por cualquier llamada que reciba el
 * repo —`collectManifests(REPO_ROOT)` devuelve rutas RELATIVAS— y como el
 * análisis es por nombre y no por ámbito, un `rel` de un `for…of` contagiaría
 * al `rel` que es parámetro de otra función, y de ahí a medio fichero. Medido:
 * esa cascada marcaba 11 escrituras legítimas de `licencia.test.mjs` sobre sus
 * árboles temporales. Una ruta nace de `path.*`, de `fileURLToPath`, de un
 * alias directo o de pegar cadenas; no de una llamada cualquiera.
 * @param {string} rhs @returns {string[]}
 */
function fragmentosDeRuta(rhs) {
  const frags = [];
  const t = rhs.trim();
  if (/^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(t)) frags.push(t); // alias directo
  const re = /\b(?:path\s*\.\s*(?:join|resolve|normalize|dirname)|fileURLToPath)\s*\(/g;
  for (let m; (m = re.exec(rhs)); ) frags.push(argumentos(rhs, m.index + m[0].length - 1));
  for (const m of rhs.matchAll(/`[^`]*`/g)) frags.push(m[0]); // plantilla
  if (/['"`]\s*\+|\+\s*['"`]/.test(rhs)) frags.push(rhs); // concatenación de cadenas
  return frags;
}

/**
 * Identificadores cuyo valor procede (directa o transitivamente) de una
 * SEMILLA. Punto fijo: `const a = REPO_ROOT` → `const b = path.join(a,…)` →
 * `` const c = `${b}.bak` `` quedan los tres marcados.
 * @param {string} src @returns {Set<string>}
 */
function identificadoresAnclados(src) {
  const anclados = new Set();
  const asignaciones = [];
  const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;
  for (let m; (m = re.exec(src)); ) {
    asignaciones.push({
      nombre: m[1],
      rhs: sinObjetosLiterales(ladoDerecho(src, m.index + m[0].length - 1))
    });
  }
  // `for (const d of dirs)` propaga el ancla del iterable a la variable: si no,
  // bastaría meter la ruta en un array para cruzar el guardián.
  const reFor = /for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+of\s+([^)]+)\)/g;
  for (let m; (m = reFor.exec(src)); ) {
    asignaciones.push({ nombre: m[1], rhs: sinObjetosLiterales(m[2]) });
  }
  for (let pasada = 0; pasada < asignaciones.length + 1; pasada++) {
    let creció = false;
    for (const { nombre, rhs } of asignaciones) {
      if (anclados.has(nombre)) continue;
      const frags = fragmentosDeRuta(rhs);
      const toca = frags.some(
        (f) =>
          SEMILLAS.some((s) => f.includes(s)) ||
          [...anclados].some((a) => new RegExp(`(^|[^\\w$])${a}([^\\w$]|$)`).test(f))
      );
      if (toca) {
        anclados.add(nombre);
        creció = true;
      }
    }
    if (!creció) break;
  }
  return anclados;
}

/**
 * Ofensas de un fuente: operación de escritura sobre ruta anclada al repo.
 * @param {string} fuente contenido
 * @param {string} etiqueta nombre para el informe
 * @param {Set<string>} segmentosRaiz
 * @returns {{ etiqueta: string, linea: number, op: string, motivo: string, texto: string }[]}
 */
export function ofensasDeFuente(fuente, etiqueta, segmentosRaiz) {
  const src = sinComentarios(fuente);
  const anclados = identificadoresAnclados(src);
  const ofensas = [];
  const linea = (i) => src.slice(0, i).split('\n').length;
  const recorta = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 110);

  /** ¿el texto de los argumentos apunta al árbol de trabajo? */
  const apuntaAlRepo = (args) => {
    for (const s of SEMILLAS) if (args.includes(s)) return `ancla ${s}`;
    for (const a of anclados) {
      if (new RegExp(`(^|[^\\w$])${a}([^\\w$]|$)`).test(args)) return `identificador anclado \`${a}\``;
    }
    // Ruta literal relativa a la raíz del repo: 'packages/…', 'plan/…', …
    for (const m of args.matchAll(/['"`]([^'"`\n]+)['"`]/g)) {
      const seg = m[1].split('/')[0];
      if (m[1].includes('/') && segmentosRaiz.has(seg)) return `ruta literal del repo \`${m[1]}\``;
    }
    return null;
  };

  for (const op of MUTADORES) {
    const re = new RegExp(`(?:\\bfs(?:p|Promises)?\\s*\\.\\s*|(?:^|[^\\w$.]))${op}\\s*\\(`, 'g');
    for (let m; (m = re.exec(src)); ) {
      const abre = src.indexOf('(', m.index + m[0].length - 1);
      // Sólo los argumentos que SON rutas. El resto es contenido y opciones:
      // mirarlos convertiría cada `{ cwd: REPO_ROOT }` en un falso positivo.
      const rutas = porArgumentos(argumentos(src, abre))
        .slice(0, DOS_RUTAS.has(op) ? 2 : 1)
        .join(', ');
      const motivo = apuntaAlRepo(rutas);
      if (motivo) ofensas.push({ etiqueta, linea: linea(m.index), op, motivo, texto: recorta(rutas) });
    }
  }

  // Escritura por delegación: un `git`/`npm` con subcomando que escribe.
  const reSpawn = /\b(?:execFileSync|execFile|execSync|exec|spawnSync|spawn)\s*\(/g;
  for (let m; (m = reSpawn.exec(src)); ) {
    const args = argumentos(src, m.index + m[0].length - 1);
    for (const [bin, verbos] of VERBOS_ESCRITORES) {
      if (!new RegExp(`['"\`]${bin}(\\.cmd|\\.exe)?['"\`]`).test(args)) continue;
      if (!verbos.test(args)) continue;
      ofensas.push({
        etiqueta,
        linea: linea(m.index),
        op: `spawn ${bin}`,
        motivo: `subcomando de ${bin} que escribe`,
        texto: recorta(args)
      });
    }
  }
  return ofensas.sort((a, b) => a.linea - b.linea);
}

/** Ficheros de la suite que `npm run test:gates` glob-ea. */
function ficherosDeLaSuite() {
  return fs
    .readdirSync(DIR_GATES)
    .filter((f) => f.endsWith('.test.mjs'))
    .sort()
    .map((f) => path.join(DIR_GATES, f));
}

test('guardián estático: ningún test de gates escribe sobre el árbol de trabajo', () => {
  const segmentosRaiz = segmentosRaizRastreados();
  const ficheros = ficherosDeLaSuite();
  assert.ok(ficheros.length >= 3, `la suite debe tener ficheros que vigilar: ${ficheros.length}`);

  const ofensas = ficheros.flatMap((abs) =>
    ofensasDeFuente(fs.readFileSync(abs, 'utf8'), path.relative(REPO, abs).split(path.sep).join('/'), segmentosRaiz)
  );
  assert.deepEqual(
    ofensas,
    [],
    `un test de gates volvió a escribir sobre el árbol de trabajo. Con node --test\n` +
      `en paralelo eso es una carrera para toda otra suite que lea esa ruta.\n` +
      `Móntalo sobre un árbol temporal (ver conArbolCommiteado en matriz-51.test.mjs):\n` +
      ofensas.map((o) => `  ${o.etiqueta}:${o.linea} · ${o.op} · ${o.motivo} · ${o.texto}`).join('\n')
  );
});

// --- El guardián atacado por quien lo escribe. Un guardián que nunca se ha
// --- puesto rojo es decoración: aquí están los vectores, y los que ESCAPAN
// --- están escritos como que escapan.

test('el guardián estático se pone rojo con el defecto histórico real (HEAD~)', () => {
  // Vector no sintético: el propio fichero que causó el bloqueante, tal y como
  // estaba commiteado antes de este WP. Si el guardián no lo caza, no sirve.
  const historico = execFileSync(
    'git',
    ['show', '28397b8:test/gates/matriz-51.test.mjs'],
    { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  const ofensas = ofensasDeFuente(historico, 'matriz-51.test.mjs@28397b8', segmentosRaizRastreados());
  const ops = ofensas.map((o) => o.op);
  assert.ok(ofensas.length >= 3, `esperaba cazar el defecto histórico: ${JSON.stringify(ofensas, null, 2)}`);
  assert.ok(ops.includes('renameSync'), `el renombrado del manifiesto rastreado debe salir: ${ops.join(', ')}`);
  assert.ok(ops.includes('mkdirSync'), `la pieza fantasma debe salir: ${ops.join(', ')}`);
  // y la indirección por variable —`const manifest = path.join(REPO_ROOT,…)`—
  // es justo lo que un scan de texto ingenuo se traga.
  assert.ok(ofensas.some((o) => /identificador anclado/.test(o.motivo)));
});

test('el guardián estático caza los rodeos que sé rodear', () => {
  const segmentosRaiz = segmentosRaizRastreados();
  const caza = (src) => ofensasDeFuente(src, 'sintetico.mjs', segmentosRaiz);
  for (const [nombre, src] of CAZADOS) {
    assert.ok(caza(src).length >= 1, `vector NO cazado: ${nombre}\n${src}`);
  }
  // Contraprueba: lo legítimo no se marca. Un guardián que también pinta de
  // rojo el arnés correcto obliga a desactivarlo, que es peor que no tenerlo.
  for (const [nombre, src] of LIMPIOS) {
    assert.deepEqual(caza(src), [], `falso positivo en: ${nombre}`);
  }
});

test('LÍMITES declarados del guardián estático: por dónde SÍ se le escapa', () => {
  const segmentosRaiz = segmentosRaizRastreados();
  // Se asevera que NO los caza para que la afirmación del guardián no sea más
  // ancha que su evidencia — y para que quien cierre uno encuentre aquí el
  // test que tiene que dar la vuelta. El guardián dinámico sí los ve.
  for (const [nombre, src] of FUGAS) {
    assert.deepEqual(
      ofensasDeFuente(src, 'sintetico.mjs', segmentosRaiz),
      [],
      `este vector ya NO se escapa — actualiza LÍMITES: ${nombre}`
    );
  }
});

// ---------------------------------------------------------------------------
// 2 · Guardián dinámico: el efecto, observado mientras la suite corre
// ---------------------------------------------------------------------------

/**
 * Censo del conjunto de lectura del gate: existencia + tamaño + mtime de cada
 * manifiesto rastreado, más el contenido de los directorios de nivel 1 bajo los
 * globs de `workspaces` (para ver aparecer una pieza fantasma). Es el alcance
 * declarado: exactamente donde una mutación provoca la carrera que motivó el WP.
 * @param {string[]} manifiestos @param {string[]} bases @returns {string}
 */
function censar(manifiestos, bases) {
  const partes = [];
  for (const base of bases) {
    let entradas = [];
    try {
      entradas = fs.readdirSync(path.join(REPO, base)).sort();
    } catch {
      entradas = ['<ausente>'];
    }
    partes.push(`${base}/[${entradas.join(',')}]`);
  }
  for (const rel of manifiestos) {
    try {
      const s = fs.statSync(path.join(REPO, rel));
      partes.push(`${rel}:${s.size}:${s.mtimeMs}`);
    } catch {
      partes.push(`${rel}:AUSENTE`);
    }
  }
  return partes.join('\n');
}

test(
  'guardián dinámico: el árbol no se mueve mientras la suite de gates corre',
  { timeout: 300_000 },
  async () => {
    const rastreados = execFileSync('git', ['ls-files', '-z'], {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    })
      .split('\0')
      .filter(Boolean);
    const manifiestos = rastreados.filter((p) => p === 'package.json' || p.endsWith('/package.json'));
    const raiz = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));
    const bases = (Array.isArray(raiz.workspaces) ? raiz.workspaces : [])
      .filter((g) => g.endsWith('/*'))
      .map((g) => g.slice(0, -2));
    assert.ok(manifiestos.length >= 50 && bases.length >= 3, 'censo vacío = vigilancia vacía');

    // El resto de la suite, en un hijo: ventana de observación acotada y
    // conocida. Se excluye este fichero — vigilar al vigilante es recursión.
    const otros = ficherosDeLaSuite().filter((f) => f !== AQUI);
    assert.ok(otros.length >= 2, `nada que observar: ${otros.length} ficheros`);

    const base = censar(manifiestos, bases);
    const t0 = Date.now();
    // Sin limpiar NODE_TEST_CONTEXT el nieto se cree un worker del runner
    // padre: sale 0 en ~96 ms sin ejecutar NADA. Medido — y era un falso verde
    // silencioso hasta que la aserción de ventana de abajo lo delató.
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const hijo = spawn(process.execPath, ['--test', ...otros], {
      cwd: REPO,
      stdio: 'ignore',
      env
    });
    const salida = new Promise((res) => hijo.on('exit', (code) => res(code)));
    let corriendo = true;
    hijo.on('exit', () => {
      corriendo = false;
    });

    let muestras = 0;
    let desviacion = null;
    while (corriendo) {
      const ahora = censar(manifiestos, bases);
      muestras++;
      if (ahora !== base) {
        const b = base.split('\n');
        desviacion = ahora
          .split('\n')
          .map((l, i) => (l === b[i] ? null : `esperado \`${b[i]}\` · observado \`${l}\``))
          .filter(Boolean)
          .slice(0, 10);
        break;
      }
      await new Promise((r) => setImmediate(r));
    }
    const codigo = await salida;
    const duracion = Date.now() - t0;
    const resolucion = muestras > 0 ? Math.round(duracion / muestras) : Infinity;

    // Un hijo que muere al instante deja una ventana de cero muestras y el
    // guardián pasaría en verde sin haber mirado nada. Eso es un falso verde,
    // así que la ventana se asevera igual que el censo.
    assert.ok(
      duracion >= 500 && muestras >= 10,
      `ventana de observación insuficiente: ${muestras} muestras en ${duracion} ms ` +
        `(hijo salió ${codigo}). El verde no significaría nada.`
    );
    assert.equal(
      desviacion,
      null,
      `el árbol de trabajo se movió durante la suite (${muestras} muestras / ${duracion} ms):\n` +
        `${(desviacion || []).join('\n')}\n` +
        'Alguna suite de test/gates/ está escribiendo sobre rutas rastreadas.'
    );
    // El guardián declara su propia resolución en vez de afirmar que vigiló
    // «siempre»: es un muestreo, y una mutación más breve que este intervalo
    // puede escapársele. La que motivó el WP duraba ~1,3 s.
    assert.ok(resolucion <= 400, `resolución degradada: ${resolucion} ms/muestra`);
  }
);
