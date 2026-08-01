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
 *   1. ESTÁTICO — lee el fuente de cada `.mjs` de `test/gates/` y busca la
 *      OPERACIÓN (escribir, renombrar, borrar, crear) sobre una ruta anclada al
 *      repo, propagando taint por asignaciones. Determinista y sin ventana
 *      temporal, pero rodeable: ver LÍMITES abajo, donde los vectores de fuga
 *      están aseverados como fuga, no ocultos.
 *
 *   2. DINÁMICO — corre el resto de la suite en un hijo y censa el conjunto de
 *      lectura del gate mientras corre. Caza por EFECTO, así que no lo rodea
 *      ninguna indirección de CÓDIGO; pero sólo ve lo que censa (el conjunto de
 *      lectura) y muestrea, así que una mutación fuera de ese conjunto, o más
 *      corta que su intervalo, se le escapa. El test declara cuántas muestras
 *      tomó en vez de afirmar que vigiló «siempre».
 *
 * LO QUE ESTA CABECERA DECÍA Y ERA FALSO: «juntos cubren la fuga del otro».
 * No es un teorema, es una aspiración, y la contrarrevisión la rompió con el
 * idioma más corriente del repo —`import { join } from 'node:path'` sobre un
 * fichero del conjunto de lectura— que los cegaba A LOS DOS a la vez: al
 * estático porque sólo propagaba el ancla por `path.join` (miembro) y no por el
 * import con nombre, y al dinámico porque censaba los manifiestos llamándolos
 * «el conjunto de lectura» cuando eran un cuarto de él. Ambos agujeros están
 * cerrados y aseverados; la lección que queda es que la cobertura conjunta se
 * MIDE con vectores, no se declara en una cabecera.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { CAZADOS, LIMPIOS, FUGAS } from './fixtures/vectores-mutacion-u252.mjs';
import { FUENTE_HISTORICA, ORIGEN } from './fixtures/matriz-51-28397b8.mjs';
import { conjuntoDeLectura } from './conjunto-lectura.mjs';

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

/** Operaciones donde sólo se ESCRIBE el segundo argumento: copiar o enlazar
 *  DESDE el repo hacia un temporal es una lectura del repo, no una mutación.
 *  Marcar el origen inventa 7 ofensas de las 8 falsas medidas en el corpus. */
const SOLO_DESTINO = new Set([
  'cp', 'cpSync', 'copyFile', 'copyFileSync', 'link', 'linkSync', 'symlink', 'symlinkSync'
]);
/** `rename` es la excepción: además de escribir el destino BORRA el origen. */
const ORIGEN_Y_DESTINO = new Set(['rename', 'renameSync']);

/** Índices de los argumentos que la operación escribe. @param {string} op */
function argumentosEscritos(op) {
  if (ORIGEN_Y_DESTINO.has(op)) return [0, 1];
  if (SOLO_DESTINO.has(op)) return [1];
  return [0];
}

/** Expresiones que anclan una ruta al repo de trabajo. `mkdtempSync` sobre
 *  cualquiera de éstas NO es temporal: es un directorio dentro del repo. */
const SEMILLAS = ['REPO_ROOT', 'import.meta.url', 'import.meta.dirname', 'import.meta.filename',
  '__dirname', '__filename', 'process.cwd()'];

/** Subcomandos que hacen que un `git`/`npm` invocado desde un test escriba. */
const VERBOS_ESCRITORES = [
  ['git', /\b(checkout|apply|add|rm|mv|stash|reset|clean|restore|commit|switch)\b/],
  ['npm', /\b(install|ci|link|dedupe|prune|pkg)\b/]
];

/** Funciones de `node:path` que CONSTRUYEN una ruta a partir de otra. */
const CONSTRUCTORAS_DE_RUTA = ['join', 'resolve', 'normalize', 'dirname', 'format', 'toNamespacedPath'];

/**
 * Nombres locales que un fichero ata a `node:path`, `node:url` y `node:fs`.
 *
 * Por qué hace falta resolver los imports en vez de fijar `path.` y `fs.`: el
 * guardián reconocía el import CON NOMBRE de `fs` (`writeFileSync(…)`) pero no
 * el de `path` (`join(…)`), y esa asimetría no estaba escrita en ninguna parte.
 * Con ella, el idioma más corriente del repo —`import { join, dirname, resolve }
 * from 'node:path'`— cruzaba el guardián entero; y de hecho cruzaban DOS de los
 * cuatro mutadores del censo de este mismo WP (`parte-kit`). El import es un
 * detalle de estilo, no una excusa, en los dos módulos.
 *
 * @param {string} src @returns {{rutaFns: Set<string>, rutaNs: Set<string>, fsNs: Set<string>}}
 */
function enlacesDeModulo(src) {
  const rutaFns = new Set(['fileURLToPath']);
  const rutaNs = new Set(['path']);
  const fsNs = new Set(['fs', 'fsp', 'fsPromises']);
  const re = /import\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g;
  for (let m; (m = re.exec(src)); ) {
    const [, clausula, spec] = m;
    const esPath = /^(node:)?path(\/(posix|win32))?$/.test(spec);
    const esUrl = /^(node:)?url$/.test(spec);
    const esFs = /^(node:)?fs(\/promises)?$/.test(spec);
    if (!esPath && !esUrl && !esFs) continue;
    const ns = clausula.match(/^(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s*(?:,|$)/);
    if (ns) {
      if (esPath || esUrl) rutaNs.add(ns[1]);
      if (esFs) fsNs.add(ns[1]);
    }
    const llaves = clausula.match(/\{([\s\S]*?)\}/);
    if (!llaves) continue;
    for (const parte of llaves[1].split(',')) {
      const mm = parte.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
      if (!mm) continue;
      const [, original, alias] = mm;
      const local = alias || original;
      if (esPath && CONSTRUCTORAS_DE_RUTA.includes(original)) rutaFns.add(local);
      if (esUrl && original === 'fileURLToPath') rutaFns.add(local);
    }
  }
  return { rutaFns, rutaNs, fsNs };
}

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
function fragmentosDeRuta(rhs, enlaces) {
  const frags = [];
  const t = rhs.trim();
  if (/^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*$/.test(t)) frags.push(t); // alias directo
  const alternativas = [
    ...[...enlaces.rutaNs].map(
      (n) => `${n}\\s*\\.\\s*(?:${[...CONSTRUCTORAS_DE_RUTA, 'fileURLToPath'].join('|')})`
    ),
    ...enlaces.rutaFns
  ].join('|');
  const re = new RegExp(`(?:^|[^\\w$.])(?:${alternativas})\\s*\\(`, 'g');
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
function identificadoresAnclados(src, enlaces) {
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
      const frags = fragmentosDeRuta(rhs, enlaces);
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
  const enlaces = enlacesDeModulo(src);
  const anclados = identificadoresAnclados(src, enlaces);
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

  // `fs.X(`, `fsp.X(`, `<ns>.X(` de cualquier import de fs, `fs.promises.X(`
  // —que se escapaba entero— y `X(` suelto del import con nombre.
  const raizFs = [...enlaces.fsNs].join('|');
  for (const op of MUTADORES) {
    const re = new RegExp(
      `(?:\\b(?:${raizFs})(?:\\s*\\.\\s*promises)?\\s*\\.\\s*|(?:^|[^\\w$.]))${op}\\s*\\(`,
      'g'
    );
    for (let m; (m = re.exec(src)); ) {
      const abre = src.indexOf('(', m.index + m[0].length - 1);
      // Sólo los argumentos que SON rutas. El resto es contenido y opciones:
      // mirarlos convertiría cada `{ cwd: REPO_ROOT }` en un falso positivo.
      const partes = porArgumentos(argumentos(src, abre));
      const rutas = argumentosEscritos(op)
        .map((i) => partes[i])
        .filter(Boolean)
        .join(', ');
      const motivo = apuntaAlRepo(rutas);
      if (motivo) ofensas.push({ etiqueta, linea: linea(m.index), op, motivo, texto: recorta(rutas) });
    }
  }

  // Escritura por delegación: un `git`/`npm` con subcomando que escribe.
  const reSpawn = /\b(?:execFileSync|execFile|execSync|exec|spawnSync|spawn)\s*\(/g;
  for (let m; (m = reSpawn.exec(src)); ) {
    const args = argumentos(src, m.index + m[0].length - 1);
    // Un `cwd:` que NO apunta al repo manda la escritura a otra parte: un
    // `npm install` con `cwd: tmp` no toca el árbol. Sin esto el corpus daba
    // dos ofensas falsas más.
    const cwd = args.match(/(?:^|[\s{,])cwd\s*:\s*([^,}\n]+)/);
    if (cwd && !apuntaAlRepo(cwd[1])) continue;
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

/** Ficheros que `npm run test:gates` glob-ea y ejecuta. */
function ficherosDeLaSuite() {
  return fs
    .readdirSync(DIR_GATES)
    .filter((f) => f.endsWith('.test.mjs'))
    .sort()
    .map((f) => path.join(DIR_GATES, f));
}

/** Lo que el guardián estático BARRE: todo `.mjs` de `test/gates/`, no sólo las
 *  suites. Un módulo de apoyo que mutase el árbol mutaría igual. */
function ficherosVigilados() {
  return fs
    .readdirSync(DIR_GATES)
    .filter((f) => f.endsWith('.mjs'))
    .sort()
    .map((f) => path.join(DIR_GATES, f));
}

test('guardián estático: ningún test de gates escribe sobre el árbol de trabajo', () => {
  const segmentosRaiz = segmentosRaizRastreados();
  const ficheros = ficherosVigilados();
  assert.ok(ficheros.length >= 4, `la suite debe tener ficheros que vigilar: ${ficheros.length}`);

  // `test/gates/fixtures/` queda FUERA del barrido a propósito: guarda fuentes
  // de ataque como cadenas, y el guardián se denunciaría a sí mismo. La
  // exclusión no se deja a la buena fe — se comprueba que ahí no puede haber
  // mutación porque no se importa nada capaz de escribir.
  const dirFixtures = path.join(DIR_GATES, 'fixtures');
  for (const f of fs.readdirSync(dirFixtures)) {
    const texto = fs.readFileSync(path.join(dirFixtures, f), 'utf8');
    const importa = [...texto.matchAll(/(?:^|\n)\s*import\s[\s\S]*?from\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
    assert.deepEqual(
      importa.filter((s) => /^(node:)?(fs|child_process)(\/.*)?$/.test(s)),
      [],
      `test/gates/fixtures/${f} importa un módulo capaz de escribir: o deja de hacerlo o entra al barrido`
    );
  }

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

/**
 * SHA-1 del blob que git guardaría para este contenido. Es `sha1("blob <n>\0" +
 * bytes)`, una función del CONTENIDO: no consulta la base de objetos, así que
 * responde igual en un clon superficial que en uno completo. Se lo pedimos a
 * git —que ya es dependencia dura de este fichero, ver `segmentosRaizRastreados`—
 * para no tener que fiarse de una reimplementación de la fórmula.
 * @param {string} texto @returns {string}
 */
function oidDeBlob(texto) {
  return execFileSync('git', ['hash-object', '-t', 'blob', '--stdin'], {
    cwd: REPO,
    input: Buffer.from(texto, 'utf8'),
    encoding: 'utf8'
  }).trim();
}

/**
 * Las mutaciones del árbol que aquel fichero hacía, `línea·operación`:
 * la pieza fantasma bajo `packages/mesh/` (99-100), su borrado (130) y el
 * renombrado del manifiesto rastreado con su reversión (139, 153).
 */
const FIRMA_HISTORICA = ['99·mkdirSync', '100·writeFileSync', '130·rmSync', '139·renameSync', '153·renameSync'];

test('el guardián estático se pone rojo con el defecto histórico real (28397b8)', () => {
  // Vector no sintético: el propio fichero que causó el bloqueante, tal y como
  // estaba commiteado antes de U252. Si el guardián no lo caza, no sirve.
  //
  // WP-U260 — esto era `execFileSync('git', ['show', '28397b8:…'])`, y por eso
  // el guardián estaba VERDE en local y ROJO en CI. `actions/checkout@v4` clona
  // con `fetch-depth: 1` en los tres checkouts de `.github/workflows/ci.yml`:
  // el objeto `28397b8` —14 commits por detrás— no está en el runner, y git
  // contestaba `fatal: invalid object name '28397b8'`. Un guardián que sólo
  // puede probarse donde no falla no está probado. El vector viaja ahora con
  // el repo, así que no depende de la profundidad del clon ni del historial.
  const historico = FUENTE_HISTORICA;

  // La fixture no se cree de palabra. Si alguien la retoca para apagar un rojo
  // —o vendoriza una revisión que ya no reproduce el defecto— el hash lo dice.
  // Esta comprobación corre en TODA condición, también en el clon superficial.
  assert.equal(
    oidDeBlob(historico),
    ORIGEN.oid,
    `la fixture ya no es el blob de ${ORIGEN.rev}:${ORIGEN.ruta}: fue editada`
  );

  const ofensas = ofensasDeFuente(historico, `${ORIGEN.ruta}@${ORIGEN.rev}`, segmentosRaizRastreados());
  const ops = ofensas.map((o) => o.op);
  assert.ok(ofensas.length >= 3, `esperaba cazar el defecto histórico: ${JSON.stringify(ofensas, null, 2)}`);
  assert.ok(ops.includes('renameSync'), `el renombrado del manifiesto rastreado debe salir: ${ops.join(', ')}`);
  assert.ok(ops.includes('mkdirSync'), `la pieza fantasma debe salir: ${ops.join(', ')}`);
  // y la indirección por variable —`const manifest = path.join(REPO_ROOT,…)`—
  // es justo lo que un scan de texto ingenuo se traga.
  assert.ok(ofensas.some((o) => /identificador anclado/.test(o.motivo)));

  // Y las CINCO mutaciones, con su línea. Medido: con `>= 3` + `includes` una
  // fixture retocada para neutralizar UNA de las dos `renameSync` seguía dando
  // verde, porque la otra sostenía el `includes` sola. El fuente está congelado
  // —es un blob de 2026-08-01— así que estas líneas no pueden moverse por
  // ninguna razón legítima, y en cambio cualquier retoque las rompe. Va como
  // subconjunto, no como lista cerrada, para que afilar el guardián —que
  // encontraría MÁS ofensas en el mismo fichero— no obligue a tocar este test.
  const firma = new Set(ofensas.map((o) => `${o.linea}·${o.op}`));
  for (const esperada of FIRMA_HISTORICA) {
    assert.ok(
      firma.has(esperada),
      `la fixture ya no reproduce el defecto en ${esperada}: es otro fichero, no el de ${ORIGEN.rev}\n` +
        `  observado: ${[...firma].join(', ')}`
    );
  }
});

/**
 * Procedencia de la fixture, cuando el historial está delante.
 *
 * Qué añade y qué NO. El test de arriba ya ata contenido↔OID y corre en todas
 * partes; el guardián NO se apaga en ningún sitio. Lo único que aquí se puede
 * preguntar de más es si ese OID es el que vivía en `rev:ruta` — un hecho del
 * HISTORIAL, y un clon superficial no tiene historial que consultar. No es la
 * guarda desactivada en CI: es una pregunta distinta que CI no está en
 * condiciones de formular, y se declara cuál de las dos ramas corrió en vez de
 * salir verde en silencio. Cierra el hueco que el hash no puede cerrar solo:
 * una fixture manipulada CON su OID recalculado, que a `oidDeBlob` le cuadra.
 *
 * LÍMITE, escrito porque es real: en un clon superficial esa manipulación
 * coordinada NO se caza aquí —no hay historial contra el que confrontar— y sólo
 * la para `FIRMA_HISTORICA`, que exige que las cinco mutaciones sigan estando.
 * En cualquier clon completo —toda máquina de desarrollo— sí se caza.
 */
test('procedencia: donde hay historial, la fixture se confronta con el objeto real', (t) => {
  // La sonda pregunta por el COMMIT, no por `ORIGEN.oid`. Medido: preguntando
  // por el OID declarado, una fixture manipulada con su hash recalculado se
  // contestaba a sí misma —ese OID forjado tampoco está en la base de objetos,
  // así que el test lo tomaba por «clon superficial» y salía verde. La sonda
  // tiene que ser independiente de lo que se está verificando.
  // Se pregunta por el TIPO en vez de por `-e … ^{commit}`, que sería lo
  // natural: el guardián estático de este mismo fichero lee `^{commit}` dentro
  // de los argumentos de un `git` y ve la palabra `commit`, o sea un subcomando
  // que escribe, y se pone rojo. Es un falso positivo suyo —`^{…}` es un pelado
  // de revisión, no un subcomando— pero desafilar la regla para colocar aquí un
  // idioma más bonito sale mucho más caro que rodearla. Queda escrito.
  const hayHistorial = spawnSync('git', ['cat-file', '-t', ORIGEN.rev], { cwd: REPO, encoding: 'utf8' });
  assert.equal(hayHistorial.error, undefined, `git no respondió: ${hayHistorial.error}`);

  if (hayHistorial.status !== 0) {
    // Clon superficial. Que git sí resuelva HEAD separa «esa revisión no está»
    // —lo esperado— de «git no está» o «esto no es un repo», que dejarían este
    // test mudo por un motivo completamente distinto y sin que nadie se entere.
    const vivo = spawnSync('git', ['cat-file', '-t', 'HEAD'], { cwd: REPO, encoding: 'utf8' });
    assert.equal(vivo.status, 0, `git no resuelve ni HEAD (${vivo.status}): la sonda no dice nada del historial`);
    t.diagnostic(`historial ausente (clon superficial): ${ORIGEN.rev} no alcanzable, procedencia no confrontable`);
    return;
  }
  assert.equal(hayHistorial.stdout.trim(), 'commit', `${ORIGEN.rev} no es una revisión: ${hayHistorial.stdout}`);

  const oidEnRevision = execFileSync('git', ['rev-parse', `${ORIGEN.rev}:${ORIGEN.ruta}`], {
    cwd: REPO,
    encoding: 'utf8'
  }).trim();
  assert.equal(
    oidEnRevision,
    ORIGEN.oid,
    `${ORIGEN.rev}:${ORIGEN.ruta} es ${oidEnRevision}: la fixture declara otro OID, vendoriza otra revisión`
  );
  const real = execFileSync('git', ['cat-file', 'blob', oidEnRevision], {
    cwd: REPO,
    encoding: 'buffer',
    maxBuffer: 16 * 1024 * 1024
  });
  assert.equal(Buffer.from(FUENTE_HISTORICA, 'utf8').compare(real), 0, 'la fixture no coincide byte a byte con el blob');
  t.diagnostic(`historial presente: ${ORIGEN.rev}:${ORIGEN.ruta} confrontado byte a byte`);
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
 * Censo del conjunto de lectura del gate: existencia + tamaño + mtime de CADA
 * ruta que el gate lee —no sólo los manifiestos— más el contenido de los
 * directorios de nivel 1 bajo los globs de `workspaces` (para ver aparecer una
 * pieza fantasma).
 *
 * Censaba sólo los manifiestos y el comentario decía «el conjunto de lectura del
 * gate»: una cuarta parte con nombre de entero. `plan/PUBLISH-ALLOWLIST.md` se
 * podía renombrar 1,5 s con el guardián en verde. La lista viene ahora de
 * `conjuntoDeLectura`, que es la MISMA que usa la materialización.
 * @param {string[]} rutas @param {string[]} bases @returns {string}
 */
function censar(rutas, bases) {
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
  for (const rel of rutas) {
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
    const { rutas, bases } = conjuntoDeLectura(REPO);
    assert.ok(rutas.length >= 60 && bases.length >= 3, 'censo vacío = vigilancia vacía');

    // El resto de la suite, en un hijo: ventana de observación acotada y
    // conocida. Se excluye este fichero — vigilar al vigilante es recursión.
    const otros = ficherosDeLaSuite().filter((f) => f !== AQUI);
    assert.ok(otros.length >= 2, `nada que observar: ${otros.length} ficheros`);

    const base = censar(rutas, bases);
    const t0 = Date.now();
    // Sin limpiar NODE_TEST_CONTEXT el nieto se cree un worker del runner
    // padre: sale 0 en ~96 ms sin ejecutar NADA. Medido — y era un falso verde
    // silencioso hasta que la aserción de ventana de abajo lo delató.
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const hijo = spawn(process.execPath, ['--test', ...otros], {
      cwd: REPO,
      stdio: ['ignore', 'pipe', 'pipe'],
      env
    });
    let tap = '';
    hijo.stdout.on('data', (c) => {
      tap += c;
    });
    hijo.stderr.on('data', () => {});
    const salida = new Promise((res) => hijo.on('exit', (code) => res(code)));
    let corriendo = true;
    hijo.on('exit', () => {
      corriendo = false;
    });

    let muestras = 0;
    let desviacion = null;
    while (corriendo) {
      const ahora = censar(rutas, bases);
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

    // Oráculo del hijo. Un hijo que no ejecuta nada sale 0 y el guardián daría
    // verde habiendo supervisado una suite que no prueba nada. La duración NO
    // sirve para cerrar esa clase: medido, un hijo vacuo cuesta ~250 ms en
    // descarga pero 4-8 s bajo carga, o sea POR ENCIMA de cualquier umbral
    // temporal razonable justo en la condición en la que este guardián corre.
    // Lo que no depende de la carga es cuántos tests dijo haber corrido.
    const declarados = Number((tap.match(/^# tests (\d+)$/m) || [])[1] ?? NaN);
    assert.equal(codigo, 0, `el hijo salió ${codigo}: la observación no es fiable\n${tap.slice(-1200)}`);
    assert.ok(
      declarados >= 40,
      `el hijo declaró ${declarados} tests (esperaba ≥40 de ${otros.length} ficheros): ` +
        'salió con éxito sin trabajar, y vigilar eso no significa nada'
    );
    assert.ok(muestras >= 10, `sólo ${muestras} muestras en ${duracion} ms`);
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
