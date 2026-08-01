/**
 * WP-U252 — el conjunto de rutas que el gate `matriz-51` LEE, en UN solo sitio.
 *
 * Vivía duplicado: `matriz-51.test.mjs` lo usaba para materializar el árbol
 * commiteado y `arbol-inmutable.test.mjs` censaba «el conjunto de lectura del
 * gate»… pero censaba sólo los manifiestos, una cuarta parte. Un fichero como
 * `plan/PUBLISH-ALLOWLIST.md` —que el gate lee y del que depende media matriz—
 * podía renombrarse durante la suite con el guardián en verde. Dos definiciones
 * del mismo conjunto es una de más; ésta es la única.
 *
 * No es una suite: `test:gates` glob-ea `test/gates/*.test.mjs`. Sí entra en el
 * barrido del guardián estático, que vigila todo `test/gates/*.mjs`.
 */

import { execFileSync } from 'node:child_process';
import {
  CONTRASTE_PATH,
  ALLOWLIST_PATH,
  CATALOG_PATH,
  CATALOG_EXTEND_PATH
} from '../../scripts/gates/matriz-51.mjs';

/** Rutas que el gate lee y que no se derivan de un patrón del índice. */
export const LECTURAS_FIJAS = [
  'package.json',
  CONTRASTE_PATH,
  ALLOWLIST_PATH,
  CATALOG_PATH,
  CATALOG_EXTEND_PATH,
  // El propio gate: al vivir en <tmp>/scripts/gates/matriz-51.mjs su REPO_ROOT
  // (`path.resolve(__dirname, '../..')`, matriz-51.mjs:52) es <tmp>. Así el CLI
  // se ejercita de verdad —exit code incluido— sin tocar el repo.
  'scripts/gates/matriz-51.mjs'
];

/**
 * Directorios que el gate salta al enumerar. Espejo de `SKIP_DIRS`
 * (`scripts/gates/matriz-51.mjs:67-77`), que es privado del módulo y no se
 * puede importar. Si allí cambia, aquí hay que seguirlo: acoplamiento
 * declarado, no invisible.
 */
export const DIRS_IGNORADOS = new Set([
  'node_modules', 'dist', 'build', '.git', '.angular', '.worktrees',
  'coverage', '.turbo', 'vendor'
]);

/** Pathspecs de git que cubren el conjunto de lectura (para `git status`). */
export const PATHSPECS_LECTURA = [
  '*package.json',
  '*/src/server.mjs',
  '*/src/mcp-server.mjs',
  '*/src/start.mjs',
  ...LECTURAS_FIJAS
];

/**
 * @param {string} repoRoot
 * @returns {{ rutas: string[], bases: string[], rastreados: string[] }}
 *   `rutas` = todo lo que el gate lee (ordenado y sin duplicados);
 *   `bases` = bases de los globs de `workspaces` (cuyo readdir enumera piezas).
 */
export function conjuntoDeLectura(repoRoot) {
  const rastreados = execFileSync('git', ['ls-files', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  })
    .split('\0')
    .filter(Boolean);

  const rutas = [
    ...new Set([
      ...rastreados.filter((p) => p === 'package.json' || p.endsWith('/package.json')),
      ...rastreados.filter((p) => /\/src\/(server|mcp-server|start)\.mjs$/.test(p)),
      ...LECTURAS_FIJAS
    ])
  ].sort();

  const raiz = JSON.parse(
    execFileSync('git', ['cat-file', 'blob', 'HEAD:package.json'], {
      cwd: repoRoot,
      encoding: 'utf8'
    })
  );
  const bases = (Array.isArray(raiz.workspaces) ? raiz.workspaces : [])
    .filter((g) => g.endsWith('/*'))
    .map((g) => g.slice(0, -2));

  return { rutas, bases, rastreados };
}
