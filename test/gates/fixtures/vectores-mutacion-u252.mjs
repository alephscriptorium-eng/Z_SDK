/**
 * WP-U252 — vectores de ataque contra el guardián estático de
 * `test/gates/arbol-inmutable.test.mjs`, como DATOS.
 *
 * Viven fuera de `test/gates/*.test.mjs` a propósito: son fuentes sintéticos
 * que escriben sobre el árbol, y si estuvieran dentro del fichero del guardián
 * éste se denunciaría a sí mismo. `npm run test:gates` glob-ea
 * `test/gates/*.test.mjs` (no recursivo), así que este módulo es dato, no suite.
 *
 * Cada entrada es `[nombre, fuente]`. Los tres grupos se aseveran distinto:
 *   - CAZADOS  → el guardián DEBE marcarlos;
 *   - LIMPIOS  → el guardián NO debe marcarlos (un guardián que pinta de rojo
 *                el arnés correcto obliga a desactivarlo);
 *   - FUGAS    → el guardián NO los caza, y se asevera que no los caza para
 *                que su alcance quede escrito. El guardián dinámico sí los ve.
 */

/** Rodeos que el guardián estático debe cazar. @type {[string, string][]} */
export const CAZADOS = [
  ['directo', "fs.renameSync(path.join(REPO_ROOT, 'a'), 'b');"],
  ['indirección por variable', "const m = path.join(REPO_ROOT, 'a');\nfs.renameSync(m, 'b');"],
  [
    'indirección en cadena + plantilla',
    "const r = REPO_ROOT;\nconst m = path.join(r, 'a');\nconst o = `${m}.bak`;\nfs.renameSync(m, o);"
  ],
  ['ruta literal del repo, sin ancla', "fs.rmSync('packages/mesh/blob-sync-harness/package.json');"],
  [
    'import con nombre, sin `fs.`',
    "import { writeFileSync } from 'node:fs';\nwriteFileSync(path.join(REPO_ROOT, 'x'), '');"
  ],
  [
    'mkdtemp que parece temporal pero cuelga del repo',
    "const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');\nconst tmp = fs.mkdtempSync(path.join(root, '.scratch-'));"
  ],
  [
    'destino anclado con origen temporal',
    "const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x-'));\nfs.cpSync(d, path.join(REPO_ROOT, 'packages', 'mesh'), { recursive: true });"
  ],
  ['iteración sobre una lista anclada', "const dirs = [path.join(REPO_ROOT, 'a')];\nfor (const d of dirs) fs.rmSync(d);"],
  ['chdir + ruta literal del repo', "process.chdir(REPO_ROOT);\nfs.renameSync('packages/x/package.json', 'z');"],
  ['escritura delegada a git', "execFileSync('git', ['mv', a, b], { cwd: REPO_ROOT });"],
  ['escritura delegada a npm', "spawnSync('npm', ['install', '-w', '@zeus/x'], { cwd: REPO_ROOT });"],
  // --- El idioma corriente del repo. Cruzaba el guardián ENTERO, y con él dos
  // --- de los cuatro mutadores del censo de este mismo WP (parte-kit).
  [
    'import CON NOMBRE de node:path (el vector que se me escapó)',
    "import { join, dirname, resolve } from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');\nconst v = join(RAIZ, 'plan', 'PUBLISH-ALLOWLIST.md');\nfs.renameSync(v, v + '.oculto');"
  ],
  [
    'import con nombre y alias',
    "import { join as unir } from 'node:path';\nconst d = unir(REPO_ROOT, 'packages');\nfs.rmSync(d, { recursive: true });"
  ],
  [
    'espacio de nombres de path con otro nombre',
    "import * as p from 'node:path';\nconst d = p.join(REPO_ROOT, 'plan');\nfs.rmSync(d);"
  ],
  [
    'fs.promises (la rama de la API que no se miraba)',
    "const m = path.join(REPO_ROOT, 'plan', 'MATRIZ-RUNTIME-51.md');\nawait fs.promises.rename(m, m + '.bak');"
  ],
  [
    'node:fs/promises con import por defecto renombrado',
    "import fsPromesas from 'node:fs/promises';\nconst m = path.join(REPO_ROOT, 'package.json');\nawait fsPromesas.writeFile(m, '{}');"
  ]
];

/** Arnés legítimo: NINGUNO debe marcarse. @type {[string, string][]} */
export const LIMPIOS = [
  [
    'árbol temporal de verdad',
    "const d = fs.mkdtempSync(path.join(os.tmpdir(), 'x-'));\nfs.writeFileSync(path.join(d, 'package.json'), '{}');\nfs.rmSync(d, { recursive: true });"
  ],
  ['raíz recibida por parámetro', 'function probe(root) {\n  fs.renameSync(path.join(root, "a"), path.join(root, "b"));\n}'],
  [
    'git de sólo lectura con cwd en el repo',
    "execFileSync('git', ['ls-files', '-z'], { cwd: REPO_ROOT });\nexecFileSync('git', ['cat-file', '--batch'], { cwd: REPO_ROOT });"
  ],
  [
    'volcado a temporal de un blob leído con cwd en el repo',
    "const out = execFileSync('git', ['cat-file', '--batch'], { cwd: REPO_ROOT });\nconst abs = path.join(tmp, rel);\nfs.writeFileSync(abs, out.subarray(0, 10));"
  ],
  ['lectura anclada al repo', "const p = path.join(REPO_ROOT, 'package.json');\nconst t = fs.readFileSync(p, 'utf8');"],
  ['spawn de sólo lectura del gate', "spawnSync(process.execPath, [GATE, '--json'], { cwd: REPO_ROOT });"]
];

/**
 * Vectores que se le ESCAPAN. Aseverados como fuga: la afirmación del guardián
 * no debe ser más ancha que su evidencia. Quien cierre uno vendrá aquí a dar
 * la vuelta a su test.
 * @type {[string, string][]}
 */
export const FUGAS = [
  // Los argumentos van ANCLADOS a propósito. Con `(a, b)` sueltos el test era
  // tautológico: no había forma de que se pusiera rojo ni cerrando la vía por
  // completo, porque tampoco había ruta que reconocer. Así, lo único que lo
  // salva del detector es el nombre construido — cierra eso y el test gira.
  [
    'acceso computado a la API',
    "const m = path.join(REPO_ROOT, 'plan', 'PUBLISH-ALLOWLIST.md');\nfs['rename' + 'Sync'](m, m + '.oculto');"
  ],
  [
    'ruta cruzando frontera de módulo',
    "import { ocultar } from './helper.mjs';\nocultar(path.join(REPO_ROOT, 'a'));"
  ],
  ['chdir + ruta relativa sin forma de repo', "process.chdir(REPO_ROOT);\nfs.renameSync(nombre, destino);"],
  ['ruta reconstruida en caliente', "fs.rmSync(['packages', 'mesh', 'x'].join('/') + '/package.json');"]
];
